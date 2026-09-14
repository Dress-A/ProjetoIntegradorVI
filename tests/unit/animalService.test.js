'use strict';

jest.mock('../../src/models', () => ({
  sequelize: { transaction: (fn) => fn('TRANSACAO_FALSA') }
}));
jest.mock('../../src/repositories/animalRepository');
jest.mock('../../src/repositories/solicitacaoRepository');
jest.mock('../../src/repositories/fotoRepository');
jest.mock('../../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }));

const animalRepository = require('../../src/repositories/animalRepository');
const solicitacaoRepository = require('../../src/repositories/solicitacaoRepository');
const animalService = require('../../src/services/animalService');

beforeEach(() => jest.clearAllMocks());

describe('Exclusão de animal (RN07 / RNF08)', () => {
  test('com pedidos vinculados, o registro é inativado e não apagado', async () => {
    animalRepository.buscarPorId.mockResolvedValue({ id_animal: 1, nome: 'Mel', situacao: 'DISPONIVEL' });
    solicitacaoRepository.contarPorAnimal.mockResolvedValue(3);

    const resultado = await animalService.excluir(1);

    expect(resultado).toEqual({ acao: 'INATIVADO', nome: 'Mel', solicitacoes: 3 });
    expect(animalRepository.inativar).toHaveBeenCalledWith(1, 'TRANSACAO_FALSA');
    expect(animalRepository.remover).not.toHaveBeenCalled();
  });

  test('sem pedidos vinculados, o registro é apagado de fato', async () => {
    animalRepository.buscarPorId.mockResolvedValue({ id_animal: 2, nome: 'Bilu', situacao: 'DISPONIVEL' });
    solicitacaoRepository.contarPorAnimal.mockResolvedValue(0);

    const resultado = await animalService.excluir(2);

    expect(resultado.acao).toBe('EXCLUIDO');
    expect(animalRepository.remover).toHaveBeenCalledWith(2, 'TRANSACAO_FALSA');
    expect(animalRepository.inativar).not.toHaveBeenCalled();
  });

  test('animal inexistente devolve erro de não encontrado', async () => {
    animalRepository.buscarPorId.mockResolvedValue(null);

    await expect(animalService.excluir(99)).rejects.toMatchObject({ codigo: 'NAO_ENCONTRADO' });
  });
});

describe('Mudança de situação (RF09)', () => {
  test('aplica a mudança permitida dentro da transação recebida', async () => {
    animalRepository.buscarSimples.mockResolvedValue({ id_animal: 1, situacao: 'DISPONIVEL' });
    animalRepository.atualizar.mockResolvedValue({ id_animal: 1, nome: 'Mel', situacao: 'EM_PROCESSO' });

    const atualizado = await animalService.alterarSituacao(1, 'EM_PROCESSO', 'TRANSACAO_EXTERNA');

    expect(animalRepository.buscarSimples).toHaveBeenCalledWith(1, 'TRANSACAO_EXTERNA');
    expect(animalRepository.atualizar).toHaveBeenCalledWith(1, { situacao: 'EM_PROCESSO' }, 'TRANSACAO_EXTERNA');
    expect(atualizado.situacao).toBe('EM_PROCESSO');
  });

  test('salto não previsto é recusado antes de gravar', async () => {
    animalRepository.buscarSimples.mockResolvedValue({ id_animal: 1, situacao: 'DISPONIVEL' });

    await expect(animalService.alterarSituacao(1, 'ADOTADO'))
      .rejects.toMatchObject({ codigo: 'TRANSICAO_INVALIDA' });
    expect(animalRepository.atualizar).not.toHaveBeenCalled();
  });
});

describe('Catálogo público', () => {
  test('a listagem pública pede somente animais publicáveis (RN01)', async () => {
    animalRepository.listar.mockResolvedValue({ itens: [], total: 0, pagina: 1, paginas: 1 });

    await animalService.listarPublico({ termo: 'mel' }, '2');

    expect(animalRepository.listar).toHaveBeenCalledWith(expect.objectContaining({
      somentePublico: true, pagina: 2, porPagina: animalService.POR_PAGINA_PUBLICO
    }));
  });

  test('página inválida cai para a primeira', async () => {
    animalRepository.listar.mockResolvedValue({ itens: [], total: 0, pagina: 1, paginas: 1 });

    await animalService.listarPublico({}, 'abc');

    expect(animalRepository.listar).toHaveBeenCalledWith(expect.objectContaining({ pagina: 1 }));
  });
});
