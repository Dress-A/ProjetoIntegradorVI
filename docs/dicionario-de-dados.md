# Dicionário de dados

PostgreSQL 16. Dez tabelas, conforme o modelo entidade-relacionamento da seção 5 do
relatório parcial. PK = chave primária, FK = chave estrangeira, UK = chave única.

## usuario — contas de acesso da equipe

| Coluna | Tipo | Chave | Observação |
|---|---|---|---|
| id_usuario | SERIAL | PK | |
| nome | VARCHAR(120) | | obrigatório |
| email | VARCHAR(160) | UK | usado no login, guardado em minúsculas |
| senha_hash | VARCHAR(255) | | bcrypt, custo 10; nunca texto |
| perfil | VARCHAR(20) | | `VOLUNTARIO` ou `ADMINISTRADOR` |
| ativo | BOOLEAN | | conta desativada não entra |
| tentativas_login | SMALLINT | | acrescentada na entrega final, para o RNF04 |
| bloqueado_ate | TIMESTAMP | | acrescentada na entrega final, para o RNF04 |
| criado_em | TIMESTAMP | | |

## especie / raca / caracteristica — tabelas de apoio

Viraram tabelas próprias, e não texto livre dentro de `animal`, para que os filtros do
RF02 funcionem: se cada pessoa digitasse do seu jeito, não haveria o que filtrar.

| Tabela | Colunas |
|---|---|
| especie | `id_especie` PK · `nome` UK VARCHAR(60) · `descricao` VARCHAR(160) |
| raca | `id_raca` PK · `id_especie` FK · `nome` VARCHAR(80) · UK (`id_especie`, `nome`) |
| caracteristica | `id_caracteristica` PK · `nome` UK VARCHAR(60) · `categoria` VARCHAR(40) |

## animal

| Coluna | Tipo | Chave | Observação |
|---|---|---|---|
| id_animal | SERIAL | PK | |
| id_especie | INTEGER | FK → especie | obrigatório |
| id_raca | INTEGER | FK → raca | opcional, para os sem raça definida |
| id_usuario_cadastro | INTEGER | FK → usuario | quem cadastrou (RNF07) |
| nome | VARCHAR(80) | | |
| sexo | CHAR(1) | | `F` ou `M` |
| porte | VARCHAR(15) | | `PEQUENO`, `MEDIO` ou `GRANDE` |
| idade_meses | SMALLINT | | 0 a 360 |
| data_resgate | DATE | | |
| castrado / vacinado / vermifugado | BOOLEAN | | |
| descricao | TEXT | | texto público |
| situacao | VARCHAR(20) | | `DISPONIVEL`, `EM_PROCESSO`, `ADOTADO`, `INDISPONIVEL` |
| ativo | BOOLEAN | | acrescentada na entrega final, para a RN07 |
| criado_em / atualizado_em | TIMESTAMP | | |

Índices: `idx_animal_situacao` (lista pública) e `idx_animal_especie`.

## foto_animal

| Coluna | Tipo | Chave | Observação |
|---|---|---|---|
| id_foto | SERIAL | PK | |
| id_animal | INTEGER | FK → animal | `ON DELETE CASCADE` |
| caminho_arquivo | VARCHAR(255) | | caminho público; o arquivo fica em `/uploads` |
| legenda | VARCHAR(120) | | vira o texto alternativo da imagem (RNF02) |
| principal | BOOLEAN | | índice parcial único garante uma só por animal (RN08) |
| ordem | SMALLINT | | 1 a 6 |

## animal_caracteristica

Resolve o muitos-para-muitos. Chave primária composta (`id_animal`, `id_caracteristica`),
o que impede a mesma combinação duas vezes.

## atendimento

| Coluna | Tipo | Chave | Observação |
|---|---|---|---|
| id_atendimento | SERIAL | PK | |
| id_animal | INTEGER | FK → animal | |
| id_usuario | INTEGER | FK → usuario | quem registrou |
| tipo | VARCHAR(30) | | `CONSULTA`, `VACINA`, `CASTRACAO`, `VERMIFUGO`, `EXAME`, `OUTRO` |
| descricao | TEXT | | |
| data_ocorrencia | DATE | | |

## solicitacao_adocao

| Coluna | Tipo | Chave | Observação |
|---|---|---|---|
| id_solicitacao | SERIAL | PK | |
| id_animal | INTEGER | FK → animal | `ON DELETE RESTRICT` (sustenta a RN07) |
| id_usuario_responsavel | INTEGER | FK → usuario | quem analisou |
| protocolo | VARCHAR(20) | UK | `CHECK` do formato `AAAA-NNNNNN` (RN03) |
| nome_interessado | VARCHAR(120) | | |
| email | VARCHAR(160) | | usado também na consulta pública |
| telefone | VARCHAR(20) | | |
| cidade / uf | VARCHAR(80) / CHAR(2) | | |
| tipo_moradia | VARCHAR(30) | | `CASA_COM_PATIO`, `CASA_SEM_PATIO`, `APARTAMENTO`, `SITIO_CHACARA` |
| possui_outros_animais | BOOLEAN | | |
| mensagem | TEXT | | |
| status | VARCHAR(20) | | `PENDENTE`, `EM_ANALISE`, `APROVADA`, `REJEITADA`, `CONCLUIDA`, `CANCELADA` |
| data_solicitacao / data_decisao | TIMESTAMP | | |

Índices: `idx_solicitacao_status` (`status`, `protocolo`), `idx_solicitacao_animal`,
`idx_solicitacao_email`.

## historico_solicitacao

| Coluna | Tipo | Chave | Observação |
|---|---|---|---|
| id_historico | SERIAL | PK | |
| id_solicitacao | INTEGER | FK → solicitacao_adocao | `ON DELETE CASCADE` |
| id_usuario | INTEGER | FK → usuario | nulo quando veio do formulário público |
| status_anterior | VARCHAR(20) | | nulo no primeiro registro |
| status_novo | VARCHAR(20) | | |
| observacao | TEXT | | obrigatória ao recusar ou cancelar (RN10) |
| data_registro | TIMESTAMP | | |

O sistema só insere nesta tabela: não há rota de edição nem de exclusão (RNF07).
