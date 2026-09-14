'use strict';

const animalService = require('../../services/animalService');
const fotoService = require('../../services/fotoService');
const statusAnimal = require('../../domain/statusAnimal');
const { asyncHandler } = require('../../middlewares/erros');

/** UC07 - lista administrativa, com filtros e paginacao. */
const listar = asyncHandler(async (req, res) => {
  const filtros = {
    termo: req.query.termo || '',
    situacao: req.query.situacao || '',
    especie: req.query.especie || '',
    ativo: req.query.ativo === undefined ? '' : req.query.ativo
  };

  const [resultado, opcoes] = await Promise.all([
    animalService.listarAdmin(filtros, req.query.pagina || 1),
    animalService.opcoesDeFiltro()
  ]);

  res.render('admin/animais/lista', {
    titulo: 'Animais cadastrados',
    resultado,
    filtros,
    opcoes,
    situacoes: statusAnimal.listar().map((s) => ({ valor: s, rotulo: statusAnimal.rotulo(s) })),
    paginaAtiva: 'animais'
  });
});

const formularioNovo = asyncHandler(async (req, res) => {
  const opcoes = await animalService.opcoesDeFiltro();

  res.render('admin/animais/formulario', {
    titulo: 'Cadastrar animal',
    animal: null,
    opcoes,
    paginaAtiva: 'animais'
  });
});

const criar = asyncHandler(async (req, res) => {
  const animal = await animalService.cadastrar(req.body, req.session.usuario.id_usuario);
  req.avisar('sucesso', `${animal.nome} foi cadastrado. Agora adicione as fotos.`);
  res.redirect(`/admin/animais/${animal.id_animal}/fotos`);
});

const formularioEdicao = asyncHandler(async (req, res) => {
  const [animal, opcoes] = await Promise.all([
    animalService.buscarParaEdicao(req.params.id),
    animalService.opcoesDeFiltro()
  ]);

  res.render('admin/animais/formulario', {
    titulo: `Editar ${animal.nome}`,
    animal,
    opcoes,
    paginaAtiva: 'animais'
  });
});

const atualizar = asyncHandler(async (req, res) => {
  const animal = await animalService.editar(req.params.id, req.body);
  req.avisar('sucesso', `Os dados de ${animal.nome} foram salvos.`);
  res.redirect('/admin/animais');
});

/** RF09 - UC09: muda a situacao respeitando o caminho permitido. */
const alterarSituacao = asyncHandler(async (req, res) => {
  const animal = await animalService.alterarSituacao(req.params.id, req.body.situacao);
  req.avisar('sucesso', `${animal.nome} agora está em "${statusAnimal.rotulo(animal.situacao)}".`);
  res.redirect(req.body.voltarPara || '/admin/animais');
});

/** RN07 - com pedidos vinculados, o animal e inativado em vez de apagado. */
const excluir = asyncHandler(async (req, res) => {
  const resultado = await animalService.excluir(req.params.id);

  if (resultado.acao === 'INATIVADO') {
    req.avisar('aviso',
      `${resultado.nome} tem ${resultado.solicitacoes} pedido(s) no histórico, então foi inativado em vez de excluído.`);
  } else {
    req.avisar('sucesso', `${resultado.nome} foi excluído do cadastro.`);
  }

  res.redirect('/admin/animais');
});

const reativar = asyncHandler(async (req, res) => {
  const animal = await animalService.reativar(req.params.id);
  req.avisar('sucesso', `${animal.nome} voltou para o catálogo.`);
  res.redirect('/admin/animais');
});

/* --------------------------------------------------------- fotos (UC08) -- */

const galeria = asyncHandler(async (req, res) => {
  const [animal, fotos] = await Promise.all([
    animalService.buscarParaEdicao(req.params.id),
    animalService.fotosDoAnimal(req.params.id)
  ]);

  res.render('admin/animais/fotos', {
    titulo: `Fotos de ${animal.nome}`,
    animal,
    fotos,
    maximoFotos: fotoService.MAX_FOTOS_POR_ANIMAL,
    paginaAtiva: 'animais'
  });
});

const enviarFotos = asyncHandler(async (req, res) => {
  const legendas = [].concat(req.body.legendas || []);
  const criadas = await fotoService.adicionar(req.params.id, req.files || [], legendas);
  req.avisar('sucesso', `${criadas.length} foto(s) adicionada(s).`);
  res.redirect(`/admin/animais/${req.params.id}/fotos`);
});

const marcarPrincipal = asyncHandler(async (req, res) => {
  const foto = await fotoService.definirPrincipal(req.params.idFoto);
  req.avisar('sucesso', 'Foto principal atualizada.');
  res.redirect(`/admin/animais/${foto.id_animal}/fotos`);
});

const reordenarFoto = asyncHandler(async (req, res) => {
  const foto = await fotoService.reordenar(req.params.idFoto, req.body.ordem);
  req.avisar('sucesso', 'Ordem das fotos atualizada.');
  res.redirect(`/admin/animais/${foto.id_animal}/fotos`);
});

const excluirFoto = asyncHandler(async (req, res) => {
  const foto = await fotoService.remover(req.params.idFoto);
  req.avisar('sucesso', 'Foto removida.');
  res.redirect(`/admin/animais/${foto.id_animal}/fotos`);
});

module.exports = {
  listar, formularioNovo, criar, formularioEdicao, atualizar, alterarSituacao,
  excluir, reativar, galeria, enviarFotos, marcarPrincipal, reordenarFoto, excluirFoto
};
