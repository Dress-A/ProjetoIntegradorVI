'use strict';

const path = require('path');
const fs = require('fs');
const winston = require('winston');
const env = require('./env');

const pastaLogs = path.resolve(env.raiz, 'logs');
if (!fs.existsSync(pastaLogs)) {
  fs.mkdirSync(pastaLogs, { recursive: true });
}

const logger = winston.createLogger({
  level: env.emProducao ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) =>
      `${timestamp} [${level.toUpperCase()}] ${stack || message}`)
  ),
  transports: [
    new winston.transports.File({ filename: path.join(pastaLogs, 'erro.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(pastaLogs, 'aplicacao.log') })
  ]
});

if (!env.emProducao && !env.emTeste) {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

module.exports = logger;
