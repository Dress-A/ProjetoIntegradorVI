'use strict';

const { ErroDeAutorizacao } = require('../domain/erros');

/** Deixa o usuario logado disponivel nas views. */
function carregarUsuario(req, res, next) {
  res.locals.usuarioLogado = req.session.usuario || null;
  next();
}

/**
 * RNF03 - as paginas administrativas so abrem depois de o servidor conferir
 * o login. Esconder botao nao protege nada; a verificacao e sempre aqui.
 */
function exigirLogin(req, res, next) {
  if (req.session.usuario) return next();

  if (req.method === 'GET') {
    req.session.destinoAposLogin = req.originalUrl;
    req.avisar('aviso', 'Entre com sua conta para continuar.');
    return res.redirect('/admin/login');
  }

  return next(new ErroDeAutorizacao('Faça login para executar esta ação.'));
}

/** RN09 - so o administrador decide pedidos, cadastra usuarios e ve o painel. */
function exigirPerfil(...perfis) {
  return (req, res, next) => {
    if (!req.session.usuario) return exigirLogin(req, res, next);
    if (perfis.includes(req.session.usuario.perfil)) return next();
    return next(new ErroDeAutorizacao('Esta área é restrita à administração.'));
  };
}

module.exports = { carregarUsuario, exigirLogin, exigirPerfil };
