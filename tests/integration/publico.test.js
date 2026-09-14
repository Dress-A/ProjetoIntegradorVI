'use strict';

/**
 * Testes de integração do módulo público: exercitam rota, middlewares,
 * validação e renderização das telas. Só a camada de persistência é
 * substituída, para que o teste rode sem banco.
 */

process.env.NODE_ENV = 'test';

jest.mock('../../src/config/database', () => ({
  sequelize: { transaction: (fn) => fn('T'), define: () => ({}) },
  Sequelize: require('sequelize'),
  testarConexao: jest.fn()
}));
jest.mock('../../src/models', () => ({ sequelize: { transaction: (fn) => fn('T') } }));
jest.mock('../../src/services/animalService');
jest.mock('../../src/services/solicitacaoService');
jest.mock('../../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }));

const request = require('supertest');
const app = require('../../src/app');
const animalService = require('../../src/services/animalService');
const solicitacaoService = require('../../src/services/solicitacaoService');
const { ErroNaoEncontrado, ErroDeNegocio } = require('../../src/domain/erros');

const ANIMAL = {
  id_animal: 1,
  nome: 'Mel',
  sexo: 'F',
  porte: 'MEDIO',
  idade_meses: 24,
  castrado: true,
  vacinado: true,
  vermifugado: true,
  data_resgate: '2025-11-12',
  descricao: 'Resgatada no bairro Fragata.',
  situacao: 'DISPONIVEL',
  especie: { nome: 'Cão' },
  raca: { nome: 'SRD' },
  fotos: [{ caminho_arquivo: '/uploads/demo/mel-1.svg', legenda: 'Mel no pátio', principal: true }],
  caracteristicas: [{ id_caracteristica: 1, nome: 'Dócil' }],
  atendimentos: []
};

const OPCOES = { especies: [{ id_especie: 1, nome: 'Cão', racas: [] }], racas: [], caracteristicas: [] };

beforeEach(() => {
  jest.clearAllMocks();
  animalService.opcoesDeFiltro.mockResolvedValue(OPCOES);
  animalService.listarDestaques.mockResolvedValue([ANIMAL]);
  animalService.listarPublico.mockResolvedValue({ itens: [ANIMAL], total: 1, pagina: 1, porPagina: 9, paginas: 1 });
  animalService.buscarPublico.mockResolvedValue(ANIMAL);
});

describe('Páginas institucionais (RF06)', () => {
  test.each([
    ['/', 'Adote com responsabilidade'],
    ['/sobre', 'Sobre a AdotaPel'],
    ['/servicos', 'Serviços oferecidos'],
    ['/relacionadas', 'Páginas relacionadas'],
    ['/contato', 'Contato'],
    ['/acompanhar', 'Acompanhar pedido']
  ])('%s responde 200 e traz o cabeçalho e o rodapé fixos', async (caminho, trecho) => {
    const resposta = await request(app).get(caminho);

    expect(resposta.status).toBe(200);
    expect(resposta.text).toContain(trecho);
    expect(resposta.text).toContain('Publicações populares');
    expect(resposta.text).toContain('id="menu-principal"');
  });
});

describe('Catálogo e perfil (UC01, UC02, UC03)', () => {
  test('o catálogo lista os animais e informa o total', async () => {
    const resposta = await request(app).get('/animais');

    expect(resposta.status).toBe(200);
    expect(resposta.text).toContain('Mel');
    expect(resposta.text).toContain('1 animal encontrado');
  });

  test('os filtros da URL chegam ao serviço (UC02)', async () => {
    await request(app).get('/animais?especie=1&porte=PEQUENO&porte=MEDIO&sexo=F&pagina=2');

    expect(animalService.listarPublico).toHaveBeenCalledWith(
      expect.objectContaining({ especie: 1, porte: ['PEQUENO', 'MEDIO'], sexo: ['F'] }),
      2
    );
  });

  test('o perfil mostra a ficha e o formulário de interesse', async () => {
    const resposta = await request(app).get('/animais/1');

    expect(resposta.status).toBe(200);
    expect(resposta.text).toContain('Formulário de interesse em adoção');
    expect(resposta.text).toContain('Idade aproximada');
    expect(resposta.text).toContain('2 anos');
  });

  test('animal fora do catálogo devolve a página 404', async () => {
    animalService.buscarPublico.mockRejectedValue(new ErroNaoEncontrado('Este animal não está mais publicado.'));

    const resposta = await request(app).get('/animais/999');

    expect(resposta.status).toBe(404);
  });

  test('animal em processo não exibe o formulário (RN01)', async () => {
    animalService.buscarPublico.mockResolvedValue({ ...ANIMAL, situacao: 'EM_PROCESSO' });

    const resposta = await request(app).get('/animais/1');

    expect(resposta.text).not.toContain('Formulário de interesse em adoção');
    expect(resposta.text).toContain('não está recebendo pedidos agora');
  });

  test('endereço inexistente cai na página 404', async () => {
    const resposta = await request(app).get('/pagina-que-nao-existe');

    expect(resposta.status).toBe(404);
    expect(resposta.text).toContain('Esta página não existe');
  });
});

describe('Envio do formulário de interesse (UC04 / UC13)', () => {
  /** Recupera o token CSRF e o cookie de sessão de uma página já renderizada. */
  async function abrirFormulario() {
    const pagina = await request(app).get('/animais/1');
    const cookie = pagina.headers['set-cookie'];
    const token = /name="_csrf" value="([^"]+)"/.exec(pagina.text)[1];
    return { cookie, token };
  }

  const CAMPOS = {
    nome_interessado: 'Maria S. Duarte',
    email: 'maria.duarte@exemplo.com.br',
    telefone: '(53) 99999-0148',
    cidade: 'Pelotas',
    uf: 'RS',
    tipo_moradia: 'CASA_COM_PATIO',
    mensagem: 'Tenho pátio cercado.',
    aceite: 'on'
  };

  test('dados válidos criam o pedido e levam à confirmação com o protocolo', async () => {
    const { cookie, token } = await abrirFormulario();
    solicitacaoService.registrarInteresse.mockResolvedValue({
      protocolo: '2026-000149', email: CAMPOS.email, id_animal: 1
    });

    const envio = await request(app)
      .post('/animais/1/interesse')
      .set('Cookie', cookie)
      .type('form')
      .send({ ...CAMPOS, _csrf: token });

    expect(envio.status).toBe(302);
    expect(envio.headers.location).toBe('/solicitacoes/confirmacao');

    const confirmacao = await request(app).get('/solicitacoes/confirmacao').set('Cookie', cookie);
    expect(confirmacao.text).toContain('2026-000149');
  });

  test('sem o código de segurança do formulário, o envio é recusado', async () => {
    const resposta = await request(app)
      .post('/animais/1/interesse')
      .type('form')
      .send(CAMPOS);

    expect(resposta.status).toBe(409);
    expect(solicitacaoService.registrarInteresse).not.toHaveBeenCalled();
  });

  test('RNF05 — dados inválidos são barrados no servidor, mesmo sem validação no navegador', async () => {
    const { cookie, token } = await abrirFormulario();

    const resposta = await request(app)
      .post('/animais/1/interesse')
      .set('Cookie', cookie)
      .type('form')
      .send({ ...CAMPOS, email: 'nao-e-email', telefone: '123', _csrf: token });

    expect(resposta.status).toBe(302);
    expect(resposta.headers.location).toBe('/animais/1#formulario');
    expect(solicitacaoService.registrarInteresse).not.toHaveBeenCalled();
  });

  test('sem aceitar as condições, o pedido não é criado', async () => {
    const { cookie, token } = await abrirFormulario();
    const semAceite = { ...CAMPOS };
    delete semAceite.aceite;

    await request(app).post('/animais/1/interesse').set('Cookie', cookie).type('form')
      .send({ ...semAceite, _csrf: token });

    expect(solicitacaoService.registrarInteresse).not.toHaveBeenCalled();
  });
});

describe('Consulta por protocolo (UC05)', () => {
  async function abrirConsulta() {
    const pagina = await request(app).get('/acompanhar');
    return {
      cookie: pagina.headers['set-cookie'],
      token: /name="_csrf" value="([^"]+)"/.exec(pagina.text)[1]
    };
  }

  test('protocolo e e-mail corretos mostram a etapa atual', async () => {
    const { cookie, token } = await abrirConsulta();
    solicitacaoService.consultarPorProtocolo.mockResolvedValue({
      protocolo: '2026-000148',
      status: 'EM_ANALISE',
      data_solicitacao: new Date('2026-09-02T14:12:00'),
      data_decisao: null,
      animal: { id_animal: 1, nome: 'Mel' },
      historico: [{ status_novo: 'PENDENTE', data_registro: new Date('2026-09-02T14:12:00') }]
    });

    const resposta = await request(app).post('/acompanhar').set('Cookie', cookie).type('form')
      .send({ protocolo: '2026-000148', email: 'maria.duarte@exemplo.com.br', _csrf: token });

    expect(resposta.status).toBe(200);
    expect(resposta.text).toContain('Em análise');
    expect(resposta.text).toContain('2026-000148');
  });

  test('protocolo fora do formato nem chega ao serviço', async () => {
    const { cookie, token } = await abrirConsulta();

    const resposta = await request(app).post('/acompanhar').set('Cookie', cookie).type('form')
      .send({ protocolo: '148', email: 'maria@exemplo.com', _csrf: token });

    expect(resposta.status).toBe(302);
    expect(solicitacaoService.consultarPorProtocolo).not.toHaveBeenCalled();
  });

  test('pedido inexistente devolve 404 sem revelar se o protocolo existe', async () => {
    const { cookie, token } = await abrirConsulta();
    solicitacaoService.consultarPorProtocolo.mockRejectedValue(
      new ErroNaoEncontrado('Não encontramos um pedido com esse protocolo e esse e-mail.')
    );

    const resposta = await request(app).post('/acompanhar').set('Cookie', cookie).type('form')
      .send({ protocolo: '2026-999999', email: 'maria@exemplo.com', _csrf: token });

    expect(resposta.status).toBe(404);
    expect(resposta.text).toContain('esse protocolo e esse e-mail');
  });

  test('erro de regra em POST devolve o usuário à página com o aviso', async () => {
    const { cookie, token } = await abrirConsulta();
    solicitacaoService.consultarPorProtocolo.mockRejectedValue(
      new ErroDeNegocio('Formato inválido.', 'PROTOCOLO_INVALIDO')
    );

    const resposta = await request(app).post('/acompanhar')
      .set('Cookie', cookie).set('Referer', 'http://localhost:3000/acompanhar')
      .type('form').send({ protocolo: '2026-000148', email: 'm@e.com', _csrf: token });

    expect(resposta.status).toBe(302);
    expect(resposta.headers.location).toBe('http://localhost:3000/acompanhar');
  });
});
