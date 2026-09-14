'use strict';

jest.mock('../../src/repositories/animalRepository');
jest.mock('../../src/repositories/solicitacaoRepository');

const animalRepository = require('../../src/repositories/animalRepository');
const solicitacaoRepository = require('../../src/repositories/solicitacaoRepository');
const painelService = require('../../src/services/painelService');

beforeEach(() => jest.clearAllMocks());

describe('Painel (RF16)', () => {
  test('monta os números por situação, completando com zero o que não veio do banco', async () => {
    animalRepository.contarPorSituacao.mockResolvedValue({ DISPONIVEL: 8, ADOTADO: 2 });
    solicitacaoRepository.contarPorStatus.mockResolvedValue({ PENDENTE: 3, CONCLUIDA: 1 });
    solicitacaoRepository.listarRecentes.mockResolvedValue([]);

    const resumo = await painelService.resumo();

    expect(resumo.animais).toEqual([
      { chave: 'DISPONIVEL', rotulo: 'Disponível', total: 8 },
      { chave: 'EM_PROCESSO', rotulo: 'Em processo', total: 0 },
      { chave: 'ADOTADO', rotulo: 'Adotado', total: 2 },
      { chave: 'INDISPONIVEL', rotulo: 'Indisponível', total: 0 }
    ]);
    expect(resumo.totalAnimais).toBe(10);
    expect(resumo.totalSolicitacoes).toBe(4);
    expect(resumo.adocoesConcluidas).toBe(1);
  });

  test('"aguardando decisão" soma pendentes e em análise', async () => {
    animalRepository.contarPorSituacao.mockResolvedValue({});
    solicitacaoRepository.contarPorStatus.mockResolvedValue({ PENDENTE: 3, EM_ANALISE: 2, APROVADA: 1 });
    solicitacaoRepository.listarRecentes.mockResolvedValue([]);

    const resumo = await painelService.resumo();

    expect(resumo.aguardando).toBe(5);
  });
});
