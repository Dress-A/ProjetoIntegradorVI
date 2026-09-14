'use strict';

const usuarioRepository = require('../repositories/usuarioRepository');
const authService = require('./authService');
const { ErroDeNegocio, ErroNaoEncontrado } = require('../domain/erros');
const logger = require('../config/logger');

const TAMANHO_MINIMO_SENHA = 8;

function validarSenha(senha) {
  const valor = String(senha || '');
  if (valor.length < TAMANHO_MINIMO_SENHA) {
    throw new ErroDeNegocio(`A senha precisa de pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`, 'SENHA_CURTA');
  }
  if (!/[A-Za-z]/.test(valor) || !/[0-9]/.test(valor)) {
    throw new ErroDeNegocio('A senha precisa misturar letras e números.', 'SENHA_FRACA');
  }
  return true;
}

async function listar() {
  return usuarioRepository.listar();
}

async function buscar(idUsuario) {
  const usuario = await usuarioRepository.buscarPorId(idUsuario);
  if (!usuario) throw new ErroNaoEncontrado('Usuário não encontrado.');
  return usuario;
}

/** RF13 / UC12 - cadastro de usuario da equipe. */
async function cadastrar(dados) {
  const email = String(dados.email || '').trim().toLowerCase();
  const jaExiste = await usuarioRepository.buscarPorEmail(email);
  if (jaExiste) throw new ErroDeNegocio('Já existe uma conta com este e-mail.', 'EMAIL_DUPLICADO');

  validarSenha(dados.senha);

  const usuario = await usuarioRepository.criar({
    nome: dados.nome.trim(),
    email,
    senha_hash: await authService.gerarHash(dados.senha),
    perfil: dados.perfil,
    ativo: true
  });

  logger.info(`Usuário ${usuario.email} cadastrado com perfil ${usuario.perfil}.`);
  return usuario;
}

async function editar(idUsuario, dados) {
  const usuario = await buscar(idUsuario);
  const email = String(dados.email || '').trim().toLowerCase();

  if (email !== usuario.email) {
    const jaExiste = await usuarioRepository.buscarPorEmail(email);
    if (jaExiste) throw new ErroDeNegocio('Já existe uma conta com este e-mail.', 'EMAIL_DUPLICADO');
  }

  // Nao deixa a organizacao ficar sem administrador ativo.
  if (usuario.perfil === 'ADMINISTRADOR' && dados.perfil !== 'ADMINISTRADOR') {
    const ativos = await usuarioRepository.contarAdministradoresAtivos();
    if (ativos <= 1) {
      throw new ErroDeNegocio('Este é o único administrador ativo. Promova outra pessoa antes.', 'ULTIMO_ADMIN');
    }
  }

  return usuarioRepository.atualizar(idUsuario, {
    nome: dados.nome.trim(),
    email,
    perfil: dados.perfil
  });
}

async function alternarAtivo(idUsuario, idUsuarioLogado) {
  const usuario = await buscar(idUsuario);

  if (usuario.id_usuario === idUsuarioLogado) {
    throw new ErroDeNegocio('Você não pode desativar a própria conta.', 'AUTO_DESATIVACAO');
  }

  if (usuario.ativo && usuario.perfil === 'ADMINISTRADOR') {
    const ativos = await usuarioRepository.contarAdministradoresAtivos();
    if (ativos <= 1) {
      throw new ErroDeNegocio('Este é o único administrador ativo.', 'ULTIMO_ADMIN');
    }
  }

  const atualizado = await usuarioRepository.atualizar(idUsuario, {
    ativo: !usuario.ativo,
    tentativas_login: 0,
    bloqueado_ate: null
  });

  logger.info(`Usuário ${usuario.email} ${atualizado.ativo ? 'ativado' : 'desativado'}.`);
  return atualizado;
}

async function redefinirSenha(idUsuario, novaSenha) {
  await buscar(idUsuario);
  validarSenha(novaSenha);

  const atualizado = await usuarioRepository.atualizar(idUsuario, {
    senha_hash: await authService.gerarHash(novaSenha),
    tentativas_login: 0,
    bloqueado_ate: null
  });

  logger.info(`Senha redefinida para o usuário ${idUsuario}.`);
  return atualizado;
}

module.exports = {
  TAMANHO_MINIMO_SENHA, validarSenha, listar, buscar, cadastrar, editar, alternarAtivo, redefinirSenha
};
