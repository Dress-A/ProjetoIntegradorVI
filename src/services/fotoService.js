'use strict';

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');
const fotoRepository = require('../repositories/fotoRepository');
const animalRepository = require('../repositories/animalRepository');
const { MAX_FOTOS_POR_ANIMAL } = require('../domain/enums');
const { ErroDeNegocio, ErroNaoEncontrado } = require('../domain/erros');
const env = require('../config/env');
const logger = require('../config/logger');

function caminhoFisico(caminhoPublico) {
  const nomeArquivo = path.basename(caminhoPublico);
  return path.join(env.upload.diretorio, nomeArquivo);
}

function apagarArquivo(caminhoPublico) {
  if (!caminhoPublico || caminhoPublico.includes('/demo/')) return;
  const alvo = caminhoFisico(caminhoPublico);
  fs.promises.unlink(alvo).catch(() => logger.warn(`Arquivo já removido: ${alvo}`));
}

/**
 * RN08 - no maximo seis fotos por animal e exatamente uma principal.
 * A primeira foto enviada vira a principal automaticamente.
 */
async function adicionar(idAnimal, arquivos = [], legendas = []) {
  const animal = await animalRepository.buscarPorId(idAnimal);
  if (!animal) throw new ErroNaoEncontrado('Animal não encontrado.');
  if (!arquivos.length) throw new ErroDeNegocio('Escolha ao menos uma imagem.', 'SEM_ARQUIVO');

  return sequelize.transaction(async (t) => {
    const existentes = await fotoRepository.contarPorAnimal(idAnimal, t);

    if (existentes + arquivos.length > MAX_FOTOS_POR_ANIMAL) {
      arquivos.forEach((arquivo) => apagarArquivo(arquivo.filename));
      throw new ErroDeNegocio(
        `Cada animal tem no máximo ${MAX_FOTOS_POR_ANIMAL} fotos. Já existem ${existentes}.`,
        'LIMITE_DE_FOTOS'
      );
    }

    const criadas = [];
    for (let i = 0; i < arquivos.length; i += 1) {
      const primeiraDoAnimal = existentes === 0 && i === 0;
      // eslint-disable-next-line no-await-in-loop
      const foto = await fotoRepository.criar({
        id_animal: idAnimal,
        caminho_arquivo: `/uploads/${arquivos[i].filename}`,
        legenda: (legendas[i] || '').trim() || `Foto de ${animal.nome}`,
        principal: primeiraDoAnimal,
        ordem: existentes + i + 1
      }, t);
      criadas.push(foto);
    }

    logger.info(`Animal ${idAnimal}: ${criadas.length} foto(s) adicionada(s).`);
    return criadas;
  });
}

async function definirPrincipal(idFoto) {
  const foto = await fotoRepository.buscarPorId(idFoto);
  if (!foto) throw new ErroNaoEncontrado('Foto não encontrada.');

  return sequelize.transaction(async (t) => {
    await fotoRepository.limparPrincipal(foto.id_animal, t);
    await fotoRepository.definirPrincipal(idFoto, t);
    return foto;
  });
}

async function reordenar(idFoto, ordem) {
  const foto = await fotoRepository.buscarPorId(idFoto);
  if (!foto) throw new ErroNaoEncontrado('Foto não encontrada.');
  const posicao = Number(ordem);
  if (!Number.isInteger(posicao) || posicao < 1 || posicao > MAX_FOTOS_POR_ANIMAL) {
    throw new ErroDeNegocio(`A ordem precisa ser um número de 1 a ${MAX_FOTOS_POR_ANIMAL}.`, 'ORDEM_INVALIDA');
  }
  await fotoRepository.atualizarOrdem(idFoto, posicao);
  return foto;
}

/** Ao remover a principal, a foto seguinte assume o lugar (RN08). */
async function remover(idFoto) {
  const foto = await fotoRepository.buscarPorId(idFoto);
  if (!foto) throw new ErroNaoEncontrado('Foto não encontrada.');

  await sequelize.transaction(async (t) => {
    await fotoRepository.remover(idFoto, t);
    if (foto.principal) {
      const proxima = await fotoRepository.primeiraDoAnimal(foto.id_animal, t);
      if (proxima) await fotoRepository.definirPrincipal(proxima.id_foto, t);
    }
  });

  apagarArquivo(foto.caminho_arquivo);
  return foto;
}

module.exports = { adicionar, definirPrincipal, reordenar, remover, MAX_FOTOS_POR_ANIMAL };
