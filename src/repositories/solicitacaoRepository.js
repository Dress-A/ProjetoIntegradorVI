'use strict';

const { Op, fn, col } = require('sequelize');
const {
  SolicitacaoAdocao, HistoricoSolicitacao, Animal, Especie, Usuario, FotoAnimal
} = require('../models');
const statusSolicitacao = require('../domain/statusSolicitacao');

const INCLUDE_ANIMAL = {
  model: Animal, as: 'animal',
  include: [
    { model: Especie, as: 'especie' },
    { model: FotoAnimal, as: 'fotos', separate: true, order: [['principal', 'DESC'], ['ordem', 'ASC']] }
  ]
};

async function criar(dados, transaction) {
  return SolicitacaoAdocao.create(dados, { transaction });
}

async function buscarPorId(idSolicitacao, transaction) {
  return SolicitacaoAdocao.findByPk(idSolicitacao, {
    include: [
      INCLUDE_ANIMAL,
      { model: Usuario, as: 'responsavel', attributes: ['id_usuario', 'nome'] },
      {
        model: HistoricoSolicitacao, as: 'historico', separate: true,
        order: [['data_registro', 'ASC']],
        include: [{ model: Usuario, as: 'autor', attributes: ['id_usuario', 'nome'] }]
      }
    ],
    transaction
  });
}

/** RF05 - consulta publica exige protocolo E e-mail. */
async function buscarPorProtocoloEEmail(protocolo, email) {
  return SolicitacaoAdocao.findOne({
    where: {
      protocolo: protocolo.trim(),
      email: { [Op.iLike]: email.trim() }
    },
    include: [
      INCLUDE_ANIMAL,
      {
        model: HistoricoSolicitacao, as: 'historico', separate: true,
        order: [['data_registro', 'ASC']],
        attributes: ['status_anterior', 'status_novo', 'data_registro']
      }
    ]
  });
}

/** RN02 - pedido em aberto do mesmo e-mail para o mesmo animal. */
async function existeEmAberto(idAnimal, email, transaction) {
  const total = await SolicitacaoAdocao.count({
    where: {
      id_animal: idAnimal,
      email: { [Op.iLike]: email.trim() },
      status: { [Op.in]: statusSolicitacao.EM_ABERTO }
    },
    transaction
  });
  return total > 0;
}

async function listarEmAbertoDoAnimal(idAnimal, idExcluir, transaction) {
  const where = {
    id_animal: idAnimal,
    status: { [Op.in]: statusSolicitacao.EM_ABERTO }
  };
  if (idExcluir) where.id_solicitacao = { [Op.ne]: idExcluir };
  return SolicitacaoAdocao.findAll({ where, transaction });
}

async function contarPorAnimal(idAnimal, transaction) {
  return SolicitacaoAdocao.count({ where: { id_animal: idAnimal }, transaction });
}

/** RF10 - lista com filtros por situacao, animal, cidade e periodo. */
async function listar({ filtros = {}, pagina = 1, porPagina = 12 } = {}) {
  const where = {};
  if (filtros.status) where.status = filtros.status;
  if (filtros.animal) where.id_animal = Number(filtros.animal);
  if (filtros.cidade) where.cidade = { [Op.iLike]: `%${filtros.cidade}%` };
  if (filtros.protocolo) where.protocolo = { [Op.iLike]: `%${filtros.protocolo}%` };
  if (filtros.de || filtros.ate) {
    const faixa = {};
    if (filtros.de) faixa[Op.gte] = new Date(`${filtros.de}T00:00:00`);
    if (filtros.ate) faixa[Op.lte] = new Date(`${filtros.ate}T23:59:59`);
    where.data_solicitacao = faixa;
  }

  const { rows, count } = await SolicitacaoAdocao.findAndCountAll({
    where,
    include: [{ model: Animal, as: 'animal', attributes: ['id_animal', 'nome', 'situacao'] }],
    order: [['data_solicitacao', 'DESC']],
    limit: porPagina,
    offset: (pagina - 1) * porPagina,
    distinct: true,
    col: 'id_solicitacao'
  });

  return { itens: rows, total: count, pagina, porPagina, paginas: Math.max(1, Math.ceil(count / porPagina)) };
}

async function atualizarStatus(idSolicitacao, dados, transaction) {
  await SolicitacaoAdocao.update(dados, { where: { id_solicitacao: idSolicitacao }, transaction });
}

async function registrarHistorico(dados, transaction) {
  return HistoricoSolicitacao.create(dados, { transaction });
}

/** RN03 - ultimo protocolo do ano, para gerar o sequencial seguinte. */
async function ultimoProtocoloDoAno(ano, transaction) {
  const registro = await SolicitacaoAdocao.findOne({
    where: { protocolo: { [Op.like]: `${ano}-%` } },
    order: [['protocolo', 'DESC']],
    attributes: ['protocolo'],
    transaction,
    raw: true
  });
  return registro ? registro.protocolo : null;
}

async function contarPorStatus() {
  const linhas = await SolicitacaoAdocao.findAll({
    attributes: ['status', [fn('COUNT', col('id_solicitacao')), 'total']],
    group: ['status'],
    raw: true
  });
  return linhas.reduce((acc, linha) => ({ ...acc, [linha.status]: Number(linha.total) }), {});
}

async function listarRecentes(limite = 5) {
  return SolicitacaoAdocao.findAll({
    include: [{ model: Animal, as: 'animal', attributes: ['id_animal', 'nome'] }],
    order: [['data_solicitacao', 'DESC']],
    limit: limite
  });
}

module.exports = {
  criar, buscarPorId, buscarPorProtocoloEEmail, existeEmAberto, listarEmAbertoDoAnimal,
  contarPorAnimal, listar, atualizarStatus, registrarHistorico, ultimoProtocoloDoAno,
  contarPorStatus, listarRecentes
};
