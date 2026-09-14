'use strict';

const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { testarConexao } = require('./config/database');

async function iniciar() {
  try {
    await testarConexao();
  } catch (erro) {
    logger.error(`Não foi possível conectar ao PostgreSQL: ${erro.message}`);
    logger.error('Confira o arquivo .env e se o banco está no ar. Rode "npm run db:setup" na primeira vez.');
    process.exit(1);
  }

  const servidor = app.listen(env.porta, () => {
    logger.info(`AdotaPel no ar em ${env.appUrl} (ambiente ${env.nodeEnv}).`);
  });

  const encerrar = (sinal) => {
    logger.info(`Recebido ${sinal}, encerrando o servidor.`);
    servidor.close(() => process.exit(0));
  };

  process.on('SIGTERM', () => encerrar('SIGTERM'));
  process.on('SIGINT', () => encerrar('SIGINT'));
}

iniciar();
