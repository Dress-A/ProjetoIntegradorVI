'use strict';

const statusAnimal = require('../../src/domain/statusAnimal');

describe('Máquina de estados do animal (RF09)', () => {
  test('lista as quatro situações previstas na seção 6', () => {
    expect(statusAnimal.listar()).toEqual(['DISPONIVEL', 'EM_PROCESSO', 'ADOTADO', 'INDISPONIVEL']);
  });

  test.each([
    ['DISPONIVEL', 'EM_PROCESSO'],
    ['DISPONIVEL', 'INDISPONIVEL'],
    ['EM_PROCESSO', 'ADOTADO'],
    ['EM_PROCESSO', 'DISPONIVEL'],
    ['ADOTADO', 'DISPONIVEL'],
    ['INDISPONIVEL', 'DISPONIVEL']
  ])('aceita ir de %s para %s', (atual, nova) => {
    expect(statusAnimal.podeTransicionar(atual, nova)).toBe(true);
    expect(() => statusAnimal.garantirTransicao(atual, nova)).not.toThrow();
  });

  test.each([
    ['DISPONIVEL', 'ADOTADO'],
    ['ADOTADO', 'EM_PROCESSO'],
    ['INDISPONIVEL', 'ADOTADO']
  ])('recusa o salto de %s para %s', (atual, nova) => {
    expect(statusAnimal.podeTransicionar(atual, nova)).toBe(false);
    expect(() => statusAnimal.garantirTransicao(atual, nova)).toThrow(/Não é possível ir/);
  });

  test('a mensagem de recusa indica as opções válidas', () => {
    expect(() => statusAnimal.garantirTransicao('DISPONIVEL', 'ADOTADO'))
      .toThrow(/Opções válidas: Em processo, Indisponível/);
  });

  test('recusa situação inexistente e repetição da situação atual', () => {
    expect(() => statusAnimal.garantirTransicao('DISPONIVEL', 'SUMIU')).toThrow(/não existe/);
    expect(() => statusAnimal.garantirTransicao('ADOTADO', 'ADOTADO')).toThrow(/já está/);
  });
});
