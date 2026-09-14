'use strict';

jest.mock('../../src/repositories/usuarioRepository');
jest.mock('../../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }));

const bcrypt = require('bcryptjs');
const usuarioRepository = require('../../src/repositories/usuarioRepository');
const authService = require('../../src/services/authService');

let hashSenhaCerta;

beforeAll(async () => {
  hashSenhaCerta = await bcrypt.hash('Senha@2026', 10);
});

beforeEach(() => {
  jest.clearAllMocks();
  usuarioRepository.atualizar.mockResolvedValue({});
});

function usuarioFalso(extras = {}) {
  return {
    id_usuario: 1,
    nome: 'Andressa Ávila',
    email: 'admin@adotapel.org.br',
    senha_hash: hashSenhaCerta,
    perfil: 'ADMINISTRADOR',
    ativo: true,
    tentativas_login: 0,
    bloqueado_ate: null,
    ...extras
  };
}

describe('Autenticação (UC06 / RNF04)', () => {
  test('senha correta devolve os dados de sessão, nunca o hash', async () => {
    usuarioRepository.buscarPorEmailComSenha.mockResolvedValue(usuarioFalso());

    const sessao = await authService.autenticar('admin@adotapel.org.br', 'Senha@2026');

    expect(sessao).toEqual({
      id_usuario: 1, nome: 'Andressa Ávila', email: 'admin@adotapel.org.br', perfil: 'ADMINISTRADOR'
    });
    expect(sessao.senha_hash).toBeUndefined();
    expect(usuarioRepository.atualizar).toHaveBeenCalledWith(1, { tentativas_login: 0, bloqueado_ate: null });
  });

  test('e-mail inexistente e senha errada devolvem a mesma mensagem genérica', async () => {
    usuarioRepository.buscarPorEmailComSenha.mockResolvedValue(null);
    await expect(authService.autenticar('ninguem@exemplo.com', 'x'))
      .rejects.toMatchObject({ codigo: 'CREDENCIAL_INVALIDA' });

    usuarioRepository.buscarPorEmailComSenha.mockResolvedValue(usuarioFalso());
    await expect(authService.autenticar('admin@adotapel.org.br', 'errada'))
      .rejects.toMatchObject({ codigo: 'CREDENCIAL_INVALIDA' });
  });

  test('a quinta tentativa errada bloqueia a conta', async () => {
    usuarioRepository.buscarPorEmailComSenha.mockResolvedValue(usuarioFalso({ tentativas_login: 4 }));

    await expect(authService.autenticar('admin@adotapel.org.br', 'errada')).rejects.toThrow();

    const [, dados] = usuarioRepository.atualizar.mock.calls[0];
    expect(dados.bloqueado_ate).toBeInstanceOf(Date);
    expect(dados.tentativas_login).toBe(0);
  });

  test('conta bloqueada avisa quantos minutos faltam', async () => {
    const daquiUmaHora = new Date(Date.now() + 60 * 60 * 1000);
    usuarioRepository.buscarPorEmailComSenha.mockResolvedValue(usuarioFalso({ bloqueado_ate: daquiUmaHora }));

    await expect(authService.autenticar('admin@adotapel.org.br', 'Senha@2026'))
      .rejects.toMatchObject({ codigo: 'CONTA_BLOQUEADA' });
  });

  test('conta desativada não entra mesmo com a senha certa', async () => {
    usuarioRepository.buscarPorEmailComSenha.mockResolvedValue(usuarioFalso({ ativo: false }));

    await expect(authService.autenticar('admin@adotapel.org.br', 'Senha@2026'))
      .rejects.toMatchObject({ codigo: 'CONTA_DESATIVADA' });
  });

  test('a senha nunca é guardada como texto', async () => {
    const hash = await authService.gerarHash('Senha@2026');

    expect(hash).not.toContain('Senha@2026');
    expect(hash.startsWith('$2')).toBe(true);
    expect(await bcrypt.compare('Senha@2026', hash)).toBe(true);
  });
});
