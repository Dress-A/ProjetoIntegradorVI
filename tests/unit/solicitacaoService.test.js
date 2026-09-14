'use strict';

/**
 * Regras RN01 a RN06 e RN10 testadas sem subir o servidor nem o banco:
 * a camada de persistência é substituída por dublês, o que só é possível
 * porque as regras vivem nos serviços (seção 6 do relatório).
 */

jest.mock('../../src/models', () => ({
  sequelize: { transaction: (fn) => fn('TRANSACAO_FALSA') }
}));
jest.mock('../../src/repositories/solicitacaoRepository');
jest.mock('../../src/repositories/animalRepository');
jest.mock('../../src/services/animalService');
jest.mock('../../src/services/emailService');
jest.mock('../../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }));

const solicitacaoRepository = require('../../src/repositories/solicitacaoRepository');
const animalRepository = require('../../src/repositories/animalRepository');
const animalService = require('../../src/services/animalService');
const emailService = require('../../src/services/emailService');
const solicitacaoService = require('../../src/services/solicitacaoService');

const DADOS_VALIDOS = {
  nome_interessado: 'Maria S. Duarte',
  email: 'maria.duarte@exemplo.com.br',
  telefone: '(53) 99999-0148',
  cidade: 'Pelotas',
  uf: 'rs',
  tipo_moradia: 'CASA_COM_PATIO',
  possui_outros_animais: true,
  mensagem: 'Tenho pátio cercado.'
};

function animalFalso(extras = {}) {
  return { id_animal: 1, nome: 'Mel', situacao: 'DISPONIVEL', ativo: true, ...extras };
}

beforeEach(() => {
  jest.clearAllMocks();
  emailService.notificarMudancaDeStatus.mockResolvedValue({ enviado: false });
  solicitacaoRepository.registrarHistorico.mockResolvedValue({});
  solicitacaoRepository.atualizarStatus.mockResolvedValue();
  solicitacaoRepository.listarEmAbertoDoAnimal.mockResolvedValue([]);
  animalService.alterarSituacao.mockResolvedValue({});
});

describe('registrarInteresse', () => {
  test('grava o pedido, gera o protocolo do ano e abre o histórico (RN03/RNF07)', async () => {
    animalRepository.buscarSimples.mockResolvedValue(animalFalso());
    solicitacaoRepository.existeEmAberto.mockResolvedValue(false);
    solicitacaoRepository.ultimoProtocoloDoAno.mockResolvedValue(`${new Date().getFullYear()}-000148`);
    solicitacaoRepository.criar.mockImplementation(async (dados) => ({ id_solicitacao: 9, ...dados }));

    const criada = await solicitacaoService.registrarInteresse(1, DADOS_VALIDOS);

    expect(criada.protocolo).toBe(`${new Date().getFullYear()}-000149`);
    expect(criada.status).toBe('PENDENTE');
    expect(criada.email).toBe('maria.duarte@exemplo.com.br');
    expect(criada.uf).toBe('RS');
    expect(solicitacaoRepository.registrarHistorico).toHaveBeenCalledWith(
      expect.objectContaining({ status_anterior: null, status_novo: 'PENDENTE', id_usuario: null }),
      'TRANSACAO_FALSA'
    );
  });

  test('RN01 — animal que não está DISPONIVEL não recebe pedido', async () => {
    animalRepository.buscarSimples.mockResolvedValue(animalFalso({ situacao: 'EM_PROCESSO' }));

    await expect(solicitacaoService.registrarInteresse(1, DADOS_VALIDOS))
      .rejects.toMatchObject({ codigo: 'ANIMAL_INDISPONIVEL' });
    expect(solicitacaoRepository.criar).not.toHaveBeenCalled();
  });

  test('animal inativo não aparece nem recebe pedido (RN07)', async () => {
    animalRepository.buscarSimples.mockResolvedValue(animalFalso({ ativo: false }));

    await expect(solicitacaoService.registrarInteresse(1, DADOS_VALIDOS))
      .rejects.toMatchObject({ codigo: 'NAO_ENCONTRADO' });
  });

  test('RN02 — o mesmo e-mail não abre dois pedidos para o mesmo animal', async () => {
    animalRepository.buscarSimples.mockResolvedValue(animalFalso());
    solicitacaoRepository.existeEmAberto.mockResolvedValue(true);

    await expect(solicitacaoService.registrarInteresse(1, DADOS_VALIDOS))
      .rejects.toMatchObject({ codigo: 'PEDIDO_DUPLICADO' });
    expect(solicitacaoRepository.criar).not.toHaveBeenCalled();
  });
});

describe('consultarPorProtocolo (RF05)', () => {
  test('recusa protocolo fora do formato antes de consultar o banco', async () => {
    await expect(solicitacaoService.consultarPorProtocolo('148', 'maria@exemplo.com'))
      .rejects.toMatchObject({ codigo: 'PROTOCOLO_INVALIDO' });
    expect(solicitacaoRepository.buscarPorProtocoloEEmail).not.toHaveBeenCalled();
  });

  test('não encontrando protocolo e e-mail juntos, devolve não encontrado', async () => {
    solicitacaoRepository.buscarPorProtocoloEEmail.mockResolvedValue(null);

    await expect(solicitacaoService.consultarPorProtocolo('2026-000148', 'outro@exemplo.com'))
      .rejects.toMatchObject({ codigo: 'NAO_ENCONTRADO' });
  });
});

describe('registrarDecisao (RF11 / UC11)', () => {
  const ADMIN = { id_usuario: 1, nome: 'Andressa', email: 'admin@adotapel.org.br', perfil: 'ADMINISTRADOR' };

  function pedidoFalso(status, extras = {}) {
    return {
      id_solicitacao: 9,
      id_animal: 1,
      protocolo: '2026-000148',
      email: 'maria.duarte@exemplo.com.br',
      nome_interessado: 'Maria S. Duarte',
      status,
      data_decisao: null,
      animal: animalFalso(extras.animal || {}),
      ...extras
    };
  }

  test('RN04 — aprovar coloca o animal em EM_PROCESSO e não mexe nos outros pedidos', async () => {
    solicitacaoRepository.buscarPorId.mockResolvedValue(pedidoFalso('EM_ANALISE'));

    const resultado = await solicitacaoService.registrarDecisao(9, 'APROVADA', 'Casa conferida.', ADMIN);

    expect(animalService.alterarSituacao).toHaveBeenCalledWith(1, 'EM_PROCESSO', 'TRANSACAO_FALSA');
    expect(solicitacaoRepository.listarEmAbertoDoAnimal).not.toHaveBeenCalled();
    expect(resultado.novoStatus).toBe('APROVADA');
  });

  test('RN05 — concluir marca o animal como ADOTADO e recusa os outros pedidos em aberto', async () => {
    solicitacaoRepository.buscarPorId.mockResolvedValue(pedidoFalso('APROVADA'));
    solicitacaoRepository.listarEmAbertoDoAnimal.mockResolvedValue([
      { id_solicitacao: 10, status: 'PENDENTE' },
      { id_solicitacao: 11, status: 'EM_ANALISE' }
    ]);

    const resultado = await solicitacaoService.registrarDecisao(9, 'CONCLUIDA', '', ADMIN);

    expect(animalService.alterarSituacao).toHaveBeenCalledWith(1, 'ADOTADO', 'TRANSACAO_FALSA');
    expect(solicitacaoRepository.atualizarStatus).toHaveBeenCalledWith(
      10, expect.objectContaining({ status: 'REJEITADA' }), 'TRANSACAO_FALSA'
    );
    expect(solicitacaoRepository.atualizarStatus).toHaveBeenCalledWith(
      11, expect.objectContaining({ status: 'REJEITADA' }), 'TRANSACAO_FALSA'
    );
    expect(resultado.efeitos.join(' ')).toMatch(/2 pedido\(s\) em aberto foram recusados/);
  });

  test('RN06 — cancelar um pedido aprovado devolve o animal para DISPONIVEL', async () => {
    solicitacaoRepository.buscarPorId.mockResolvedValue(pedidoFalso('APROVADA'));

    await solicitacaoService.registrarDecisao(9, 'CANCELADA', 'Adotante desistiu.', ADMIN);

    expect(animalService.alterarSituacao).toHaveBeenCalledWith(1, 'DISPONIVEL', 'TRANSACAO_FALSA');
  });

  test('cancelar um pedido ainda pendente não mexe na situação do animal', async () => {
    solicitacaoRepository.buscarPorId.mockResolvedValue(pedidoFalso('PENDENTE'));

    await solicitacaoService.registrarDecisao(9, 'CANCELADA', 'Pedido duplicado.', ADMIN);

    expect(animalService.alterarSituacao).not.toHaveBeenCalled();
  });

  test('RN10 — recusar sem observação é bloqueado antes de qualquer gravação', async () => {
    solicitacaoRepository.buscarPorId.mockResolvedValue(pedidoFalso('PENDENTE'));

    await expect(solicitacaoService.registrarDecisao(9, 'REJEITADA', '   ', ADMIN))
      .rejects.toMatchObject({ codigo: 'OBSERVACAO_OBRIGATORIA' });
    expect(solicitacaoRepository.atualizarStatus).not.toHaveBeenCalled();
    expect(solicitacaoRepository.registrarHistorico).not.toHaveBeenCalled();
  });

  test('toda decisão grava o histórico com autor, situação anterior e observação (RNF07)', async () => {
    solicitacaoRepository.buscarPorId.mockResolvedValue(pedidoFalso('PENDENTE'));

    await solicitacaoService.registrarDecisao(9, 'EM_ANALISE', 'Entrevista marcada.', ADMIN);

    expect(solicitacaoRepository.registrarHistorico).toHaveBeenCalledWith(
      expect.objectContaining({
        id_solicitacao: 9,
        id_usuario: 1,
        status_anterior: 'PENDENTE',
        status_novo: 'EM_ANALISE',
        observacao: 'Entrevista marcada.'
      }),
      'TRANSACAO_FALSA'
    );
  });

  test('RF15 — o aviso por e-mail sai depois da transação e sua falha não desfaz a decisão', async () => {
    solicitacaoRepository.buscarPorId.mockResolvedValue(pedidoFalso('PENDENTE'));
    emailService.notificarMudancaDeStatus.mockRejectedValue(new Error('SMTP fora do ar'));

    const resultado = await solicitacaoService.registrarDecisao(9, 'EM_ANALISE', '', ADMIN);

    expect(resultado.novoStatus).toBe('EM_ANALISE');
    expect(emailService.notificarMudancaDeStatus).toHaveBeenCalled();
  });

  test('salto inválido de situação é recusado', async () => {
    solicitacaoRepository.buscarPorId.mockResolvedValue(pedidoFalso('PENDENTE'));

    await expect(solicitacaoService.registrarDecisao(9, 'CONCLUIDA', '', ADMIN))
      .rejects.toMatchObject({ codigo: 'TRANSACAO_INVALIDA' });
  });
});
