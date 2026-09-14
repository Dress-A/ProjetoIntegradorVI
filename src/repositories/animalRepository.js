'use strict';

const { Op } = require('sequelize');
const {
  Animal, Especie, Raca, Caracteristica, FotoAnimal, Usuario, Atendimento, sequelize
} = require('../models');

const INCLUDE_BASICO = [
  { model: Especie, as: 'especie' },
  { model: Raca, as: 'raca' },
  { model: FotoAnimal, as: 'fotos', separate: true, order: [['principal', 'DESC'], ['ordem', 'ASC']] }
];

/** Monta o WHERE a partir dos filtros do RF02. */
function montarFiltros(filtros = {}, { somentePublico = false } = {}) {
  const where = {};
  const and = [];

  if (somentePublico) {
    where.situacao = 'DISPONIVEL'; // RN01
    where.ativo = true;
  } else {
    if (filtros.situacao) where.situacao = filtros.situacao;
    if (filtros.ativo !== undefined && filtros.ativo !== '') where.ativo = filtros.ativo === true || filtros.ativo === 'true';
  }

  if (filtros.termo) and.push({ nome: { [Op.iLike]: `%${filtros.termo}%` } });
  if (filtros.especie) where.id_especie = Number(filtros.especie);
  if (filtros.raca) where.id_raca = Number(filtros.raca);
  if (filtros.porte) where.porte = Array.isArray(filtros.porte) ? { [Op.in]: filtros.porte } : filtros.porte;
  if (filtros.sexo) where.sexo = Array.isArray(filtros.sexo) ? { [Op.in]: filtros.sexo } : filtros.sexo;

  if (filtros.idadeMin || filtros.idadeMax) {
    const faixa = {};
    if (filtros.idadeMin) faixa[Op.gte] = Number(filtros.idadeMin);
    if (filtros.idadeMax) faixa[Op.lte] = Number(filtros.idadeMax);
    where.idade_meses = faixa;
  }

  if (and.length) where[Op.and] = and;
  return where;
}

/** Lista paginada. Caracteristicas filtram por subconsulta para nao duplicar linhas. */
async function listar({ filtros = {}, pagina = 1, porPagina = 9, somentePublico = false } = {}) {
  const where = montarFiltros(filtros, { somentePublico });
  const caracteristicas = []
    .concat(filtros.caracteristicas || [])
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);

  if (caracteristicas.length) {
    where.id_animal = {
      [Op.in]: sequelize.literal(`(
        SELECT id_animal FROM animal_caracteristica
        WHERE id_caracteristica IN (${caracteristicas.join(',')})
        GROUP BY id_animal
        HAVING COUNT(DISTINCT id_caracteristica) = ${caracteristicas.length}
      )`)
    };
  }

  const { rows, count } = await Animal.findAndCountAll({
    where,
    include: INCLUDE_BASICO,
    order: [['criado_em', 'DESC'], ['id_animal', 'DESC']],
    limit: porPagina,
    offset: (pagina - 1) * porPagina,
    distinct: true,
    col: 'id_animal'
  });

  return { itens: rows, total: count, pagina, porPagina, paginas: Math.max(1, Math.ceil(count / porPagina)) };
}

async function buscarPorId(idAnimal, { publico = false } = {}) {
  const where = { id_animal: idAnimal };
  if (publico) {
    where.ativo = true;
  }
  return Animal.findOne({
    where,
    include: [
      ...INCLUDE_BASICO,
      { model: Caracteristica, as: 'caracteristicas', through: { attributes: [] } },
      { model: Usuario, as: 'cadastradoPor', attributes: ['id_usuario', 'nome'] },
      {
        model: Atendimento, as: 'atendimentos', separate: true, order: [['data_ocorrencia', 'DESC']],
        include: [{ model: Usuario, as: 'responsavel', attributes: ['id_usuario', 'nome'] }]
      }
    ]
  });
}

/** Leitura simples, usada dentro de transacoes (mudanca de situacao). */
async function buscarSimples(idAnimal, transaction) {
  return Animal.findByPk(idAnimal, { transaction });
}

async function listarDestaques(limite = 4) {
  return Animal.findAll({
    where: { situacao: 'DISPONIVEL', ativo: true },
    include: INCLUDE_BASICO,
    order: [['criado_em', 'DESC']],
    limit: limite
  });
}

async function criar(dados, transaction) {
  return Animal.create(dados, { transaction });
}

async function atualizar(idAnimal, dados, transaction) {
  await Animal.update({ ...dados, atualizado_em: new Date() }, { where: { id_animal: idAnimal }, transaction });
  return Animal.findByPk(idAnimal, { transaction });
}

async function definirCaracteristicas(animal, ids, transaction) {
  await animal.setCaracteristicas(ids, { transaction });
}

async function remover(idAnimal, transaction) {
  return Animal.destroy({ where: { id_animal: idAnimal }, transaction });
}

/** RN07 - inativa em vez de apagar quando ha solicitacoes vinculadas. */
async function inativar(idAnimal, transaction) {
  await Animal.update(
    { ativo: false, situacao: 'INDISPONIVEL', atualizado_em: new Date() },
    { where: { id_animal: idAnimal }, transaction }
  );
}

/** Lista enxuta (id e nome) para os seletores das telas administrativas. */
async function listarParaSelecao() {
  return Animal.findAll({
    attributes: ['id_animal', 'nome'],
    order: [['nome', 'ASC']]
  });
}

async function contarPorSituacao() {
  const linhas = await Animal.findAll({
    attributes: ['situacao', [sequelize.fn('COUNT', sequelize.col('id_animal')), 'total']],
    where: { ativo: true },
    group: ['situacao'],
    raw: true
  });
  return linhas.reduce((acc, linha) => ({ ...acc, [linha.situacao]: Number(linha.total) }), {});
}

async function listarEspecies() {
  return Especie.findAll({ order: [['nome', 'ASC']], include: [{ model: Raca, as: 'racas' }] });
}

async function listarRacas() {
  return Raca.findAll({ order: [['nome', 'ASC']] });
}

async function listarCaracteristicas() {
  return Caracteristica.findAll({ order: [['categoria', 'ASC'], ['nome', 'ASC']] });
}

module.exports = {
  montarFiltros,
  listar,
  buscarPorId,
  buscarSimples,
  listarDestaques,
  criar,
  atualizar,
  definirCaracteristicas,
  remover,
  inativar,
  listarParaSelecao,
  contarPorSituacao,
  listarEspecies,
  listarRacas,
  listarCaracteristicas
};
