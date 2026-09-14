'use strict';

const { Usuario } = require('../models');

async function listar() {
  return Usuario.findAll({ order: [['nome', 'ASC']] });
}

async function buscarPorId(idUsuario) {
  return Usuario.findByPk(idUsuario);
}

async function buscarPorEmailComSenha(email) {
  return Usuario.scope('comSenha').findOne({ where: { email: String(email || '').trim().toLowerCase() } });
}

async function buscarPorEmail(email) {
  return Usuario.findOne({ where: { email: String(email || '').trim().toLowerCase() } });
}

async function criar(dados) {
  return Usuario.create(dados);
}

async function atualizar(idUsuario, dados) {
  await Usuario.update(dados, { where: { id_usuario: idUsuario } });
  return buscarPorId(idUsuario);
}

async function contarAdministradoresAtivos() {
  return Usuario.count({ where: { perfil: 'ADMINISTRADOR', ativo: true } });
}

module.exports = {
  listar, buscarPorId, buscarPorEmailComSenha, buscarPorEmail,
  criar, atualizar, contarAdministradoresAtivos
};
