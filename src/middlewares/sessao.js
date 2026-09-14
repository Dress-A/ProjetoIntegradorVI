'use strict';

const session = require('express-session');
const env = require('../config/env');

/** Sessao em cookie assinado, httpOnly e sameSite lax (RNF03). */
const sessao = session({
  name: 'adotapel.sid',
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.emProducao,
    maxAge: 1000 * 60 * 60 * 8
  }
});

/** Mensagens de uma requisicao para a seguinte (padrao flash, sem dependencia extra). */
function mensagens(req, res, next) {
  res.locals.avisos = req.session.avisos || [];
  req.session.avisos = [];

  req.avisar = (tipo, texto) => {
    req.session.avisos = req.session.avisos || [];
    req.session.avisos.push({ tipo, texto });
  };

  req.guardarFormulario = (dados) => { req.session.formulario = dados; };
  res.locals.formulario = req.session.formulario || {};
  req.session.formulario = null;

  next();
}

module.exports = { sessao, mensagens };
