'use strict';

const { Router } = require('express');
const paginas = require('../controllers/publico/paginasController');
const animais = require('../controllers/publico/animalController');
const solicitacoes = require('../controllers/publico/solicitacaoController');
const v = require('../validators');

const router = Router();

/* ------------------------------- paginas institucionais (RF06) ------------ */
router.get('/', paginas.inicio);
router.get('/sobre', paginas.sobre);
router.get('/servicos', paginas.servicos);
router.get('/relacionadas', paginas.relacionadas);
router.get('/contato', paginas.contato);

/* ---------------------------------- catalogo e perfil (UC01/UC02/UC03) ---- */
router.get('/animais', v.filtrosCatalogo, animais.catalogo);
router.get('/animais/:id', v.idNumerico(), animais.perfil);

/* --------------------------------------- interesse em adocao (UC04) ------- */
router.post(
  '/animais/:id/interesse',
  v.idNumerico(),
  v.interesse,
  v.verificar((req) => `/animais/${req.params.id}#formulario`),
  solicitacoes.registrar
);
router.get('/solicitacoes/confirmacao', solicitacoes.confirmacao);

/* ----------------------------------- acompanhar pedido (UC05) ------------- */
router.get('/acompanhar', solicitacoes.formularioConsulta);
router.post('/acompanhar', v.consultaProtocolo, v.verificar('/acompanhar'), solicitacoes.consultar);

module.exports = router;
