'use strict';

const { sequelize } = require('../models');
const animalRepository = require('../repositories/animalRepository');
const solicitacaoRepository = require('../repositories/solicitacaoRepository');
const fotoRepository = require('../repositories/fotoRepository');
const statusAnimal = require('../domain/statusAnimal');
const { ErroNaoEncontrado, ErroDeNegocio } = require('../domain/erros');
const logger = require('../config/logger');

const POR_PAGINA_PUBLICO = 9;
const POR_PAGINA_ADMIN = 12;

function paginaValida(valor) {
  const numero = Number.parseInt(valor, 10);
  return Number.isInteger(numero) && numero > 0 ? numero : 1;
}

/** RF01/RF02 - catalogo publico: so animais DISPONIVEL (RN01). */
async function listarPublico(filtros = {}, pagina = 1) {
  return animalRepository.listar({
    filtros,
    pagina: paginaValida(pagina),
    porPagina: POR_PAGINA_PUBLICO,
    somentePublico: true
  });
}

async function listarAdmin(filtros = {}, pagina = 1) {
  return animalRepository.listar({
    filtros,
    pagina: paginaValida(pagina),
    porPagina: POR_PAGINA_ADMIN,
    somentePublico: false
  });
}

async function listarDestaques(limite = 4) {
  return animalRepository.listarDestaques(limite);
}

/** RF03 - perfil publico. Animal inativo nao aparece para o visitante. */
async function buscarPublico(idAnimal) {
  const animal = await animalRepository.buscarPorId(idAnimal, { publico: true });
  if (!animal) throw new ErroNaoEncontrado('Este animal não está mais publicado.');
  return animal;
}

async function buscarParaEdicao(idAnimal) {
  const animal = await animalRepository.buscarPorId(idAnimal);
  if (!animal) throw new ErroNaoEncontrado('Animal não encontrado.');
  return animal;
}

async function cadastrar(dados, idUsuarioCadastro) {
  return sequelize.transaction(async (t) => {
    const animal = await animalRepository.criar({
      id_especie: dados.id_especie,
      id_raca: dados.id_raca || null,
      id_usuario_cadastro: idUsuarioCadastro,
      nome: dados.nome,
      sexo: dados.sexo,
      porte: dados.porte,
      idade_meses: dados.idade_meses,
      data_resgate: dados.data_resgate || null,
      castrado: Boolean(dados.castrado),
      vacinado: Boolean(dados.vacinado),
      vermifugado: Boolean(dados.vermifugado),
      descricao: dados.descricao || null,
      situacao: dados.situacao || statusAnimal.SITUACAO.DISPONIVEL
    }, t);

    await animalRepository.definirCaracteristicas(animal, dados.caracteristicas || [], t);
    logger.info(`Animal ${animal.id_animal} (${animal.nome}) cadastrado pelo usuário ${idUsuarioCadastro}.`);
    return animal;
  });
}

/**
 * Edicao. A situacao NAO muda por aqui: ela tem caminho proprio (RF09),
 * para que nenhum valor entre no banco fora da maquina de estados.
 */
async function editar(idAnimal, dados) {
  const animal = await buscarParaEdicao(idAnimal);

  return sequelize.transaction(async (t) => {
    const atualizado = await animalRepository.atualizar(animal.id_animal, {
      id_especie: dados.id_especie,
      id_raca: dados.id_raca || null,
      nome: dados.nome,
      sexo: dados.sexo,
      porte: dados.porte,
      idade_meses: dados.idade_meses,
      data_resgate: dados.data_resgate || null,
      castrado: Boolean(dados.castrado),
      vacinado: Boolean(dados.vacinado),
      vermifugado: Boolean(dados.vermifugado),
      descricao: dados.descricao || null
    }, t);

    await animalRepository.definirCaracteristicas(atualizado, dados.caracteristicas || [], t);
    return atualizado;
  });
}

/** RF09 - muda a situacao apenas para as permitidas a partir da atual. */
async function alterarSituacao(idAnimal, novaSituacao, transactionExterna = null) {
  const executar = async (t) => {
    const animal = await animalRepository.buscarSimples(idAnimal, t);
    if (!animal) throw new ErroNaoEncontrado('Animal não encontrado.');
    statusAnimal.garantirTransicao(animal.situacao, novaSituacao);
    const atualizado = await animalRepository.atualizar(idAnimal, { situacao: novaSituacao }, t);
    logger.info(`Animal ${idAnimal}: ${animal.situacao} -> ${novaSituacao}.`);
    return atualizado;
  };

  return transactionExterna ? executar(transactionExterna) : sequelize.transaction(executar);
}

/**
 * RN07 - exclusao. Com solicitacoes vinculadas o registro e inativado;
 * sem vinculo, e apagado de fato (junto com as fotos, por CASCADE).
 */
async function excluir(idAnimal) {
  const animal = await buscarParaEdicao(idAnimal);

  return sequelize.transaction(async (t) => {
    const vinculadas = await solicitacaoRepository.contarPorAnimal(idAnimal, t);

    if (vinculadas > 0) {
      await animalRepository.inativar(idAnimal, t);
      logger.info(`Animal ${idAnimal} inativado (${vinculadas} solicitações vinculadas).`);
      return { acao: 'INATIVADO', nome: animal.nome, solicitacoes: vinculadas };
    }

    await animalRepository.remover(idAnimal, t);
    logger.info(`Animal ${idAnimal} excluído (sem solicitações vinculadas).`);
    return { acao: 'EXCLUIDO', nome: animal.nome, solicitacoes: 0 };
  });
}

async function reativar(idAnimal) {
  const animal = await buscarParaEdicao(idAnimal);
  if (animal.ativo) throw new ErroDeNegocio('Este animal já está ativo.', 'JA_ATIVO');
  return animalRepository.atualizar(idAnimal, { ativo: true, situacao: statusAnimal.SITUACAO.DISPONIVEL });
}

/** Dados de apoio dos formularios e dos filtros. */
async function opcoesDeFiltro() {
  const [especies, racas, caracteristicas] = await Promise.all([
    animalRepository.listarEspecies(),
    animalRepository.listarRacas(),
    animalRepository.listarCaracteristicas()
  ]);
  return { especies, racas, caracteristicas };
}

/** Usada pelos filtros de solicitacoes e atendimentos. */
async function listarParaSelecao() {
  return animalRepository.listarParaSelecao();
}

async function fotosDoAnimal(idAnimal) {
  return fotoRepository.listarPorAnimal(idAnimal);
}

module.exports = {
  POR_PAGINA_PUBLICO,
  POR_PAGINA_ADMIN,
  listarPublico,
  listarAdmin,
  listarDestaques,
  buscarPublico,
  buscarParaEdicao,
  cadastrar,
  editar,
  alterarSituacao,
  excluir,
  reativar,
  opcoesDeFiltro,
  listarParaSelecao,
  fotosDoAnimal
};
