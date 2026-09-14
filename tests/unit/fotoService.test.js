'use strict';

jest.mock('../../src/models', () => ({
  sequelize: { transaction: (fn) => fn('TRANSACAO_FALSA') }
}));
jest.mock('../../src/repositories/fotoRepository');
jest.mock('../../src/repositories/animalRepository');
jest.mock('../../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }));

const fotoRepository = require('../../src/repositories/fotoRepository');
const animalRepository = require('../../src/repositories/animalRepository');
const fotoService = require('../../src/services/fotoService');

beforeEach(() => {
  jest.clearAllMocks();
  animalRepository.buscarPorId.mockResolvedValue({ id_animal: 1, nome: 'Mel' });
  fotoRepository.criar.mockImplementation(async (dados) => ({ id_foto: 1, ...dados }));
});

describe('Fotos do animal (RN08)', () => {
  test('a primeira foto do animal vira a principal automaticamente', async () => {
    fotoRepository.contarPorAnimal.mockResolvedValue(0);

    const criadas = await fotoService.adicionar(1, [{ filename: 'a.jpg' }, { filename: 'b.jpg' }], ['Mel no pátio']);

    expect(criadas[0].principal).toBe(true);
    expect(criadas[1].principal).toBe(false);
    expect(criadas[0].legenda).toBe('Mel no pátio');
    expect(criadas[1].legenda).toBe('Foto de Mel');
  });

  test('fotos enviadas depois não roubam o posto de principal', async () => {
    fotoRepository.contarPorAnimal.mockResolvedValue(2);

    const criadas = await fotoService.adicionar(1, [{ filename: 'c.jpg' }], []);

    expect(criadas[0].principal).toBe(false);
    expect(criadas[0].ordem).toBe(3);
  });

  test('o limite de seis fotos por animal é respeitado', async () => {
    fotoRepository.contarPorAnimal.mockResolvedValue(5);

    await expect(fotoService.adicionar(1, [{ filename: 'x.jpg' }, { filename: 'y.jpg' }], []))
      .rejects.toMatchObject({ codigo: 'LIMITE_DE_FOTOS' });
    expect(fotoRepository.criar).not.toHaveBeenCalled();
  });

  test('remover a principal promove a foto seguinte', async () => {
    fotoRepository.buscarPorId.mockResolvedValue({ id_foto: 4, id_animal: 1, principal: true, caminho_arquivo: '/uploads/demo/mel-1.svg' });
    fotoRepository.primeiraDoAnimal.mockResolvedValue({ id_foto: 5 });

    await fotoService.remover(4);

    expect(fotoRepository.remover).toHaveBeenCalledWith(4, 'TRANSACAO_FALSA');
    expect(fotoRepository.definirPrincipal).toHaveBeenCalledWith(5, 'TRANSACAO_FALSA');
  });

  test('ordem fora da faixa é recusada', async () => {
    fotoRepository.buscarPorId.mockResolvedValue({ id_foto: 4, id_animal: 1 });

    await expect(fotoService.reordenar(4, 9)).rejects.toMatchObject({ codigo: 'ORDEM_INVALIDA' });
  });
});
