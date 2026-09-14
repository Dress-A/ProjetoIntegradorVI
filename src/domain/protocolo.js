'use strict';

/**
 * RN03 - o protocolo e unico, no formato AAAA-NNNNNN, e nunca muda.
 * O numero e sequencial dentro do ano: o servico consulta o ultimo protocolo
 * do ano corrente e passa o sequencial seguinte para ca.
 */
const FORMATO = /^[0-9]{4}-[0-9]{6}$/;

function formatar(ano, sequencial) {
  if (sequencial < 1 || sequencial > 999999) {
    throw new RangeError('Sequencial de protocolo fora da faixa (1 a 999999).');
  }
  return `${ano}-${String(sequencial).padStart(6, '0')}`;
}

function valido(protocolo) {
  return typeof protocolo === 'string' && FORMATO.test(protocolo.trim());
}

function extrairSequencial(protocolo) {
  if (!valido(protocolo)) return 0;
  return Number(protocolo.trim().slice(5));
}

function proximo(ano, ultimoProtocolo) {
  return formatar(ano, extrairSequencial(ultimoProtocolo) + 1);
}

module.exports = { FORMATO, formatar, valido, extrairSequencial, proximo };
