'use strict';

const { sequelize } = require('../models');
const solicitacaoRepository = require('../repositories/solicitacaoRepository');
const animalRepository = require('../repositories/animalRepository');
const animalService = require('./animalService');
const emailService = require('./emailService');
const protocolo = require('../domain/protocolo');
const statusAnimal = require('../domain/statusAnimal');
const statusSolicitacao = require('../domain/statusSolicitacao');
const { ErroDeNegocio, ErroNaoEncontrado } = require('../domain/erros');
const logger = require('../config/logger');

const { STATUS } = statusSolicitacao;

/** RN03 - gera o proximo protocolo do ano dentro da mesma transacao do INSERT. */
async function gerarProtocolo(transaction) {
  const ano = new Date().getFullYear();
  const ultimo = await solicitacaoRepository.ultimoProtocoloDoAno(ano, transaction);
  return protocolo.proximo(ano, ultimo);
}

/**
 * RF04 / UC04 - registra o interesse do visitante.
 * RN01: so animal DISPONIVEL recebe pedido.
 * RN02: o mesmo e-mail nao pode ter dois pedidos em aberto para o mesmo animal.
 * RN03: devolve o protocolo, que nunca muda.
 */
async function registrarInteresse(idAnimal, dados) {
  return sequelize.transaction(async (t) => {
    const animal = await animalRepository.buscarSimples(idAnimal, t);

    if (!animal || !animal.ativo) {
      throw new ErroNaoEncontrado('Este animal não está mais publicado.');
    }

    // RN01
    if (animal.situacao !== statusAnimal.SITUACAO.DISPONIVEL) {
      throw new ErroDeNegocio(
        `${animal.nome} não está disponível para adoção no momento (${statusAnimal.rotulo(animal.situacao).toLowerCase()}).`,
        'ANIMAL_INDISPONIVEL'
      );
    }

    // RN02
    const jaTemPedido = await solicitacaoRepository.existeEmAberto(idAnimal, dados.email, t);
    if (jaTemPedido) {
      throw new ErroDeNegocio(
        `Já existe um pedido em aberto para ${animal.nome} com este e-mail. Acompanhe pelo protocolo que você recebeu.`,
        'PEDIDO_DUPLICADO'
      );
    }

    const numero = await gerarProtocolo(t);

    const solicitacao = await solicitacaoRepository.criar({
      id_animal: idAnimal,
      protocolo: numero,
      nome_interessado: dados.nome_interessado.trim(),
      email: dados.email.trim().toLowerCase(),
      telefone: dados.telefone.trim(),
      cidade: dados.cidade.trim(),
      uf: dados.uf.toUpperCase(),
      tipo_moradia: dados.tipo_moradia,
      possui_outros_animais: Boolean(dados.possui_outros_animais),
      mensagem: (dados.mensagem || '').trim() || null,
      status: STATUS.PENDENTE
    }, t);

    // RNF07 - o historico comeca junto com a solicitacao
    await solicitacaoRepository.registrarHistorico({
      id_solicitacao: solicitacao.id_solicitacao,
      id_usuario: null,
      status_anterior: null,
      status_novo: STATUS.PENDENTE,
      observacao: 'Solicitação registrada pelo formulário público.'
    }, t);

    logger.info(`Solicitação ${numero} criada para o animal ${idAnimal}.`);
    return solicitacao;
  });
}

/** RF05 / UC05 - consulta publica por protocolo + e-mail. */
async function consultarPorProtocolo(numeroProtocolo, email) {
  if (!protocolo.valido(numeroProtocolo)) {
    throw new ErroDeNegocio('O protocolo tem o formato AAAA-NNNNNN, como 2026-000148.', 'PROTOCOLO_INVALIDO');
  }
  const solicitacao = await solicitacaoRepository.buscarPorProtocoloEEmail(numeroProtocolo, email);
  if (!solicitacao) {
    throw new ErroNaoEncontrado('Não encontramos um pedido com esse protocolo e esse e-mail.');
  }
  return solicitacao;
}

async function listar(filtros = {}, pagina = 1) {
  const numero = Number.parseInt(pagina, 10);
  return solicitacaoRepository.listar({
    filtros,
    pagina: Number.isInteger(numero) && numero > 0 ? numero : 1
  });
}

async function buscar(idSolicitacao) {
  const solicitacao = await solicitacaoRepository.buscarPorId(idSolicitacao);
  if (!solicitacao) throw new ErroNaoEncontrado('Solicitação não encontrada.');
  return solicitacao;
}

/**
 * RF11 / UC11 - registra a decisao e grava o historico sozinho.
 * RN04: aprovar coloca o animal em EM_PROCESSO e os demais pedidos seguem esperando.
 * RN05: concluir coloca o animal em ADOTADO e recusa os outros pedidos em aberto.
 * RN06: cancelar um pedido aprovado devolve o animal para DISPONIVEL.
 * RN10: recusar ou cancelar exige observacao interna.
 */
async function registrarDecisao(idSolicitacao, novoStatus, observacao, usuarioLogado) {
  const resultado = await sequelize.transaction(async (t) => {
    const solicitacao = await solicitacaoRepository.buscarPorId(idSolicitacao, t);
    if (!solicitacao) throw new ErroNaoEncontrado('Solicitação não encontrada.');

    const statusAnterior = solicitacao.status;
    statusSolicitacao.garantirTransicao(statusAnterior, novoStatus, observacao); // inclui a RN10

    const decisaoFinal = [STATUS.APROVADA, STATUS.REJEITADA, STATUS.CONCLUIDA, STATUS.CANCELADA]
      .includes(novoStatus);

    await solicitacaoRepository.atualizarStatus(idSolicitacao, {
      status: novoStatus,
      id_usuario_responsavel: usuarioLogado.id_usuario,
      data_decisao: decisaoFinal ? new Date() : solicitacao.data_decisao
    }, t);

    await solicitacaoRepository.registrarHistorico({
      id_solicitacao: idSolicitacao,
      id_usuario: usuarioLogado.id_usuario,
      status_anterior: statusAnterior,
      status_novo: novoStatus,
      observacao: (observacao || '').trim() || null
    }, t);

    const efeitos = [];

    if (novoStatus === STATUS.APROVADA) {
      // RN04
      await animalService.alterarSituacao(solicitacao.id_animal, statusAnimal.SITUACAO.EM_PROCESSO, t);
      efeitos.push(`${solicitacao.animal.nome} passou para "Em processo".`);
    }

    if (novoStatus === STATUS.CONCLUIDA) {
      // RN05
      await animalService.alterarSituacao(solicitacao.id_animal, statusAnimal.SITUACAO.ADOTADO, t);
      const outras = await solicitacaoRepository.listarEmAbertoDoAnimal(solicitacao.id_animal, idSolicitacao, t);

      for (const outra of outras) {
        // eslint-disable-next-line no-await-in-loop
        await solicitacaoRepository.atualizarStatus(outra.id_solicitacao, {
          status: STATUS.REJEITADA,
          id_usuario_responsavel: usuarioLogado.id_usuario,
          data_decisao: new Date()
        }, t);
        // eslint-disable-next-line no-await-in-loop
        await solicitacaoRepository.registrarHistorico({
          id_solicitacao: outra.id_solicitacao,
          id_usuario: usuarioLogado.id_usuario,
          status_anterior: outra.status,
          status_novo: STATUS.REJEITADA,
          observacao: `Recusado automaticamente: ${solicitacao.animal.nome} foi adotado pelo pedido ${solicitacao.protocolo}.`
        }, t);
      }

      efeitos.push(`${solicitacao.animal.nome} passou para "Adotado".`);
      if (outras.length) {
        efeitos.push(`${outras.length} pedido(s) em aberto foram recusados automaticamente.`);
      }
    }

    if (novoStatus === STATUS.CANCELADA && statusAnterior === STATUS.APROVADA) {
      // RN06
      await animalService.alterarSituacao(solicitacao.id_animal, statusAnimal.SITUACAO.DISPONIVEL, t);
      efeitos.push(`${solicitacao.animal.nome} voltou para "Disponível".`);
    }

    logger.info(
      `Solicitação ${solicitacao.protocolo}: ${statusAnterior} -> ${novoStatus} por ${usuarioLogado.email}.`
    );

    return { solicitacao, statusAnterior, novoStatus, efeitos };
  });

  // RF15 / UC14 - o aviso sai depois da transacao: falha de e-mail nao desfaz a decisao.
  try {
    await emailService.notificarMudancaDeStatus(resultado.solicitacao, novoStatus, observacao);
  } catch (erro) {
    logger.error(`Falha ao avisar ${resultado.solicitacao.email}: ${erro.message}`);
  }

  return resultado;
}

module.exports = {
  gerarProtocolo,
  registrarInteresse,
  consultarPorProtocolo,
  listar,
  buscar,
  registrarDecisao
};
