'use strict';

/**
 * Erros de dominio. A camada de negocio nunca conhece HTTP: ela lanca um
 * ErroDeNegocio com um "codigo" e o middleware de erros traduz isso em
 * status 400/403/404/409, conforme a secao 6 do relatorio.
 */
class ErroDeNegocio extends Error {
  constructor(mensagem, codigo = 'REGRA_VIOLADA', detalhes = null) {
    super(mensagem);
    this.name = 'ErroDeNegocio';
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

class ErroNaoEncontrado extends ErroDeNegocio {
  constructor(mensagem = 'Registro não encontrado.') {
    super(mensagem, 'NAO_ENCONTRADO');
    this.name = 'ErroNaoEncontrado';
  }
}

class ErroDeAutorizacao extends ErroDeNegocio {
  constructor(mensagem = 'Você não tem permissão para esta ação.') {
    super(mensagem, 'SEM_PERMISSAO');
    this.name = 'ErroDeAutorizacao';
  }
}

class ErroDeValidacao extends ErroDeNegocio {
  constructor(mensagem = 'Dados inválidos.', detalhes = []) {
    super(mensagem, 'DADOS_INVALIDOS', detalhes);
    this.name = 'ErroDeValidacao';
  }
}

const STATUS_HTTP = {
  NAO_ENCONTRADO: 404,
  SEM_PERMISSAO: 403,
  DADOS_INVALIDOS: 400,
  REGRA_VIOLADA: 409
};

module.exports = {
  ErroDeNegocio,
  ErroNaoEncontrado,
  ErroDeAutorizacao,
  ErroDeValidacao,
  STATUS_HTTP
};
