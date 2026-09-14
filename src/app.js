'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const logger = require('./config/logger');
const { sessao, mensagens } = require('./middlewares/sessao');
const csrf = require('./middlewares/csrf');
const { carregarUsuario } = require('./middlewares/autenticacao');
const { paginaNaoEncontrada, tratarErros } = require('./middlewares/erros');
const publicoRoutes = require('./routes/publicoRoutes');
const adminRoutes = require('./routes/adminRoutes');
const formatar = require('./views/helpers');

const app = express();

/* ----------------------------------------- camada de apresentacao (EJS) -- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

/* -------------------------------------------------------- seguranca ------ */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      formAction: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

/* ------------------------------------------------------- registro (log) -- */
if (!env.emTeste) {
  app.use(morgan('combined', { stream: { write: (linha) => logger.info(linha.trim()) } }));
}

/* -------------------------------------------------- entrada e sessao ----- */
app.use(express.urlencoded({ extended: false, limit: '200kb' }));
app.use(express.json({ limit: '200kb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: env.emProducao ? '7d' : 0 }));
app.use(sessao);
app.use(mensagens);
app.use(carregarUsuario);

/* ------------------------------------------- variaveis fixas das views ---
   Ficam antes do CSRF de proposito: quando o token e recusado, a pagina de
   erro tambem precisa do cabecalho e do rodape montados. */
app.use((req, res, next) => {
  res.locals.f = formatar;
  res.locals.urlAtual = req.originalUrl;
  res.locals.anoAtual = new Date().getFullYear();
  res.locals.paginaAtiva = '';
  next();
});

app.use(csrf);

/* --------------------------------------------------------------- rotas --- */
app.use('/admin', adminRoutes);
app.use('/', publicoRoutes);

/* --------------------------------------------------------------- erros --- */
app.use(paginaNaoEncontrada);
app.use(tratarErros);

module.exports = app;
