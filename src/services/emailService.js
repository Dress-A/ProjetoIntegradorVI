'use strict';

const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const logger = require('../config/logger');
const statusSolicitacao = require('../domain/statusSolicitacao');

let nodemailer = null;
try {
  // eslint-disable-next-line global-require
  nodemailer = require('nodemailer');
} catch (_erro) {
  nodemailer = null;
}

const smtpConfigurado = () => Boolean(env.smtp.host && env.smtp.usuario && nodemailer);

let transporte = null;
function obterTransporte() {
  if (!smtpConfigurado()) return null;
  if (!transporte) {
    transporte = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.porta,
      secure: env.smtp.porta === 465,
      auth: { user: env.smtp.usuario, pass: env.smtp.senha }
    });
  }
  return transporte;
}

/** Sem SMTP, o e-mail e gravado em logs/emails para conferencia na demonstracao. */
function gravarEmArquivo(mensagem) {
  const pasta = path.resolve(env.raiz, 'logs', 'emails');
  fs.mkdirSync(pasta, { recursive: true });
  const arquivo = path.join(pasta, `${Date.now()}-${mensagem.para.replace(/[^\w.-]/g, '_')}.txt`);
  fs.writeFileSync(arquivo,
    `Para: ${mensagem.para}\nAssunto: ${mensagem.assunto}\n\n${mensagem.texto}\n`, 'utf8');
  return arquivo;
}

async function enviar({ para, assunto, texto }) {
  const mensagem = { para, assunto, texto };
  const conexao = obterTransporte();

  if (!conexao) {
    const arquivo = gravarEmArquivo(mensagem);
    logger.info(`E-mail gravado em ${arquivo} (SMTP não configurado).`);
    return { enviado: false, arquivo };
  }

  await conexao.sendMail({ from: env.smtp.remetente, to: para, subject: assunto, text: texto });
  logger.info(`E-mail enviado para ${para}: ${assunto}`);
  return { enviado: true };
}

/** RF15 / UC14 - aviso a cada mudanca de situacao do pedido. */
async function notificarMudancaDeStatus(solicitacao, statusNovo, observacao) {
  const nomeAnimal = solicitacao.animal ? solicitacao.animal.nome : 'o animal';
  const rotulo = statusSolicitacao.rotulo(statusNovo);
  const explicacao = statusSolicitacao.explicacaoPublica(statusNovo);

  const linhas = [
    `Olá, ${solicitacao.nome_interessado}.`,
    '',
    `O pedido de adoção ${solicitacao.protocolo}, referente a ${nomeAnimal}, passou para "${rotulo}".`,
    explicacao,
    ''
  ];

  if (observacao && ['REJEITADA', 'CANCELADA'].includes(statusNovo)) {
    linhas.push(`Observação da equipe: ${observacao}`, '');
  }

  linhas.push(
    `Acompanhe pelo protocolo em ${env.appUrl}/acompanhar`,
    '',
    'AdotaPel — mensagem automática, não responda este e-mail.'
  );

  return enviar({
    para: solicitacao.email,
    assunto: `AdotaPel — pedido ${solicitacao.protocolo}: ${rotulo}`,
    texto: linhas.join('\n')
  });
}

module.exports = { enviar, notificarMudancaDeStatus, smtpConfigurado };
