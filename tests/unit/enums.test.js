'use strict';

const enums = require('../../src/domain/enums');

describe('Listas fixas usadas nos formulários', () => {
  test('as opções batem com os CHECK do banco', () => {
    expect(enums.valores(enums.PORTES)).toEqual(['PEQUENO', 'MEDIO', 'GRANDE']);
    expect(enums.valores(enums.SEXOS)).toEqual(['F', 'M']);
    expect(enums.valores(enums.PERFIS)).toEqual(['VOLUNTARIO', 'ADMINISTRADOR']);
    expect(enums.valores(enums.TIPOS_MORADIA))
      .toEqual(['CASA_COM_PATIO', 'CASA_SEM_PATIO', 'APARTAMENTO', 'SITIO_CHACARA']);
  });

  test('as 27 unidades da federação estão na lista', () => {
    expect(enums.UFS).toHaveLength(27);
    expect(enums.UFS).toContain('RS');
  });

  test('o limite de fotos por animal é seis (RN08)', () => {
    expect(enums.MAX_FOTOS_POR_ANIMAL).toBe(6);
  });

  test('valor desconhecido volta como veio, em vez de sumir da tela', () => {
    expect(enums.rotuloDe(enums.PORTES, 'MEDIO')).toBe('Médio');
    expect(enums.rotuloDe(enums.PORTES, 'GIGANTE')).toBe('GIGANTE');
  });
});
