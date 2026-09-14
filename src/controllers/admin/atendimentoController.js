'use strict';

const atendimentoService = require('../../services/atendimentoService');
const animalService = require('../../services/animalService');
const { TIPOS_ATENDIMENTO } = require('../../domain/enums');
const { asyncHandler } = require('../../middlewares/erros');

/** RF14 - registro de atendimentos e cuidados de saude. */
const listar = asyncHandler(async (req, res) => {
  const [atendimentos, animais] = await Promise.all([
    atendimentoService.listar({ animal: req.query.animal }),
    animalService.listarParaSelecao()
  ]);

  res.render('admin/atendimentos/lista', {
    titulo: 'Atendimentos',
    atendimentos,
    animais,
    tipos: TIPOS_ATENDIMENTO,
    filtroAnimal: req.query.animal || '',
    paginaAtiva: 'atendimentos'
  });
});

const registrar = asyncHandler(async (req, res) => {
  await atendimentoService.registrar(req.body, req.session.usuario.id_usuario);
  req.avisar('sucesso', 'Atendimento registrado.');
  res.redirect('/admin/atendimentos');
});

const excluir = asyncHandler(async (req, res) => {
  await atendimentoService.remover(req.params.id);
  req.avisar('sucesso', 'Atendimento removido.');
  res.redirect('/admin/atendimentos');
});

module.exports = { listar, registrar, excluir };
