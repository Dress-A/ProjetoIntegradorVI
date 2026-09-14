'use strict';

const animalService = require('../../services/animalService');
const { asyncHandler } = require('../../middlewares/erros');

/** Reconstroi a query string para a paginacao manter os filtros (UC02). */
function queryDosFiltros(query, exceto = []) {
  const partes = [];
  Object.entries(query).forEach(([chave, valor]) => {
    if (exceto.includes(chave) || valor === '' || valor === undefined) return;
    [].concat(valor).forEach((item) => partes.push(`${encodeURIComponent(chave)}=${encodeURIComponent(item)}`));
  });
  return partes.join('&');
}

/** RF01/RF02 - UC01 e UC02. */
const catalogo = asyncHandler(async (req, res) => {
  const filtros = {
    termo: req.query.termo || '',
    especie: req.query.especie || '',
    raca: req.query.raca || '',
    porte: req.query.porte || [],
    sexo: req.query.sexo || [],
    idadeMin: req.query.idadeMin || '',
    idadeMax: req.query.idadeMax || '',
    caracteristicas: req.query.caracteristicas || []
  };

  const [resultado, opcoes] = await Promise.all([
    animalService.listarPublico(filtros, req.query.pagina || 1),
    animalService.opcoesDeFiltro()
  ]);

  res.render('publico/catalogo', {
    titulo: 'Animais disponíveis para adoção',
    resultado,
    filtros,
    opcoes,
    queryBase: queryDosFiltros(req.query, ['pagina']),
    paginaAtiva: 'animais'
  });
});

/** RF03 - UC03: perfil do animal com galeria e formulario de interesse. */
const perfil = asyncHandler(async (req, res) => {
  const animal = await animalService.buscarPublico(req.params.id);

  res.render('publico/animal', {
    titulo: `${animal.nome} — perfil do animal`,
    animal,
    paginaAtiva: 'animais'
  });
});

module.exports = { catalogo, perfil, queryDosFiltros };
