'use strict';

const atendimentoRepository = require('../repositories/atendimentoRepository');
const animalRepository = require('../repositories/animalRepository');
const { ErroNaoEncontrado } = require('../domain/erros');
const logger = require('../config/logger');

/** RF14 - registro de atendimentos e cuidados de saude. */
async function listar(filtros = {}) {
  return atendimentoRepository.listar({ idAnimal: filtros.animal || null });
}

async function registrar(dados, idUsuario) {
  const animal = await animalRepository.buscarSimples(dados.id_animal);
  if (!animal) throw new ErroNaoEncontrado('Animal não encontrado.');

  const atendimento = await atendimentoRepository.criar({
    id_animal: dados.id_animal,
    id_usuario: idUsuario,
    tipo: dados.tipo,
    descricao: dados.descricao.trim(),
    data_ocorrencia: dados.data_ocorrencia
  });

  logger.info(`Atendimento ${atendimento.id_atendimento} registrado para o animal ${dados.id_animal}.`);
  return atendimento;
}

async function remover(idAtendimento) {
  const removidos = await atendimentoRepository.remover(idAtendimento);
  if (!removidos) throw new ErroNaoEncontrado('Atendimento não encontrado.');
  return true;
}

module.exports = { listar, registrar, remover };
