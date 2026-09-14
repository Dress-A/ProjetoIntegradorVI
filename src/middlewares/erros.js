'use strict';

const { ErroDeNegocio, STATUS_HTTP } = require('../domain/erros');
const logger = require('../config/logger');

/** Envolve controllers async para que o erro chegue ao middleware central. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function paginaNaoEncontrada(req, res) {
  res.status(404).render('erros/404', {
    titulo: 'Página não encontrada',
    caminho: req.originalUrl
  });
}

/** Middleware central de erros: paginas 400/403/404/500 (secao 6). */
// eslint-disable-next-line no-unused-vars
function tratarErros(erro, req, res, next) {
  const status = erro instanceof ErroDeNegocio ? (STATUS_HTTP[erro.codigo] || 409) : 500;

  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${erro.stack || erro.message}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${status}: ${erro.message}`);
  }

  // Em POST de formulario, devolve o usuario para a pagina anterior com o aviso.
  if (status < 500 && req.method === 'POST' && req.get('referer') && typeof req.avisar === 'function') {
    req.avisar('erro', erro.message);
    return res.redirect(req.get('referer'));
  }

  const paginas = { 403: 'erros/403', 404: 'erros/404' };
  const view = paginas[status] || 'erros/erro';

  return res.status(status).render(view, {
    titulo: status === 403 ? 'Acesso negado' : status === 404 ? 'Página não encontrada' : 'Erro no sistema',
    status,
    mensagem: status >= 500 ? 'Algo quebrou do nosso lado. A equipe já foi avisada pelo registro do sistema.' : erro.message,
    caminho: req.originalUrl
  });
}

module.exports = { asyncHandler, paginaNaoEncontrada, tratarErros };
