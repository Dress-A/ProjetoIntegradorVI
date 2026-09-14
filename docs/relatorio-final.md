# Material para o relatório final

O relatório final pede: revisão do escopo, diagramas atualizados, descrição da arquitetura,
resultados dos testes, capturas de tela e link do repositório. Este arquivo reúne o que o
código já resolveu, para você escrever cada capítulo sem precisar reabrir tudo.

---

## 1. Revisão do escopo — o que mudou da entrega parcial para cá

Nada foi retirado: os dezesseis requisitos funcionais e as dez regras de negócio estão
implementados. Cinco decisões apareceram durante a implementação e precisam ser registradas
no relatório, porque mudam figuras da entrega parcial.

**1. A tabela `animal` ganhou a coluna `ativo` (BOOLEAN).** A RN07 diz que animal com pedidos
vinculados nunca é apagado, só marcado como inativo — mas o modelo da seção 5 não tinha onde
guardar essa marca. Usar `situacao = INDISPONIVEL` não servia: "indisponível" é uma situação
legítima de um animal que continua no cadastro (em tratamento, por exemplo), enquanto
"inativo" quer dizer que o registro saiu de circulação. São coisas diferentes e precisavam de
campos diferentes. **A Figura 2 precisa ser atualizada.**

**2. A tabela `usuario` ganhou `tentativas_login` (SMALLINT) e `bloqueado_ate` (TIMESTAMP).**
O RNF04 exige bloquear a conta depois de cinco tentativas erradas, e isso precisa sobreviver
ao fim da sessão — logo, é dado, não estado de memória. **A Figura 2 precisa ser atualizada.**

**3. O caminho das situações do animal ficou completo.** A seção 6 nomeia as quatro situações,
mas não diz quem leva a quem. O que está implementado, e vale desenhar como diagrama de
estados no relatório final:

```
DISPONIVEL   → EM_PROCESSO, INDISPONIVEL
EM_PROCESSO  → ADOTADO, DISPONIVEL, INDISPONIVEL
ADOTADO      → DISPONIVEL              (devolução do animal)
INDISPONIVEL → DISPONIVEL
```

E para a solicitação:

```
PENDENTE   → EM_ANALISE, APROVADA, REJEITADA, CANCELADA
EM_ANALISE → APROVADA, REJEITADA, CANCELADA
APROVADA   → CONCLUIDA, CANCELADA
REJEITADA, CONCLUIDA, CANCELADA → encerradas
```

**4. bcryptjs no lugar do bcrypt.** O relatório parcial cita "bcrypt". A biblioteca `bcrypt`
compila código em C na instalação, o que costuma quebrar em máquina Windows sem as
ferramentas de compilação — e o RNF10 pede que o projeto instale em Windows, Linux e macOS a
partir do repositório. O `bcryptjs` implementa o mesmo algoritmo em JavaScript puro, gera
hashes no mesmo formato (`$2a$…`) e instala em qualquer lugar. Vale uma linha explicando a
troca.

**5. O CSRF é implementação própria, de 40 linhas.** A biblioteca `csurf`, que seria a escolha
óbvia, foi descontinuada pelo próprio Express. O middlewares `src/middlewares/csrf.js` gera um
token por sessão e o compara em tempo constante com `crypto.timingSafeEqual`. Nos formulários
com arquivo a conferência acontece depois do multer, porque só ali o corpo da requisição já
foi lido.

Vale registrar também o que **não** mudou e por quê: o escopo negativo da seção 2 (aplicativo,
doações, chat, redes sociais, mapa, prontuário completo, assinatura eletrônica, WhatsApp)
continua de fora, sem exceção.

---

## 2. Descrição da arquitetura — o que dizer

A Figura 3 continua válida. O que o relatório final acrescenta é a prova de que a separação
foi mantida, e isso se demonstra com um argumento simples e verificável: **nenhum controller
importa um model ou um repository, e nenhuma view importa um service.** Confira você mesma
antes de escrever:

```bash
grep -rn "require.*models\|require.*repositories" src/controllers/   # deve não retornar nada
grep -rn "require" src/views/*.ejs                                    # deve não retornar nada
```

Três pontos que rendem bom texto:

- **Por que a camada de serviços se pagou.** As regras RN01 a RN10 são testadas em
  `tests/unit/` sem subir o servidor nem o banco: os repositórios são substituídos por dublês.
  Isso só é possível porque nenhuma regra ficou dentro do controller. Compare com o que
  aconteceria se a validação da RN05 estivesse na rota: para testá-la seria preciso um
  PostgreSQL de pé.
- **Transações.** Concluir uma adoção muda a solicitação, grava o histórico, muda a situação
  do animal e recusa os outros pedidos — quatro escritas que precisam valer juntas ou não
  valer. Estão dentro de uma `sequelize.transaction` em `solicitacaoService.registrarDecisao`.
  O aviso por e-mail fica de fora dela de propósito: SMTP fora do ar não pode desfazer uma
  decisão já tomada.
- **Máquina de estados como código, não como convenção.** `domain/statusAnimal.js` e
  `domain/statusSolicitacao.js` são tabelas de transições. Um salto inválido nunca chega ao
  banco e a mensagem de erro lista as opções válidas.

---

## 3. Resultados dos testes — como levantar os números

```bash
npm test              # roda tudo
npm run test:cov      # roda com o relatório de cobertura
```

Cole no relatório o resumo que o Jest imprime (suites, testes, tempo) e a tabela de cobertura
das pastas `services`, `domain` e `validators`. O `jest.config.js` reprova a execução se a
cobertura cair abaixo de 60%, que é o piso do RNF09 — vale dizer isso, porque mostra que o
número não é conferido no olho.

Ao descrever os testes, separe os dois tipos:

**Testes unitários** (`tests/unit/`) — as regras sozinhas, com os repositórios substituídos:

| Arquivo | O que prova |
|---|---|
| `statusAnimal.test.js` | transições válidas e inválidas do animal (RF09) |
| `statusSolicitacao.test.js` | transições do pedido e a RN10 |
| `protocolo.test.js` | formato, unicidade e sequência do protocolo (RN03) |
| `solicitacaoService.test.js` | RN01, RN02, RN04, RN05, RN06, RN10 e o histórico do RNF07 |
| `animalService.test.js` | RN07 (inativar × excluir) e a mudança de situação |
| `fotoService.test.js` | RN08 (limite de seis, uma principal, promoção ao remover) |
| `authService.test.js` | bcrypt, mensagem genérica e bloqueio do RNF04 |
| `usuarioService.test.js` | força da senha, e-mail duplicado, último administrador |
| `helpers.test.js` | formatação das telas |

**Testes de integração** (`tests/integration/`) — rota, middlewares, validação e renderização
juntos, pelo Supertest:

| Arquivo | O que prova |
|---|---|
| `publico.test.js` | páginas institucionais, catálogo, filtros na URL, perfil, envio do formulário com e sem CSRF, validação no servidor, consulta por protocolo, 404 |
| `admin.test.js` | RNF03 (toda rota administrativa exige login), RN09 (voluntário recebe 403 no painel, em usuários e ao tentar decidir), menu conforme o perfil, fim de sessão |

Um teste em particular merece ser citado no texto: em `admin.test.js`, o voluntário envia o
POST da decisão diretamente, sem passar pela tela. Ele recebe 403 e o serviço nem é chamado.
É a prova prática da frase da seção 6 — esconder botão ajuda a pessoa a não se perder, mas
não protege nada.

---

## 4. Capturas de tela — roteiro

Faça as capturas com o banco recém-carregado (`npm run db:setup`), no navegador em duas
larguras: uma janela normal e uma estreita (~380 px, com as ferramentas de desenvolvedor),
para evidenciar o RNF01.

**Módulo público**

1. Página inicial com banner, slider e os destaques — e a mesma tela no celular.
2. Catálogo sem filtro, mostrando o total de encontrados.
3. Catálogo com filtros aplicados (espécie Gato + porte Pequeno), com a URL visível na barra
   de endereço — comprova o UC02, que guarda a escolha no endereço.
4. Catálogo no celular com o painel de filtros aberto.
5. Perfil de um animal, com a ficha e a galeria.
6. Formulário de interesse com um erro de validação aparecendo no campo.
7. Tela de confirmação com o protocolo.
8. Consulta por protocolo mostrando a etapa e a linha do tempo.
9. Página 404.

**Módulo administrativo**

10. Tela de entrada.
11. Tela de entrada depois de errar a senha, com o aviso.
12. Painel com os números.
13. Lista de animais, com o seletor de situação mostrando só as mudanças permitidas.
14. Tentativa de salto inválido de situação, com a mensagem listando as opções válidas.
15. Formulário de cadastro de animal.
16. Galeria de fotos, com uma marcada como principal.
17. Lista de solicitações com filtros.
18. Detalhe de uma solicitação, com os dados do interessado e o bloco de decisão.
19. Tentativa de recusar sem observação interna, com o aviso da RN10.
20. Histórico da solicitação depois de uma decisão, mostrando autor, data e observação.
21. Página 403 — entre como voluntário e tente abrir `/admin/usuarios`.

**Banco de dados**

22. `\dt` no psql, listando as dez tabelas.
23. Um `SELECT` em `historico_solicitacao` de um pedido concluído, mostrando as linhas
    gravadas automaticamente.

---

## 5. Roteiro de demonstração do caminho completo

Serve para você conferir tudo antes de entregar, e para descrever no relatório o caminho da
adoção funcionando de ponta a ponta:

1. No site, abra o catálogo e filtre por Gato, porte Pequeno. Abra a Nina.
2. Envie o formulário de interesse. **Anote o protocolo.**
3. Envie um segundo pedido para a Nina com o mesmo e-mail → é recusado pela RN02.
4. Consulte o protocolo em Acompanhar pedido → aparece "Pendente".
5. Entre na administração como administradora. Abra o pedido e marque "Em análise".
6. Confira `logs/emails/`: o aviso da mudança está lá.
7. Consulte o protocolo de novo no site → agora aparece "Em análise".
8. Aprove o pedido. Volte ao catálogo público: a Nina sumiu da lista (RN01/RN04).
9. Faça um pedido para outro animal, o Bilu, e aprove também.
10. Conclua a adoção da Nina → o animal fica "Adotado" e os outros pedidos dela são recusados
    automaticamente (RN05). Veja o histórico dos pedidos recusados: a observação explica.
11. Cancele o pedido aprovado do Bilu → o animal volta a "Disponível" (RN06) e reaparece no
    catálogo.
12. Tente excluir um animal que tem pedidos → o sistema inativa em vez de apagar (RN07) e
    avisa por quê.
13. Saia e entre como voluntário: o Painel e os Usuários somem do menu; abrir `/admin` na mão
    devolve 403 (RN09).

---

## 6. Limitações a registrar

Mantenha a limitação já declarada na entrega parcial — os requisitos vieram do estudo dos
canais existentes, e não de conversas com voluntários e adotantes reais — e acrescente estas,
que a implementação tornou visíveis:

- A sessão fica na memória do servidor. Reiniciar a aplicação derruba quem estava logado. Em
  uso real, entraria um armazenamento de sessão no PostgreSQL ou no Redis.
- As fotos ficam no disco da própria aplicação. Em produção, iriam para um serviço de
  armazenamento à parte.
- Não há redefinição de senha por e-mail: quem esquece a senha depende da administração.
- O aviso por e-mail é disparado na mesma requisição da decisão. Com volume maior, valeria
  uma fila.
