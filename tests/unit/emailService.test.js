'use strict';

const fs = require('fs');
const path = require('path');

jest.mock('../../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }));

const env = require('../../src/config/env');
const emailService = require('../../src/services/emailService');

const SOLICITACAO = {
  protocolo: '2026-000148',
  nome_interessado: 'Maria S. Duarte',
  email: 'maria.duarte@exemplo.com.br',
  animal: { nome: 'Mel' }
};

function limparCaixa() {
  const pasta = path.resolve(env.raiz, 'logs', 'emails');
  if (fs.existsSync(pasta)) fs.rmSync(pasta, { recursive: true, force: true });
  return pasta;
}

describe('Aviso por e-mail (RF15 / UC14)', () => {
  afterAll(() => limparCaixa());

  test('sem SMTP configurado, a mensagem é gravada em arquivo em vez de sair pela rede', async () => {
    const pasta = limparCaixa();

    const resultado = await emailService.notificarMudancaDeStatus(SOLICITACAO, 'APROVADA', null);

    expect(resultado.enviado).toBe(false);
    expect(fs.existsSync(resultado.arquivo)).toBe(true);
    expect(fs.readdirSync(pasta)).toHaveLength(1);
  });

  test('a mensagem traz protocolo, animal e a nova situação por extenso', async () => {
    limparCaixa();

    const { arquivo } = await emailService.notificarMudancaDeStatus(SOLICITACAO, 'CONCLUIDA', null);
    const conteudo = fs.readFileSync(arquivo, 'utf8');

    expect(conteudo).toContain('maria.duarte@exemplo.com.br');
    expect(conteudo).toContain('2026-000148');
    expect(conteudo).toContain('Mel');
    expect(conteudo).toContain('Concluída');
  });

  test('a observação interna só acompanha recusa e cancelamento', async () => {
    limparCaixa();
    const motivo = 'Janelas sem tela de proteção.';

    const recusa = await emailService.notificarMudancaDeStatus(SOLICITACAO, 'REJEITADA', motivo);
    expect(fs.readFileSync(recusa.arquivo, 'utf8')).toContain(motivo);

    limparCaixa();
    const analise = await emailService.notificarMudancaDeStatus(SOLICITACAO, 'EM_ANALISE', motivo);
    expect(fs.readFileSync(analise.arquivo, 'utf8')).not.toContain(motivo);
  });

  test('sem host e usuário no .env, o serviço se reconhece como não configurado', () => {
    expect(emailService.smtpConfigurado()).toBe(Boolean(env.smtp.host && env.smtp.usuario));
  });
});
