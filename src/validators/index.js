'use strict';

const { body, query, param, validationResult } = require('express-validator');
const { PORTES, SEXOS, PERFIS, TIPOS_MORADIA, TIPOS_ATENDIMENTO, UFS, valores } = require('../domain/enums');
const statusAnimal = require('../domain/statusAnimal');
const statusSolicitacao = require('../domain/statusSolicitacao');

/**
 * RNF05 - os dados sao conferidos no navegador e DE NOVO aqui, no servidor.
 * Este middleware junta os erros, devolve o usuario para a pagina de origem
 * e preserva o que ele digitou.
 */
function verificar(paginaDeVolta) {
  return (req, res, next) => {
    const resultado = validationResult(req);
    if (resultado.isEmpty()) return next();

    const erros = resultado.array().map((e) => ({ campo: e.path, mensagem: e.msg }));
    req.avisar('erro', erros.map((e) => e.mensagem).join(' '));
    req.guardarFormulario({ ...req.body, _erros: erros });

    const destino = typeof paginaDeVolta === 'function' ? paginaDeVolta(req) : paginaDeVolta;
    return res.redirect(destino || req.get('referer') || '/');
  };
}

const idNumerico = (nome = 'id') => param(nome).isInt({ min: 1 }).withMessage('Endereço inválido.');

/* ----------------------------------------------------------- login (UC06) -- */
const login = [
  body('email').trim().isEmail().withMessage('Informe um e-mail válido.').normalizeEmail(),
  body('senha').isLength({ min: 1 }).withMessage('Informe a senha.')
];

/* ------------------------------------------------ interesse em adocao (UC04/UC13) -- */
const interesse = [
  body('nome_interessado').trim()
    .isLength({ min: 5, max: 120 }).withMessage('Escreva seu nome completo.')
    .matches(/^[A-Za-zÀ-ÿ'` .-]+$/).withMessage('O nome aceita apenas letras e espaços.'),
  body('email').trim().isEmail().withMessage('Informe um e-mail válido.')
    .isLength({ max: 160 }).normalizeEmail(),
  body('telefone').trim()
    .matches(/^\(?\d{2}\)?[\s-]?9?\d{4}-?\d{4}$/).withMessage('Informe o telefone com DDD, como (53) 99999-0000.'),
  body('cidade').trim().isLength({ min: 2, max: 80 }).withMessage('Informe a cidade.'),
  body('uf').trim().toUpperCase().isIn(UFS).withMessage('Escolha o estado.'),
  body('tipo_moradia').isIn(valores(TIPOS_MORADIA)).withMessage('Escolha o tipo de moradia.'),
  body('possui_outros_animais').toBoolean(),
  body('mensagem').trim().isLength({ max: 1000 }).withMessage('A mensagem pode ter até 1000 caracteres.'),
  body('aceite').equals('on').withMessage('É preciso aceitar as condições da adoção responsável.')
];

/* --------------------------------------------- consulta por protocolo (UC05) -- */
const consultaProtocolo = [
  body('protocolo').trim().matches(/^\d{4}-\d{6}$/)
    .withMessage('O protocolo tem o formato AAAA-NNNNNN, como 2026-000148.'),
  body('email').trim().isEmail().withMessage('Informe o e-mail usado no pedido.').normalizeEmail()
];

/* ------------------------------------------------------------ animal (UC07) -- */
const animal = [
  body('nome').trim().isLength({ min: 2, max: 80 }).withMessage('O nome do animal é obrigatório.'),
  body('id_especie').isInt({ min: 1 }).withMessage('Escolha a espécie.').toInt(),
  body('id_raca').optional({ checkFalsy: true }).isInt({ min: 1 }).toInt(),
  body('sexo').isIn(valores(SEXOS)).withMessage('Escolha o sexo.'),
  body('porte').isIn(valores(PORTES)).withMessage('Escolha o porte.'),
  body('idade_meses').isInt({ min: 0, max: 360 }).withMessage('A idade vai de 0 a 360 meses.').toInt(),
  body('data_resgate').optional({ checkFalsy: true }).isISO8601().withMessage('Data de resgate inválida.'),
  body('descricao').trim().isLength({ max: 4000 }).withMessage('A descrição pode ter até 4000 caracteres.'),
  body('castrado').toBoolean(),
  body('vacinado').toBoolean(),
  body('vermifugado').toBoolean(),
  body('caracteristicas').customSanitizer((valor) => {
    if (valor === undefined) return [];
    return (Array.isArray(valor) ? valor : [valor]).map(Number).filter(Number.isInteger);
  })
];

/* -------------------------------------------- situacao do animal (UC09/RF09) -- */
const situacaoAnimal = [
  body('situacao').isIn(statusAnimal.listar()).withMessage('Situação inválida.')
];

/* ------------------------------------------------- decisao do pedido (UC11) -- */
const decisao = [
  body('status').isIn(statusSolicitacao.listar()).withMessage('Decisão inválida.'),
  body('observacao').trim().isLength({ max: 2000 }).withMessage('A observação pode ter até 2000 caracteres.')
];

/* ------------------------------------------------------------ usuario (UC12) -- */
const usuarioNovo = [
  body('nome').trim().isLength({ min: 3, max: 120 }).withMessage('Informe o nome da pessoa.'),
  body('email').trim().isEmail().withMessage('Informe um e-mail válido.').normalizeEmail(),
  body('perfil').isIn(valores(PERFIS)).withMessage('Escolha o perfil de acesso.'),
  body('senha').isLength({ min: 8 }).withMessage('A senha precisa de pelo menos 8 caracteres.')
];

const usuarioEdicao = [
  body('nome').trim().isLength({ min: 3, max: 120 }).withMessage('Informe o nome da pessoa.'),
  body('email').trim().isEmail().withMessage('Informe um e-mail válido.').normalizeEmail(),
  body('perfil').isIn(valores(PERFIS)).withMessage('Escolha o perfil de acesso.')
];

const novaSenha = [
  body('senha').isLength({ min: 8 }).withMessage('A senha precisa de pelo menos 8 caracteres.')
];

/* -------------------------------------------------------- atendimento (RF14) -- */
const atendimento = [
  body('id_animal').isInt({ min: 1 }).withMessage('Escolha o animal.').toInt(),
  body('tipo').isIn(valores(TIPOS_ATENDIMENTO)).withMessage('Escolha o tipo de atendimento.'),
  body('descricao').trim().isLength({ min: 5, max: 2000 }).withMessage('Descreva o atendimento.'),
  body('data_ocorrencia').isISO8601().withMessage('Informe a data do atendimento.')
];

/* --------------------------------------------------------- filtros do catalogo -- */
const filtrosCatalogo = [
  query('pagina').optional().isInt({ min: 1 }).toInt(),
  query('termo').optional().trim().isLength({ max: 80 }),
  query('especie').optional({ checkFalsy: true }).isInt().toInt(),
  query('raca').optional({ checkFalsy: true }).isInt().toInt(),
  query('porte').optional().customSanitizer((v) => [].concat(v).filter((p) => valores(PORTES).includes(p))),
  query('sexo').optional().customSanitizer((v) => [].concat(v).filter((s) => valores(SEXOS).includes(s))),
  query('idadeMin').optional({ checkFalsy: true }).isInt({ min: 0, max: 360 }).toInt(),
  query('idadeMax').optional({ checkFalsy: true }).isInt({ min: 0, max: 360 }).toInt(),
  query('caracteristicas').optional().customSanitizer((v) => [].concat(v).map(Number).filter(Number.isInteger))
];

module.exports = {
  verificar,
  idNumerico,
  login,
  interesse,
  consultaProtocolo,
  animal,
  situacaoAnimal,
  decisao,
  usuarioNovo,
  usuarioEdicao,
  novaSenha,
  atendimento,
  filtrosCatalogo
};
