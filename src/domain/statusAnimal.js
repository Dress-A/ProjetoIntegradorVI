'use strict';

const { ErroDeNegocio } = require('./erros');

/** Situacoes do animal (secao 6 do relatorio). */
const SITUACAO = {
  DISPONIVEL: 'DISPONIVEL',
  EM_PROCESSO: 'EM_PROCESSO',
  ADOTADO: 'ADOTADO',
  INDISPONIVEL: 'INDISPONIVEL'
};

const ROTULO = {
  DISPONIVEL: 'Disponível',
  EM_PROCESSO: 'Em processo',
  ADOTADO: 'Adotado',
  INDISPONIVEL: 'Indisponível'
};

/**
 * Caminho permitido. Um salto que nao esta aqui e recusado com a indicacao
 * das opcoes validas, e nao gravado no banco.
 */
const TRANSICOES = {
  DISPONIVEL: ['EM_PROCESSO', 'INDISPONIVEL'],
  EM_PROCESSO: ['ADOTADO', 'DISPONIVEL', 'INDISPONIVEL'],
  ADOTADO: ['DISPONIVEL'],
  INDISPONIVEL: ['DISPONIVEL']
};

function listar() {
  return Object.keys(SITUACAO);
}

function rotulo(situacao) {
  return ROTULO[situacao] || situacao;
}

function proximasSituacoes(atual) {
  return TRANSICOES[atual] ? [...TRANSICOES[atual]] : [];
}

function podeTransicionar(atual, nova) {
  return proximasSituacoes(atual).includes(nova);
}

/** Lanca ErroDeNegocio quando a mudanca nao e permitida. */
function garantirTransicao(atual, nova) {
  if (!SITUACAO[nova]) {
    throw new ErroDeNegocio(`Situação "${nova}" não existe.`, 'SITUACAO_INEXISTENTE');
  }
  if (atual === nova) {
    throw new ErroDeNegocio(`O animal já está em "${rotulo(nova)}".`, 'SITUACAO_REPETIDA');
  }
  if (!podeTransicionar(atual, nova)) {
    const validas = proximasSituacoes(atual).map(rotulo).join(', ') || 'nenhuma';
    throw new ErroDeNegocio(
      `Não é possível ir de "${rotulo(atual)}" para "${rotulo(nova)}". Opções válidas: ${validas}.`,
      'TRANSICAO_INVALIDA'
    );
  }
  return true;
}

module.exports = { SITUACAO, ROTULO, TRANSICOES, listar, rotulo, proximasSituacoes, podeTransicionar, garantirTransicao };
