'use strict';

jest.mock('../../src/repositories/usuarioRepository');
jest.mock('../../src/services/authService', () => ({ gerarHash: jest.fn(async () => '$2a$10$hashfalso') }));
jest.mock('../../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }));

const usuarioRepository = require('../../src/repositories/usuarioRepository');
const usuarioService = require('../../src/services/usuarioService');

beforeEach(() => jest.clearAllMocks());

describe('Usuários da equipe (UC12)', () => {
  test('a senha inicial precisa ter 8 caracteres e misturar letras e números', () => {
    expect(() => usuarioService.validarSenha('curta1')).toThrow(/pelo menos 8/);
    expect(() => usuarioService.validarSenha('somenteletras')).toThrow(/letras e números/);
    expect(usuarioService.validarSenha('Voluntario2026')).toBe(true);
  });

  test('não cria duas contas com o mesmo e-mail', async () => {
    usuarioRepository.buscarPorEmail.mockResolvedValue({ id_usuario: 2 });

    await expect(usuarioService.cadastrar({
      nome: 'Bruno', email: 'BRUNO@adotapel.org.br', senha: 'Senha2026', perfil: 'VOLUNTARIO'
    })).rejects.toMatchObject({ codigo: 'EMAIL_DUPLICADO' });
  });

  test('grava o e-mail em minúsculas e a senha embaralhada', async () => {
    usuarioRepository.buscarPorEmail.mockResolvedValue(null);
    usuarioRepository.criar.mockImplementation(async (dados) => dados);

    const criado = await usuarioService.cadastrar({
      nome: '  Bruno Cardoso ', email: '  Bruno@AdotaPel.org.br ', senha: 'Senha2026', perfil: 'VOLUNTARIO'
    });

    expect(criado.email).toBe('bruno@adotapel.org.br');
    expect(criado.nome).toBe('Bruno Cardoso');
    expect(criado.senha_hash).toBe('$2a$10$hashfalso');
  });

  test('a organização não fica sem administrador ativo', async () => {
    usuarioRepository.buscarPorId.mockResolvedValue({
      id_usuario: 1, nome: 'Andressa', email: 'admin@adotapel.org.br', perfil: 'ADMINISTRADOR', ativo: true
    });
    usuarioRepository.contarAdministradoresAtivos.mockResolvedValue(1);

    await expect(usuarioService.alternarAtivo(1, 99)).rejects.toMatchObject({ codigo: 'ULTIMO_ADMIN' });
    await expect(usuarioService.editar(1, { nome: 'Andressa', email: 'admin@adotapel.org.br', perfil: 'VOLUNTARIO' }))
      .rejects.toMatchObject({ codigo: 'ULTIMO_ADMIN' });
  });

  test('ninguém desativa a própria conta', async () => {
    usuarioRepository.buscarPorId.mockResolvedValue({
      id_usuario: 1, nome: 'Andressa', perfil: 'ADMINISTRADOR', ativo: true
    });

    await expect(usuarioService.alternarAtivo(1, 1)).rejects.toMatchObject({ codigo: 'AUTO_DESATIVACAO' });
  });
});
