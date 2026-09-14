'use strict';

const crypto = require('crypto');
const fs = require('fs');
const { ErroDeNegocio } = require('../domain/erros');

const METODOS_SEGUROS = ['GET', 'HEAD', 'OPTIONS'];

function garantirToken(req, res) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
}

function conferir(req) {
  const enviado = String((req.body && req.body._csrf) || req.get('x-csrf-token') || '');
  const esperado = String(req.session.csrfToken || '');

  return enviado.length === esperado.length
    && enviado.length > 0
    && crypto.timingSafeEqual(Buffer.from(enviado), Buffer.from(esperado));
}

function recusar() {
  return new ErroDeNegocio(
    'Sua sessão expirou ou o formulário foi enviado de outra página. Abra a página de novo e tente outra vez.',
    'CSRF_INVALIDO'
  );
}

/**
 * Código de segurança nos formulários (seção 6): um token por sessão,
 * comparado em tempo constante a cada POST.
 *
 * Formulários com arquivo (multipart) são a exceção: nesse ponto do fluxo o
 * corpo ainda não foi lido, porque quem lê é o multer, lá na rota. Para esses,
 * a conferência acontece depois, por "validarAposUpload".
 */
function csrf(req, res, next) {
  garantirToken(req, res);

  if (METODOS_SEGUROS.includes(req.method)) return next();
  if (req.is('multipart/form-data')) return next();

  return conferir(req) ? next() : next(recusar());
}

/** Conferência do token depois que o multer leu o formulário com arquivos. */
function validarAposUpload(req, res, next) {
  if (conferir(req)) return next();

  // Token inválido: os arquivos já gravados em disco são descartados.
  (req.files || []).forEach((arquivo) => {
    fs.promises.unlink(arquivo.path).catch(() => {});
  });

  return next(recusar());
}

module.exports = csrf;
module.exports.validarAposUpload = validarAposUpload;
