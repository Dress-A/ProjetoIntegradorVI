'use strict';

require('dotenv').config();

const path = require('path');

const raiz = path.resolve(__dirname, '..', '..');

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  porta: Number(process.env.PORT || 3000),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  sessionSecret: process.env.SESSION_SECRET || 'adotapel-desenvolvimento',
  raiz,
  banco: {
    host: process.env.DB_HOST || 'localhost',
    porta: Number(process.env.DB_PORT || 5432),
    nome: process.env.DB_NAME || 'adotapel',
    usuario: process.env.DB_USER || 'postgres',
    senha: process.env.DB_PASSWORD || 'postgres',
    log: process.env.DB_LOGGING === 'true'
  },
  upload: {
    diretorio: path.resolve(raiz, process.env.UPLOAD_DIR || 'src/public/uploads'),
    maxBytes: Number(process.env.UPLOAD_MAX_BYTES || 2 * 1024 * 1024),
    tiposAceitos: ['image/jpeg', 'image/png']
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    porta: Number(process.env.SMTP_PORT || 587),
    usuario: process.env.SMTP_USER || '',
    senha: process.env.SMTP_PASSWORD || '',
    remetente: process.env.SMTP_FROM || 'AdotaPel <nao-responda@adotapel.org.br>'
  },
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@adotapel.org.br',
    adminSenha: process.env.SEED_ADMIN_SENHA || 'Admin@2026',
    voluntarioEmail: process.env.SEED_VOLUNTARIO_EMAIL || 'voluntario@adotapel.org.br',
    voluntarioSenha: process.env.SEED_VOLUNTARIO_SENHA || 'Voluntario@2026'
  }
};

env.emProducao = env.nodeEnv === 'production';
env.emTeste = env.nodeEnv === 'test';

module.exports = env;
