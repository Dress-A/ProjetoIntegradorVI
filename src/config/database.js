'use strict';

const { Sequelize } = require('sequelize');
const env = require('./env');
const logger = require('./logger');

const sequelize = new Sequelize(env.banco.nome, env.banco.usuario, env.banco.senha, {
  host: env.banco.host,
  port: env.banco.porta,
  dialect: 'postgres',
  logging: env.banco.log ? (msg) => logger.debug(msg) : false,
  define: { freezeTableName: true, timestamps: false },
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  timezone: '-03:00'
});

async function testarConexao() {
  await sequelize.authenticate();
  logger.info(`Conectado ao PostgreSQL em ${env.banco.host}:${env.banco.porta}/${env.banco.nome}`);
}

module.exports = { sequelize, Sequelize, testarConexao };
