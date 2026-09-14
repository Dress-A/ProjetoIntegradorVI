'use strict';

const animalService = require('../../services/animalService');
const { asyncHandler } = require('../../middlewares/erros');

/** UC01 (recorte) - pagina inicial com banner, slider e destaques. */
const inicio = asyncHandler(async (req, res) => {
  const [destaques, opcoes] = await Promise.all([
    animalService.listarDestaques(4),
    animalService.opcoesDeFiltro()
  ]);

  res.render('publico/inicio', {
    titulo: 'Adote com responsabilidade',
    destaques,
    especies: opcoes.especies,
    paginaAtiva: 'inicio'
  });
});

const sobre = (req, res) => res.render('publico/sobre', {
  titulo: 'Sobre a AdotaPel', paginaAtiva: 'sobre'
});

const servicos = (req, res) => res.render('publico/servicos', {
  titulo: 'Serviços oferecidos', paginaAtiva: 'servicos'
});

const relacionadas = (req, res) => res.render('publico/relacionadas', {
  titulo: 'Páginas relacionadas', paginaAtiva: 'relacionadas'
});

const contato = (req, res) => res.render('publico/contato', {
  titulo: 'Contato', paginaAtiva: 'contato'
});

module.exports = { inicio, sobre, servicos, relacionadas, contato };
