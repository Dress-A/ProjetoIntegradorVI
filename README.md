# AdotaPel — Plataforma web para adoção responsável e gestão de animais resgatados

Projeto integrador das disciplinas de **Engenharia de Software III** e **Programação Back-End**
do curso de Análise e Desenvolvimento de Sistemas da Universidade Católica de Pelotas.

Autoria: Andressa Ávila · Repositório: <https://github.com/Dress-A/ProjetoIntegradorVI>

> Todo o conteúdo do sistema — animais, pessoas, pedidos — é fictício, criado apenas
> para a demonstração acadêmica (RNF06 / LGPD).

---

## O que o sistema faz

**Módulo público** (sem login): catálogo paginado de animais disponíveis, busca por nome e
filtros por espécie, raça, porte, sexo, idade e características; página de cada animal com
galeria e situação de saúde; formulário de interesse que gera um protocolo único; e consulta
do andamento pelo protocolo e e-mail.

**Módulo administrativo** (com login): cadastro, edição e exclusão de animais e fotos; mudança
da situação do animal dentro do caminho permitido; registro de atendimentos; lista e análise
dos pedidos; registro da decisão com observação interna e gravação automática do histórico;
cadastro de usuários; e painel com os números da operação.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Apresentação | EJS, CSS3 (mobile-first), JavaScript ES6 |
| Aplicação | Express 4 (rotas, controllers, middlewares) |
| Negócio | Node.js 20+ (services, validadores, regras de domínio) |
| Persistência | Sequelize 6 (models e repositories) |
| Dados | PostgreSQL 16 |
| Transversais | bcryptjs, express-session, CSRF próprio, helmet, express-validator, morgan, winston, multer, Jest, Supertest, ESLint |

## Instalação

Pré-requisitos: **Node.js 20 ou mais novo** e **PostgreSQL 16**.

```bash
# 1. Baixar o projeto
git clone https://github.com/Dress-A/ProjetoIntegradorVI.git
cd ProjetoIntegradorVI

# 2. Instalar as dependências
npm install

# 3. Configurar o ambiente
cp .env.example .env        # no Windows: copy .env.example .env
#    edite o .env com o usuário e a senha do seu PostgreSQL

# 4. Criar o banco (uma vez só)
psql -U postgres -f scripts/criar-banco.sql

# 5. Criar as tabelas e carregar os dados de demonstração
npm run db:setup

# 6. Subir a aplicação
npm start
```

O site fica em <http://localhost:3000> e a administração em <http://localhost:3000/admin/login>.

### Contas de demonstração

Criadas pelo `npm run db:setup`, com os valores do `.env`:

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin@adotapel.org.br` | `Admin@2026` |
| Voluntário | `voluntario@adotapel.org.br` | `Voluntario@2026` |

As senhas são gravadas embaralhadas pelo bcrypt; nenhum hash fica fixo no repositório.

## Conferência rápida depois de instalar

Cinco passos que confirmam que tudo subiu certo. Levam menos de dois minutos.

1. `npm start` imprime `AdotaPel no ar em http://localhost:3000`. Se parar em
   *Não foi possível conectar ao PostgreSQL*, o problema está no `.env` ou no banco.
2. Abrir <http://localhost:3000> mostra a página inicial com quatro animais em destaque.
   Se aparecer o texto *Nenhum animal publicado ainda*, o `npm run db:setup` não rodou.
3. Em **Animais**, filtrar por espécie Gato e porte Pequeno devolve três resultados.
4. Abrir um animal, enviar o formulário de interesse e conferir que aparece um protocolo
   no formato `2026-000001`. Consultá-lo em **Acompanhar pedido** deve mostrar "Pendente".
5. Entrar em `/admin/login` com a conta de administradora e conferir que o painel abre
   com os números preenchidos.

Se algum passo falhar, a mensagem de erro fica em `logs/erro.log`.

### Erros comuns

| Mensagem | O que fazer |
|---|---|
| `password authentication failed for user` | Ajustar `DB_USER` e `DB_PASSWORD` no `.env` |
| `database "adotapel" does not exist` | Rodar `scripts/criar-banco.sql` antes do `npm run db:setup` |
| `relation "animal" does not exist` | Rodar `npm run db:setup` |
| `EADDRINUSE :::3000` | Outra aplicação está na porta 3000; trocar `PORT` no `.env` |

## Comandos

| Comando | O que faz |
|---|---|
| `npm start` | Sobe o servidor |
| `npm run dev` | Sobe com recarga automática |
| `npm run db:setup` | Recria o esquema e recarrega os dados de demonstração |
| `npm test` | Roda os testes automáticos |
| `npm run test:cov` | Roda os testes com relatório de cobertura |
| `npm run lint` | Confere o código com o ESLint |

## Organização das pastas

```
adotapel/
├── db/
│   ├── schema.sql              # criação das 10 tabelas, chaves, checks e índices
│   └── seed.sql                # dados de demonstração
├── scripts/
│   ├── criar-banco.sql         # CREATE DATABASE
│   └── setup-db.js             # roda o schema, cria usuários com bcrypt, roda o seed
├── src/
│   ├── config/                 # ambiente, conexão e log
│   ├── domain/                 # regras puras: estados, protocolo, erros, listas fixas
│   ├── models/                 # ── PERSISTÊNCIA: mapeamento objeto-relacional
│   ├── repositories/           # ── PERSISTÊNCIA: consultas, filtros e paginação
│   ├── services/               # ── NEGÓCIO: RN01 a RN10 e transações
│   ├── validators/             # ── NEGÓCIO: conferência dos dados no servidor
│   ├── controllers/            # ── APLICAÇÃO: recebem, delegam e respondem
│   ├── routes/                 # ── APLICAÇÃO: endereços
│   ├── middlewares/            # ── APLICAÇÃO: sessão, perfil, CSRF, upload, erros
│   ├── views/                  # ── APRESENTAÇÃO: templates EJS
│   ├── public/                 # ── APRESENTAÇÃO: CSS, JS e imagens
│   ├── app.js                  # montagem da aplicação
│   └── server.js               # ponto de entrada
├── tests/
│   ├── unit/                   # regras de negócio, sem servidor e sem banco
│   └── integration/            # rotas de ponta a ponta, com Supertest
└── docs/                       # dicionário de dados e material do relatório final
```

**A regra que organiza tudo:** cada camada só conhece a camada logo abaixo dela. Nenhum
controller acessa o banco e nenhuma view chama um service — dá para conferir só olhando
os `require` de cada arquivo.

## Segurança

- Sessão em cookie assinado, `httpOnly` e `sameSite=lax`; o identificador é trocado no login.
- Senhas com bcrypt (custo 10); cinco tentativas erradas bloqueiam a conta por 15 minutos.
- Toda rota administrativa passa por duas conferências no servidor: se há login e se o perfil
  alcança aquela função. Esconder botão não protege nada.
- Dados conferidos no navegador e de novo no servidor, com `express-validator`.
- Consultas parametrizadas pelo Sequelize; escape automático do EJS na saída.
- Código de segurança (CSRF) em todos os formulários, comparado em tempo constante.
- Upload limitado a JPEG e PNG de até 2 MB, com nome de arquivo gerado pelo servidor.
- Cabeçalhos de segurança e Content-Security-Policy pelo helmet.

## Envio de e-mail

Sem SMTP configurado no `.env`, o aviso de mudança de situação é gravado em
`logs/emails/` em vez de sair pela rede — assim a demonstração funciona offline e dá para
mostrar o conteúdo do que seria enviado. Com `SMTP_HOST` e `SMTP_USER` preenchidos, o envio
acontece de verdade.

## Documentação

- `docs/dicionario-de-dados.md` — todas as tabelas, colunas, tipos e chaves.
- `docs/rastreabilidade.md` — de cada requisito e regra até o arquivo que a implementa.
- `docs/relatorio-final.md` — roteiro do relatório e das capturas de tela.
