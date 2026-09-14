# Rastreabilidade — do requisito ao código

Serve para conferir, arquivo por arquivo, que tudo o que a entrega parcial prometeu
está implementado. Use como base do capítulo de revisão do escopo no relatório final.

## Requisitos funcionais

| ID | Requisito | Onde está |
|---|---|---|
| RF01 | Lista paginada com foto, nome, espécie, porte e idade | `controllers/publico/animalController.js` → `services/animalService.listarPublico` → `repositories/animalRepository.listar` → `views/publico/catalogo.ejs` |
| RF02 | Busca por nome e filtros | `validators/index.js` (`filtrosCatalogo`), `animalRepository.montarFiltros`, painel em `views/publico/catalogo.ejs` |
| RF03 | Página do animal com galeria e saúde | `animalController.perfil`, `views/publico/animal.ejs`, troca de foto em `public/js/principal.js` |
| RF04 | Pedido por formulário público com protocolo | `controllers/publico/solicitacaoController.registrar` → `services/solicitacaoService.registrarInteresse` → `views/publico/confirmacao.ejs` |
| RF05 | Consulta do andamento por protocolo e e-mail | `solicitacaoService.consultarPorProtocolo`, `views/publico/acompanhar.ejs` |
| RF06 | Páginas institucionais com estrutura repetida | `controllers/publico/paginasController.js`, `views/partials/cabecalho.ejs` e `rodape.ejs` |
| RF07 | Entrada por e-mail e senha, sessão até sair | `controllers/admin/authController.js`, `services/authService.js`, `middlewares/sessao.js` |
| RF08 | CRUD de animais e fotos, com confirmação antes de excluir | `controllers/admin/animalController.js`, `services/animalService.js`, `services/fotoService.js`, atributo `data-confirmar` nas views |
| RF09 | Situação só muda para as permitidas | `domain/statusAnimal.js`, `animalService.alterarSituacao` |
| RF10 | Lista de pedidos com filtros | `controllers/admin/solicitacaoController.listar`, `repositories/solicitacaoRepository.listar` |
| RF11 | Decisão com observação e histórico automático | `solicitacaoService.registrarDecisao` |
| RF12 | Cada função liberada conforme o perfil | `middlewares/autenticacao.js`, menu condicional em `views/partials/cabecalhoAdmin.ejs` |
| RF13 | Cadastrar, editar, desativar e redefinir senha | `controllers/admin/usuarioController.js`, `services/usuarioService.js` |
| RF14 | Registro de atendimentos | `controllers/admin/atendimentoController.js`, `services/atendimentoService.js` |
| RF15 | Aviso por e-mail a cada mudança | `services/emailService.notificarMudancaDeStatus` |
| RF16 | Painel com os números da operação | `services/painelService.js`, `views/admin/painel.ejs` |

## Requisitos não funcionais

| ID | Requisito | Onde está |
|---|---|---|
| RNF01 | 320 px a 1920 px, confirmação e retorno de toda ação | `public/css/estilo.css` (mobile-first, três pontos de quebra), `data-confirmar`, parcial `avisos.ejs` |
| RNF02 | HTML com significado, `alt`, rótulos, teclado, contraste | estrutura semântica das views, `helpers.legendaFoto`, `.rotulo-oculto`, `:focus-visible`, paleta conferida em 4,5:1 |
| RNF03 | Conferência de login e perfil no servidor; 403 | `middlewares/autenticacao.js`, `routes/adminRoutes.js`, `views/erros/403.ejs` |
| RNF04 | bcrypt e bloqueio após cinco erros | `services/authService.js`, colunas `tentativas_login` e `bloqueado_ate` |
| RNF05 | Validação no cliente e no servidor, consultas parametrizadas | `public/js/principal.js`, `validators/index.js`, Sequelize, escape do EJS |
| RNF06 | Dados do interessado só para quem está logado | rota `/admin/solicitacoes` protegida; a consulta pública mostra a etapa, nunca a observação interna |
| RNF07 | Registro imutável de cada mudança | tabela `historico_solicitacao`, gravada dentro da transação da decisão |
| RNF08 | Chaves, transações e inativação em vez de exclusão | `db/schema.sql`, `sequelize.transaction` nos services, `animalService.excluir` |
| RNF09 | Camadas, ESLint, commits e testes ≥ 60% | estrutura de pastas, `.eslintrc.json`, `jest.config.js` com `coverageThreshold` em 60% |
| RNF10 | Windows, Linux e macOS com Node 20+ | `engines` no `package.json`, dependências sem compilação nativa (bcryptjs no lugar do bcrypt em C) |

## Regras de negócio

| Regra | Onde está | Teste que prova |
|---|---|---|
| RN01 — só DISPONIVEL na lista e recebendo pedidos | `animalRepository.montarFiltros`, `solicitacaoService.registrarInteresse` | `animalService.test.js`, `solicitacaoService.test.js` |
| RN02 — um pedido em aberto por e-mail e animal | `solicitacaoRepository.existeEmAberto` | `solicitacaoService.test.js` |
| RN03 — protocolo AAAA-NNNNNN, único e fixo | `domain/protocolo.js` + `UNIQUE` e `CHECK` no banco | `protocolo.test.js` |
| RN04 — aprovar leva o animal a EM_PROCESSO | `solicitacaoService.registrarDecisao` | `solicitacaoService.test.js` |
| RN05 — concluir marca ADOTADO e recusa os outros | `solicitacaoService.registrarDecisao` | `solicitacaoService.test.js` |
| RN06 — cancelar aprovada devolve a DISPONIVEL | `solicitacaoService.registrarDecisao` | `solicitacaoService.test.js` |
| RN07 — animal com pedidos vira inativo | `animalService.excluir` | `animalService.test.js` |
| RN08 — seis fotos, exatamente uma principal | `fotoService.js` + índice parcial único | `fotoService.test.js` |
| RN09 — só o administrador decide e cadastra usuários | `exigirPerfil('ADMINISTRADOR')` nas rotas | `tests/integration/admin.test.js` |
| RN10 — recusar ou cancelar exige observação | `domain/statusSolicitacao.garantirTransicao` | `statusSolicitacao.test.js`, `solicitacaoService.test.js` |

## Casos de uso

| UC | Rota |
|---|---|
| UC01 Consultar catálogo | `GET /animais` |
| UC02 Pesquisar e filtrar | `GET /animais?termo=&especie=&porte=…` |
| UC03 Visualizar perfil | `GET /animais/:id` |
| UC04 Registrar interesse | `POST /animais/:id/interesse` |
| UC05 Acompanhar por protocolo | `GET` e `POST /acompanhar` |
| UC06 Autenticar-se | `GET` e `POST /admin/login` |
| UC07 Manter cadastro de animais | `/admin/animais…` |
| UC08 Gerenciar fotos | `/admin/animais/:id/fotos`, `/admin/fotos/:idFoto/…` |
| UC09 Atualizar situação | `POST /admin/animais/:id/situacao` |
| UC10 Gerenciar solicitações | `GET /admin/solicitacoes`, `GET /admin/solicitacoes/:id` |
| UC11 Registrar decisão | `POST /admin/solicitacoes/:id/decisao` |
| UC12 Manter usuários | `/admin/usuarios…` |
| UC13 Validar dados (include do UC04) | `validators/index.js` → `interesse` |
| UC14 Notificar por e-mail (extend do UC11) | `services/emailService.js` |
