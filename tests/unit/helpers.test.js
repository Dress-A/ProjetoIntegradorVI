'use strict';

const f = require('../../src/views/helpers');

describe('Formatação das telas', () => {
  test('idade em meses vira texto legível', () => {
    expect(f.idade(0)).toBe('Recém-nascido');
    expect(f.idade(1)).toBe('1 mês');
    expect(f.idade(6)).toBe('6 meses');
    expect(f.idade(12)).toBe('1 ano');
    expect(f.idade(24)).toBe('2 anos');
    expect(f.idade(30)).toBe('2 anos e 6 meses');
  });

  test('animal sem foto recebe imagem e texto alternativo próprios (RNF02)', () => {
    const semFoto = { nome: 'Mel', fotos: [] };
    expect(f.fotoPrincipal(semFoto)).toBe('/img/sem-foto.svg');
    expect(f.legendaFoto(semFoto)).toBe('Foto de Mel');
  });

  test('a foto marcada como principal ganha da primeira da lista', () => {
    const animal = {
      nome: 'Mel',
      fotos: [
        { caminho_arquivo: '/uploads/a.jpg', principal: false, legenda: 'A' },
        { caminho_arquivo: '/uploads/b.jpg', principal: true, legenda: 'B' }
      ]
    };
    expect(f.fotoPrincipal(animal)).toBe('/uploads/b.jpg');
    expect(f.legendaFoto(animal)).toBe('B');
  });

  test('resumo do cartão segue o wireframe da seção 7', () => {
    const animal = { nome: 'Mel', especie: { nome: 'Cão' }, sexo: 'F', porte: 'MEDIO', idade_meses: 24 };
    expect(f.resumoAnimal(animal)).toBe('Cão · Fêmea · Médio · 2 anos');
  });

  test('a paginação preserva os filtros escolhidos', () => {
    expect(f.comPagina('especie=1&porte=PEQUENO', 3)).toBe('?especie=1&porte=PEQUENO&pagina=3');
    expect(f.comPagina('', 2)).toBe('?pagina=2');
  });

  test('só as mudanças de situação permitidas chegam à tela', () => {
    expect(f.proximasSituacoes('DISPONIVEL')).toEqual([
      { valor: 'EM_PROCESSO', rotulo: 'Em processo' },
      { valor: 'INDISPONIVEL', rotulo: 'Indisponível' }
    ]);
  });

  test('telefone é formatado com DDD', () => {
    expect(f.telefone('53999990148')).toBe('(53) 99999-0148');
    expect(f.telefone('5332221000')).toBe('(53) 3222-1000');
  });
});
