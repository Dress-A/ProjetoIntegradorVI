'use strict';

jest.mock('../../src/repositories/atendimentoRepository');
jest.mock('../../src/repositories/animalRepository');
jest.mock('../../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }));

const atendimentoRepository = require('../../src/repositories/atendimentoRepository');
const animalRepository = require('../../src/repositories/animalRepository');
const atendimentoService = require('../../src/services/atendimentoService');

beforeEach(() => jest.clearAllMocks());

describe('Atendimentos (RF14)', () => {
  test('registra vinculando ao animal e a quem estava logado', async () => {
    animalRepository.buscarSimples.mockResolvedValue({ id_animal: 1, nome: 'Mel' });
    atendimentoRepository.criar.mockImplementation(async (dados) => ({ id_atendimento: 5, ...dados }));

    const criado = await atendimentoService.registrar({
      id_animal: 1, tipo: 'VACINA', descricao: '  V10, primeira dose.  ', data_ocorrencia: '2026-09-10'
    }, 2);

    expect(criado.id_usuario).toBe(2);
    expect(criado.descricao).toBe('V10, primeira dose.');
  });

  test('não registra atendimento para animal inexistente', async () => {
    animalRepository.buscarSimples.mockResolvedValue(null);

    await expect(atendimentoService.registrar({ id_animal: 99, tipo: 'VACINA', descricao: 'x', data_ocorrencia: '2026-09-10' }, 2))
      .rejects.toMatchObject({ codigo: 'NAO_ENCONTRADO' });
    expect(atendimentoRepository.criar).not.toHaveBeenCalled();
  });

  test('o filtro por animal chega ao repositório', async () => {
    atendimentoRepository.listar.mockResolvedValue([]);

    await atendimentoService.listar({ animal: '3' });

    expect(atendimentoRepository.listar).toHaveBeenCalledWith({ idAnimal: '3' });
  });

  test('remover atendimento inexistente devolve não encontrado', async () => {
    atendimentoRepository.remover.mockResolvedValue(0);

    await expect(atendimentoService.remover(99)).rejects.toMatchObject({ codigo: 'NAO_ENCONTRADO' });
  });
});
