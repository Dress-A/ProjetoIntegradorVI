'use strict';

const { Router } = require('express');
const auth = require('../controllers/admin/authController');
const painel = require('../controllers/admin/painelController');
const animais = require('../controllers/admin/animalController');
const solicitacoes = require('../controllers/admin/solicitacaoController');
const usuarios = require('../controllers/admin/usuarioController');
const atendimentos = require('../controllers/admin/atendimentoController');
const { exigirLogin, exigirPerfil } = require('../middlewares/autenticacao');
const { tratarUpload } = require('../middlewares/upload');
const csrf = require('../middlewares/csrf');
const v = require('../validators');

const router = Router();

/* --------------------------------------------------- login (UC06) -------- */
router.get('/login', auth.formularioLogin);
router.post('/login', v.login, v.verificar('/admin/login'), auth.entrar);
router.post('/logout', auth.sair);

/* Daqui para baixo, toda rota passa por login + verificacao de perfil (RNF03). */
router.use(exigirLogin);

/* ------------------------------------------------- painel (RF16/RN09) ---- */
router.get('/', exigirPerfil('ADMINISTRADOR'), painel.exibir);

/* ------------------------------------- animais (UC07, UC08, UC09) -------- */
router.get('/animais', animais.listar);
router.get('/animais/novo', animais.formularioNovo);
router.post('/animais', v.animal, v.verificar('/admin/animais/novo'), animais.criar);

router.get('/animais/:id/editar', v.idNumerico(), animais.formularioEdicao);
router.post('/animais/:id', v.idNumerico(), v.animal,
  v.verificar((req) => `/admin/animais/${req.params.id}/editar`), animais.atualizar);

router.post('/animais/:id/situacao', v.idNumerico(), v.situacaoAnimal,
  v.verificar('/admin/animais'), animais.alterarSituacao);

router.post('/animais/:id/excluir', v.idNumerico(), animais.excluir);
router.post('/animais/:id/reativar', v.idNumerico(), animais.reativar);

router.get('/animais/:id/fotos', v.idNumerico(), animais.galeria);
// O token é conferido depois do multer: só ali o formulário com arquivo já foi lido.
router.post('/animais/:id/fotos', v.idNumerico(), tratarUpload, csrf.validarAposUpload, animais.enviarFotos);
router.post('/fotos/:idFoto/principal', v.idNumerico('idFoto'), animais.marcarPrincipal);
router.post('/fotos/:idFoto/ordem', v.idNumerico('idFoto'), animais.reordenarFoto);
router.post('/fotos/:idFoto/excluir', v.idNumerico('idFoto'), animais.excluirFoto);

/* ------------------------------------------ solicitacoes (UC10, UC11) ---- */
router.get('/solicitacoes', solicitacoes.listar);
router.get('/solicitacoes/:id', v.idNumerico(), solicitacoes.detalhar);
// RN09 - so o administrador registra a decisao
router.post('/solicitacoes/:id/decisao', exigirPerfil('ADMINISTRADOR'), v.idNumerico(), v.decisao,
  v.verificar((req) => `/admin/solicitacoes/${req.params.id}`), solicitacoes.decidir);

/* ------------------------------------------------ atendimentos (RF14) ---- */
router.get('/atendimentos', atendimentos.listar);
router.post('/atendimentos', v.atendimento, v.verificar('/admin/atendimentos'), atendimentos.registrar);
router.post('/atendimentos/:id/excluir', v.idNumerico(), atendimentos.excluir);

/* ------------------------------------------- usuarios (UC12 / RN09) ------ */
router.use('/usuarios', exigirPerfil('ADMINISTRADOR'));
router.get('/usuarios', usuarios.listar);
router.post('/usuarios', v.usuarioNovo, v.verificar('/admin/usuarios'), usuarios.criar);
router.post('/usuarios/:id', v.idNumerico(), v.usuarioEdicao, v.verificar('/admin/usuarios'), usuarios.editar);
router.post('/usuarios/:id/ativo', v.idNumerico(), usuarios.alternarAtivo);
router.post('/usuarios/:id/senha', v.idNumerico(), v.novaSenha, v.verificar('/admin/usuarios'), usuarios.redefinirSenha);

module.exports = router;
