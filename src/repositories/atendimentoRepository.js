'use strict';

const { Atendimento, Animal, Usuario } = require('../models');

async function listar({ idAnimal = null, limite = 50 } = {}) {
  const where = {};
  if (idAnimal) where.id_animal = Number(idAnimal);
  return Atendimento.findAll({
    where,
    include: [
      { model: Animal, as: 'animal', attributes: ['id_animal', 'nome'] },
      { model: Usuario, as: 'responsavel', attributes: ['id_usuario', 'nome'] }
    ],
    order: [['data_ocorrencia', 'DESC'], ['id_atendimento', 'DESC']],
    limit: limite
  });
}

async function criar(dados) {
  return Atendimento.create(dados);
}

async function remover(idAtendimento) {
  return Atendimento.destroy({ where: { id_atendimento: idAtendimento } });
}

module.exports = { listar, criar, remover };
