'use strict';

const { ErroDeNegocio } = require('./erros');

/** Situacoes da solicitacao de adocao (secao 6 do relatorio). */
const STATUS = {
  PENDENTE: 'PENDENTE',
  EM_ANALISE: 'EM_ANALISE',
  APROVADA: 'APROVADA',
  REJEITADA: 'REJEITADA',
  CONCLUIDA: 'CONCLUIDA',
  CANCELADA: 'CANCELADA'
};

const ROTULO = {
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Em análise',
  APROVADA: 'Aprovada',
  REJEITADA: 'Recusada',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada'
};

/** Texto mostrado ao interessado na consulta por protocolo (RF05). */
const EXPLICACAO_PUBLICA = {
  PENDENTE: 'Recebemos seu pedido e ele está na fila de análise.',
  EM_ANALISE: 'A equipe está analisando seu pedido e pode entrar em contato para conversar.',
  APROVADA: 'Seu pedido foi aprovado. Combine com a equipe a entrevista e a retirada do animal.',
  REJEITADA: 'Desta vez o pedido não foi aprovado. Você pode se candidatar a outro animal.',
  CONCLUIDA: 'Adoção concluída. Obrigada por dar um lar a quem precisava.',
  CANCELADA: 'Este pedido foi cancelado.'
};

const TRANSICOES = {
  PENDENTE: ['EM_ANALISE', 'APROVADA', 'REJEITADA', 'CANCELADA'],
  EM_ANALISE: ['APROVADA', 'REJEITADA', 'CANCELADA'],
  APROVADA: ['CONCLUIDA', 'CANCELADA'],
  REJEITADA: [],
  CONCLUIDA: [],
  CANCELADA: []
};

/** Status em que a solicitacao ainda esta viva (usado pela RN02 e pela RN05). */
const EM_ABERTO = ['PENDENTE', 'EM_ANALISE', 'APROVADA'];

/** RN10 - recusar ou cancelar exige preencher a observacao interna. */
const EXIGEM_OBSERVACAO = ['REJEITADA', 'CANCELADA'];

function listar() {
  return Object.keys(STATUS);
}

function rotulo(status) {
  return ROTULO[status] || status;
}

function explicacaoPublica(status) {
  return EXPLICACAO_PUBLICA[status] || '';
}

function estaEmAberto(status) {
  return EM_ABERTO.includes(status);
}

function exigeObservacao(status) {
  return EXIGEM_OBSERVACAO.includes(status);
}

function proximosStatus(atual) {
  return TRANSICOES[atual] ? [...TRANSICOES[atual]] : [];
}

function podeTransicionar(atual, novo) {
  return proximosStatus(atual).includes(novo);
}

function garantirTransicao(atual, novo, observacao) {
  if (!STATUS[novo]) {
    throw new ErroDeNegocio(`Situação "${novo}" não existe.`, 'STATUS_INEXISTENTE');
  }
  if (!podeTransicionar(atual, novo)) {
    const validos = proximosStatus(atual).map(rotulo).join(', ') || 'nenhuma (o pedido está encerrado)';
    throw new ErroDeNegocio(
      `Não é possível ir de "${rotulo(atual)}" para "${rotulo(novo)}". Opções válidas: ${validos}.`,
      'TRANSICAO_INVALIDA'
    );
  }
  if (exigeObservacao(novo) && !String(observacao || '').trim()) {
    throw new ErroDeNegocio(
      `Escreva a observação interna para ${rotulo(novo).toLowerCase()} o pedido.`,
      'OBSERVACAO_OBRIGATORIA'
    );
  }
  return true;
}

module.exports = {
  STATUS,
  ROTULO,
  TRANSICOES,
  EM_ABERTO,
  EXIGEM_OBSERVACAO,
  listar,
  rotulo,
  explicacaoPublica,
  estaEmAberto,
  exigeObservacao,
  proximosStatus,
  podeTransicionar,
  garantirTransicao
};
