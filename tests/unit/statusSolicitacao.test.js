'use strict';

const statusSolicitacao = require('../../src/domain/statusSolicitacao');

describe('Máquina de estados da solicitação', () => {
  test('PENDENTE, EM_ANALISE e APROVADA contam como em aberto (RN02/RN05)', () => {
    expect(statusSolicitacao.estaEmAberto('PENDENTE')).toBe(true);
    expect(statusSolicitacao.estaEmAberto('EM_ANALISE')).toBe(true);
    expect(statusSolicitacao.estaEmAberto('APROVADA')).toBe(true);
    expect(statusSolicitacao.estaEmAberto('REJEITADA')).toBe(false);
    expect(statusSolicitacao.estaEmAberto('CONCLUIDA')).toBe(false);
    expect(statusSolicitacao.estaEmAberto('CANCELADA')).toBe(false);
  });

  test('só a partir de APROVADA é possível concluir', () => {
    expect(statusSolicitacao.podeTransicionar('APROVADA', 'CONCLUIDA')).toBe(true);
    expect(statusSolicitacao.podeTransicionar('PENDENTE', 'CONCLUIDA')).toBe(false);
    expect(statusSolicitacao.podeTransicionar('EM_ANALISE', 'CONCLUIDA')).toBe(false);
  });

  test('pedidos encerrados não mudam mais de situação', () => {
    ['REJEITADA', 'CONCLUIDA', 'CANCELADA'].forEach((status) => {
      expect(statusSolicitacao.proximosStatus(status)).toEqual([]);
      expect(() => statusSolicitacao.garantirTransicao(status, 'APROVADA', 'x'))
        .toThrow(/o pedido está encerrado/);
    });
  });

  test('RN10 — recusar ou cancelar exige a observação interna', () => {
    expect(() => statusSolicitacao.garantirTransicao('PENDENTE', 'REJEITADA', ''))
      .toThrow(/Escreva a observação interna/);
    expect(() => statusSolicitacao.garantirTransicao('PENDENTE', 'CANCELADA', '   '))
      .toThrow(/Escreva a observação interna/);
    expect(() => statusSolicitacao.garantirTransicao('PENDENTE', 'REJEITADA', 'Sem tela nas janelas.'))
      .not.toThrow();
  });

  test('aprovar não exige observação', () => {
    expect(statusSolicitacao.exigeObservacao('APROVADA')).toBe(false);
    expect(() => statusSolicitacao.garantirTransicao('EM_ANALISE', 'APROVADA')).not.toThrow();
  });

  test('cada situação tem explicação pública para o RF05', () => {
    statusSolicitacao.listar().forEach((status) => {
      expect(statusSolicitacao.explicacaoPublica(status).length).toBeGreaterThan(10);
    });
  });
});
