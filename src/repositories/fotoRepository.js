'use strict';

const { FotoAnimal } = require('../models');

async function listarPorAnimal(idAnimal) {
  return FotoAnimal.findAll({
    where: { id_animal: idAnimal },
    order: [['principal', 'DESC'], ['ordem', 'ASC']]
  });
}

async function contarPorAnimal(idAnimal, transaction) {
  return FotoAnimal.count({ where: { id_animal: idAnimal }, transaction });
}

async function buscarPorId(idFoto) {
  return FotoAnimal.findByPk(idFoto);
}

async function criar(dados, transaction) {
  return FotoAnimal.create(dados, { transaction });
}

async function limparPrincipal(idAnimal, transaction) {
  await FotoAnimal.update({ principal: false }, { where: { id_animal: idAnimal }, transaction });
}

async function definirPrincipal(idFoto, transaction) {
  await FotoAnimal.update({ principal: true }, { where: { id_foto: idFoto }, transaction });
}

async function atualizarOrdem(idFoto, ordem, transaction) {
  await FotoAnimal.update({ ordem }, { where: { id_foto: idFoto }, transaction });
}

async function remover(idFoto, transaction) {
  return FotoAnimal.destroy({ where: { id_foto: idFoto }, transaction });
}

async function primeiraDoAnimal(idAnimal, transaction) {
  return FotoAnimal.findOne({ where: { id_animal: idAnimal }, order: [['ordem', 'ASC']], transaction });
}

module.exports = {
  listarPorAnimal, contarPorAnimal, buscarPorId, criar, limparPrincipal,
  definirPrincipal, atualizarOrdem, remover, primeiraDoAnimal
};
