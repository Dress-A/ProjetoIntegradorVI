'use strict';

const usuarioService = require('../../services/usuarioService');
const { PERFIS } = require('../../domain/enums');
const { asyncHandler } = require('../../middlewares/erros');

/** RF13 - UC12 (RN09: so administrador). */
const listar = asyncHandler(async (req, res) => {
  const usuarios = await usuarioService.listar();

  res.render('admin/usuarios/lista', {
    titulo: 'Usuários da equipe',
    usuarios,
    perfis: PERFIS,
    paginaAtiva: 'usuarios'
  });
});

const criar = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.cadastrar(req.body);
  req.avisar('sucesso', `Conta de ${usuario.nome} criada.`);
  res.redirect('/admin/usuarios');
});

const editar = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.editar(req.params.id, req.body);
  req.avisar('sucesso', `Dados de ${usuario.nome} salvos.`);
  res.redirect('/admin/usuarios');
});

const alternarAtivo = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.alternarAtivo(req.params.id, req.session.usuario.id_usuario);
  req.avisar('sucesso', `${usuario.nome} foi ${usuario.ativo ? 'ativada' : 'desativada'}.`);
  res.redirect('/admin/usuarios');
});

const redefinirSenha = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.redefinirSenha(req.params.id, req.body.senha);
  req.avisar('sucesso', `Senha de ${usuario.nome} redefinida.`);
  res.redirect('/admin/usuarios');
});

module.exports = { listar, criar, editar, alternarAtivo, redefinirSenha };
