# Versionamento (RNF09)

## Padrão de commit

Commits semânticos, em português, no imperativo e com o escopo entre parênteses:

```
feat(catalogo): filtrar animais por características
fix(solicitacao): impedir dois pedidos em aberto do mesmo e-mail
test(fotos): cobrir o limite de seis fotos por animal
docs(readme): descrever a instalação do banco
refactor(services): mover a transição de status para o domínio
chore(deps): fixar a versão do Sequelize
```

Tipos usados: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`.

## Ramos

| Ramo | Para que serve |
|---|---|
| `main` | O estado entregue. |
| `desenvolvimento` | Onde o trabalho foi integrado. |
| `feat/banco-de-dados` | Esquema, dados de demonstração e script de carga. |
| `feat/camada-de-dados` | Domínio, modelos do Sequelize e repositórios. |
| `feat/regras-de-negocio` | Serviços com as RN01 a RN10, validadores e middlewares. |
| `feat/modulo-publico` | Catálogo, perfil do animal, pedido e acompanhamento. |
| `feat/modulo-administrativo` | Entrada, painel, animais, pedidos e usuários. |
| `feat/interface` | Folha de estilo, JavaScript das telas e imagens. |
| `feat/testes-automatizados` | Testes com Jest e Supertest e conferência do seed. |

Cada ramo de funcionalidade foi aberto a partir de `desenvolvimento` e integrado
de volta com `git merge --no-ff`, o que preserva o ponto de integração no
histórico. Veja o desenho com:

```bash
git log --oneline --graph --all
```

## O que já está feito

O repositório está montado, com o histórico em treze commits semânticos e duas
branches apontando para o mesmo ponto:

- `desenvolvimento` — onde o trabalho foi integrado;
- `main` — o estado entregue.

Confira com `git log --oneline` e `git branch`.

## Antes do primeiro envio: identidade dos commits

Os commits foram criados com um e-mail de exemplo. Para que o GitHub ligue o
histórico à sua conta, troque a identidade e reescreva o histórico **uma única
vez**, antes de enviar:

```bash
git checkout desenvolvimento
git config user.name "Andressa Ávila"
git config user.email "seu-email-do-github@exemplo.com"
git rebase --root --exec "git commit --amend --no-edit --reset-author"
git checkout main
git reset --hard desenvolvimento
```

As mensagens e os arquivos não mudam; só a autoria.

## Enviando para o GitHub

```bash
git remote add origin https://github.com/Dress-A/ProjetoIntegradorVI.git
git push --all -u origin
```

O `--all` envia as nove branches de uma vez. Para conferir antes de enviar:

```bash
git branch
```

Se o repositório remoto já tiver algum conteúdo — um README criado pelo próprio
GitHub, por exemplo —, o primeiro envio é recusado. Nesse caso, confira o que
está lá antes de decidir: `git push -u origin main --force` substitui o
conteúdo remoto pelo local, sem volta.

## Conferindo depois do envio

Na página do repositório devem aparecer as nove branches (o seletor fica no alto,
à esquerda da lista de arquivos), o histórico com os pontos de integração e a
árvore de pastas com `src/`, `db/`, `tests/` e `docs/`. O arquivo `.env` **não**
pode estar lá: ele guarda a senha do banco e está no `.gitignore`. O que vai é
o `.env.example`.
