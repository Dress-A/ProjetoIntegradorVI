'use strict';

const animalRepository = require('../repositories/animalRepository');
const solicitacaoRepository = require('../repositories/solicitacaoRepository');
const statusAnimal = require('../domain/statusAnimal');
const statusSolicitacao = require('../domain/statusSolicitacao');

/** RF16 - numeros da operacao. */
async function resumo() {
  const [animaisPorSituacao, solicitacoesPorStatus, recentes] = await Promise.all([
    animalRepository.contarPorSituacao(),
    solicitacaoRepository.contarPorStatus(),
    solicitacaoRepository.listarRecentes(6)
  ]);

  const animais = statusAnimal.listar().map((situacao) => ({
    chave: situacao,
    rotulo: statusAnimal.rotulo(situacao),
    total: animaisPorSituacao[situacao] || 0
  }));

  const solicitacoes = statusSolicitacao.listar().map((status) => ({
    chave: status,
    rotulo: statusSolicitacao.rotulo(status),
    total: solicitacoesPorStatus[status] || 0
  }));

  const totalAnimais = animais.reduce((soma, item) => soma + item.total, 0);
  const totalSolicitacoes = solicitacoes.reduce((soma, item) => soma + item.total, 0);
  const aguardando = (solicitacoesPorStatus.PENDENTE || 0) + (solicitacoesPorStatus.EM_ANALISE || 0);

  return {
    animais,
    solicitacoes,
    totalAnimais,
    totalSolicitacoes,
    aguardando,
    adocoesConcluidas: solicitacoesPorStatus.CONCLUIDA || 0,
    recentes
  };
}

module.exports = { resumo };
