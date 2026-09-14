'use strict';

const bcrypt = require('bcryptjs');
const usuarioRepository = require('../repositories/usuarioRepository');
const { ErroDeNegocio } = require('../domain/erros');
const logger = require('../config/logger');

const CUSTO_HASH = 10;
const MAX_TENTATIVAS = 5;         // RNF04
const MINUTOS_BLOQUEIO = 15;

async function gerarHash(senhaEmTexto) {
  return bcrypt.hash(senhaEmTexto, CUSTO_HASH);
}

function estaBloqueado(usuario, agora = new Date()) {
  return Boolean(usuario.bloqueado_ate && new Date(usuario.bloqueado_ate) > agora);
}

function minutosRestantes(usuario, agora = new Date()) {
  return Math.max(1, Math.ceil((new Date(usuario.bloqueado_ate) - agora) / 60000));
}

/**
 * RNF04 - senha conferida contra o hash bcrypt; cinco erros bloqueiam a conta
 * por 15 minutos. A mensagem devolvida nunca diz se o e-mail existe.
 */
async function autenticar(email, senha) {
  const generico = new ErroDeNegocio('E-mail ou senha incorretos.', 'CREDENCIAL_INVALIDA');
  const usuario = await usuarioRepository.buscarPorEmailComSenha(email);

  if (!usuario) {
    await bcrypt.compare(senha || '', '$2a$10$invalidoinvalidoinvalidoinvalidoinvalidoinvalidoinvali');
    throw generico;
  }

  if (!usuario.ativo) {
    throw new ErroDeNegocio('Esta conta está desativada. Procure a administração.', 'CONTA_DESATIVADA');
  }

  if (estaBloqueado(usuario)) {
    throw new ErroDeNegocio(
      `Conta bloqueada por tentativas erradas. Tente de novo em ${minutosRestantes(usuario)} minutos.`,
      'CONTA_BLOQUEADA'
    );
  }

  const confere = await bcrypt.compare(String(senha || ''), usuario.senha_hash);

  if (!confere) {
    const tentativas = usuario.tentativas_login + 1;
    const dados = { tentativas_login: tentativas };
    if (tentativas >= MAX_TENTATIVAS) {
      dados.bloqueado_ate = new Date(Date.now() + MINUTOS_BLOQUEIO * 60000);
      dados.tentativas_login = 0;
      logger.warn(`Conta ${usuario.email} bloqueada por ${MINUTOS_BLOQUEIO} minutos.`);
    }
    await usuarioRepository.atualizar(usuario.id_usuario, dados);
    throw generico;
  }

  await usuarioRepository.atualizar(usuario.id_usuario, { tentativas_login: 0, bloqueado_ate: null });
  logger.info(`Login de ${usuario.email} (${usuario.perfil}).`);

  return {
    id_usuario: usuario.id_usuario,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil
  };
}

module.exports = { gerarHash, autenticar, estaBloqueado, MAX_TENTATIVAS, MINUTOS_BLOQUEIO, CUSTO_HASH };
