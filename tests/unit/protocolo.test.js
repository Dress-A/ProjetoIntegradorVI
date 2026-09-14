'use strict';

const protocolo = require('../../src/domain/protocolo');

describe('Protocolo (RN03)', () => {
  test('formata com seis dígitos e ano na frente', () => {
    expect(protocolo.formatar(2026, 1)).toBe('2026-000001');
    expect(protocolo.formatar(2026, 148)).toBe('2026-000148');
    expect(protocolo.formatar(2026, 999999)).toBe('2026-999999');
  });

  test('recusa sequencial fora da faixa', () => {
    expect(() => protocolo.formatar(2026, 0)).toThrow(RangeError);
    expect(() => protocolo.formatar(2026, 1000000)).toThrow(RangeError);
  });

  test('valida o formato AAAA-NNNNNN', () => {
    expect(protocolo.valido('2026-000148')).toBe(true);
    expect(protocolo.valido('2026000148')).toBe(false);
    expect(protocolo.valido('26-148')).toBe(false);
    expect(protocolo.valido('')).toBe(false);
    expect(protocolo.valido(null)).toBe(false);
  });

  test('o próximo continua a sequência do ano', () => {
    expect(protocolo.proximo(2026, '2026-000148')).toBe('2026-000149');
  });

  test('o primeiro do ano começa em 1 quando não há anterior', () => {
    expect(protocolo.proximo(2027, null)).toBe('2027-000001');
  });
});
