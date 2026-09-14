'use strict';

/**
 * Integração do módulo administrativo: o foco é o RNF03 (o servidor confere
 * login e perfil a cada requisição) e a RN09 (só o administrador decide
 * pedidos, cadastra usuários e vê o painel).
 */

process.env.NODE_ENV = 'test';

jest.mock('../../src/config/database', () => ({
  sequelize: { transaction: (fn) => fn('T'), define: () => ({}) },
  Sequelize: require('sequelize'),
  testarConexao: jest.fn()
}));
jest.mock('../../src/models', () => ({ sequelize: { transaction: (fn) => fn('T') } }));
jest.mock('../../src/services/authService');
jest.mock('../../src/services/animalService');
jest.mock('../../src/services/solicitacaoService');
jest.mock('../../src/services/painelService');
jest.mock('../../src/services/usuarioService');
jest.mock('../../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }));

const request = require('supertest');
const app = require('../../src/app');
const authService = require('../../src/services/authService');
const animalService = require('../../src/services/animalService');
const solicitacaoService = require('../../src/services/solicitacaoService');
const painelService = require('../../src/services/painelService');
const usuarioService = require('../../src/services/usuarioService');
const { ErroDeNegocio } = require('../../src/domain/erros');

const ADMIN = { id_usuario: 1, nome: 'Andressa Ávila', email: 'admin@adotapel.org.br', perfil: 'ADMINISTRADOR' };
const VOLUNTARIO = { id_usuario: 2, nome: 'Bruno Cardoso', email: 'voluntario@adotapel.org.br', perfil: 'VOLUNTARIO' };

const LISTA_VAZIA = { itens: [], total: 0, pagina: 1, porPagina: 12, paginas: 1 };

/** Faz o login de verdade pela rota e devolve o cookie de sessão. */
async function entrar(usuario) {
  const pagina = await request(app).get('/admin/login');
  const cookieInicial = pagina.headers['set-cookie'];
  const token = /name="_csrf" value="([^"]+)"/.exec(pagina.text)[1];

  authService.autenticar.mockResolvedValue(usuario);

  const login = await request(app).post('/admin/login').set('Cookie', cookieInicial).type('form')
    .send({ email: usuario.email, senha: 'Senha@2026', _csrf: token });

  const cookie = login.headers['set-cookie'] || cookieInicial;
  const dentro = await request(app).get('/admin/animais').set('Cookie', cookie);
  const tokenNovo = /name="_csrf" value="([^"]+)"/.exec(dentro.text)[1];

  return { cookie, token: tokenNovo };
}

beforeEach(() => {
  jest.clearAllMocks();
  animalService.listarAdmin.mockResolvedValue(LISTA_VAZIA);
  animalService.listarParaSelecao.mockResolvedValue([]);
  animalService.opcoesDeFiltro.mockResolvedValue({ especies: [], racas: [], caracteristicas: [] });
  solicitacaoService.listar.mockResolvedValue(LISTA_VAZIA);
  painelService.resumo.mockResolvedValue({
    animais: [], solicitacoes: [], totalAnimais: 0, totalSolicitacoes: 0,
    aguardando: 0, adocoesConcluidas: 0, recentes: []
  });
  usuarioService.listar.mockResolvedValue([]);
});

describe('RNF03 — o servidor confere o acesso a cada requisição', () => {
  test.each([
    '/admin',
    '/admin/animais',
    '/admin/animais/novo',
    '/admin/solicitacoes',
    '/admin/atendimentos',
    '/admin/usuarios'
  ])('%s sem login redireciona para a tela de entrada', async (caminho) => {
    const resposta = await request(app).get(caminho);

    expect(resposta.status).toBe(302);
    expect(resposta.headers.location).toBe('/admin/login');
  });

  test('POST sem login devolve 403, não redireciona', async () => {
    const pagina = await request(app).get('/admin/login');
    const cookie = pagina.headers['set-cookie'];
    const token = /name="_csrf" value="([^"]+)"/.exec(pagina.text)[1];

    const resposta = await request(app).post('/admin/animais/1/excluir')
      .set('Cookie', cookie).type('form').send({ _csrf: token });

    expect(resposta.status).toBe(403);
  });

  test('a tela de entrada não pede conta a quem só quer adotar', async () => {
    const resposta = await request(app).get('/admin/login');

    expect(resposta.status).toBe(200);
    expect(resposta.text).toContain('não precisa de conta');
  });

  test('credencial errada volta ao formulário com o aviso', async () => {
    const pagina = await request(app).get('/admin/login');
    const cookie = pagina.headers['set-cookie'];
    const token = /name="_csrf" value="([^"]+)"/.exec(pagina.text)[1];
    authService.autenticar.mockRejectedValue(new ErroDeNegocio('E-mail ou senha incorretos.', 'CREDENCIAL_INVALIDA'));

    const login = await request(app).post('/admin/login')
      .set('Cookie', cookie).set('Referer', 'http://localhost:3000/admin/login')
      .type('form').send({ email: 'admin@adotapel.org.br', senha: 'errada', _csrf: token });

    expect(login.status).toBe(302);
    const volta = await request(app).get('/admin/login').set('Cookie', cookie);
    expect(volta.text).toContain('E-mail ou senha incorretos.');
  });
});

describe('RN09 — o que só o administrador faz', () => {
  test('o voluntário entra na lista de animais', async () => {
    const { cookie } = await entrar(VOLUNTARIO);

    const resposta = await request(app).get('/admin/animais').set('Cookie', cookie);

    expect(resposta.status).toBe(200);
    expect(resposta.text).toContain('Animais cadastrados');
  });

  test.each(['/admin', '/admin/usuarios'])('o voluntário recebe 403 em %s', async (caminho) => {
    const { cookie } = await entrar(VOLUNTARIO);

    const resposta = await request(app).get(caminho).set('Cookie', cookie);

    expect(resposta.status).toBe(403);
    expect(resposta.text).toContain('Acesso negado');
  });

  test('o menu do voluntário não oferece Painel nem Usuários (RF12)', async () => {
    const { cookie } = await entrar(VOLUNTARIO);

    const resposta = await request(app).get('/admin/animais').set('Cookie', cookie);

    expect(resposta.text).not.toContain('href="/admin/usuarios"');
    expect(resposta.text).toContain('href="/admin/solicitacoes"');
  });

  test('o voluntário não registra decisão, mesmo enviando o POST direto', async () => {
    const { cookie, token } = await entrar(VOLUNTARIO);

    const resposta = await request(app).post('/admin/solicitacoes/9/decisao')
      .set('Cookie', cookie).type('form')
      .send({ status: 'APROVADA', observacao: '', _csrf: token });

    expect(resposta.status).toBe(403);
    expect(solicitacaoService.registrarDecisao).not.toHaveBeenCalled();
  });

  test('o administrador vê o painel e a lista de usuários', async () => {
    const { cookie } = await entrar(ADMIN);

    const painel = await request(app).get('/admin').set('Cookie', cookie);
    const usuarios = await request(app).get('/admin/usuarios').set('Cookie', cookie);

    expect(painel.status).toBe(200);
    expect(painel.text).toContain('adoções concluídas');
    expect(usuarios.status).toBe(200);
    expect(usuarios.text).toContain('Usuários da equipe');
  });

  test('o administrador registra a decisão e o serviço recebe quem decidiu', async () => {
    const { cookie, token } = await entrar(ADMIN);
    solicitacaoService.registrarDecisao.mockResolvedValue({
      solicitacao: { protocolo: '2026-000148' }, statusAnterior: 'PENDENTE', novoStatus: 'APROVADA', efeitos: []
    });

    const resposta = await request(app).post('/admin/solicitacoes/9/decisao')
      .set('Cookie', cookie).type('form')
      .send({ status: 'APROVADA', observacao: 'Casa conferida.', _csrf: token });

    expect(resposta.status).toBe(302);
    expect(solicitacaoService.registrarDecisao).toHaveBeenCalledWith(
      '9', 'APROVADA', 'Casa conferida.', expect.objectContaining({ perfil: 'ADMINISTRADOR' })
    );
  });
});

describe('Sessão', () => {
  test('sair encerra a sessão e a área volta a exigir login', async () => {
    const { cookie, token } = await entrar(ADMIN);

    const saida = await request(app).post('/admin/logout').set('Cookie', cookie).type('form').send({ _csrf: token });
    expect(saida.status).toBe(302);

    const depois = await request(app).get('/admin/animais').set('Cookie', cookie);
    expect(depois.status).toBe(302);
    expect(depois.headers.location).toBe('/admin/login');
  });

  test('a área administrativa pede para os buscadores não indexarem', async () => {
    const { cookie } = await entrar(ADMIN);

    const resposta = await request(app).get('/admin/animais').set('Cookie', cookie);

    expect(resposta.text).toContain('noindex');
  });
});
