-- ============================================================================
--  AdotaPel - Plataforma web para adocao responsavel e gestao de animais
--  Script de criacao do esquema - PostgreSQL 16
--  Modelo entidade-relacionamento da secao 5 do relatorio parcial.
-- ============================================================================

DROP TABLE IF EXISTS historico_solicitacao CASCADE;
DROP TABLE IF EXISTS solicitacao_adocao   CASCADE;
DROP TABLE IF EXISTS atendimento          CASCADE;
DROP TABLE IF EXISTS animal_caracteristica CASCADE;
DROP TABLE IF EXISTS foto_animal          CASCADE;
DROP TABLE IF EXISTS animal               CASCADE;
DROP TABLE IF EXISTS caracteristica       CASCADE;
DROP TABLE IF EXISTS raca                 CASCADE;
DROP TABLE IF EXISTS especie              CASCADE;
DROP TABLE IF EXISTS usuario              CASCADE;

-- ---------------------------------------------------------------- usuario --
CREATE TABLE usuario (
    id_usuario      SERIAL       PRIMARY KEY,
    nome            VARCHAR(120) NOT NULL,
    email           VARCHAR(160) NOT NULL UNIQUE,
    senha_hash      VARCHAR(255) NOT NULL,
    perfil          VARCHAR(20)  NOT NULL DEFAULT 'VOLUNTARIO',
    ativo           BOOLEAN      NOT NULL DEFAULT TRUE,
    tentativas_login SMALLINT    NOT NULL DEFAULT 0,
    bloqueado_ate   TIMESTAMP,
    criado_em       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_usuario_perfil CHECK (perfil IN ('VOLUNTARIO', 'ADMINISTRADOR')),
    CONSTRAINT ck_usuario_email  CHECK (POSITION('@' IN email) > 1)
);
COMMENT ON COLUMN usuario.tentativas_login IS 'RNF04 - bloqueio temporario apos cinco tentativas erradas';

-- ---------------------------------------------------------------- especie --
CREATE TABLE especie (
    id_especie  SERIAL      PRIMARY KEY,
    nome        VARCHAR(60) NOT NULL UNIQUE,
    descricao   VARCHAR(160)
);

-- ------------------------------------------------------------------- raca --
CREATE TABLE raca (
    id_raca     SERIAL      PRIMARY KEY,
    id_especie  INTEGER     NOT NULL REFERENCES especie (id_especie) ON DELETE RESTRICT,
    nome        VARCHAR(80) NOT NULL,
    CONSTRAINT uk_raca_especie_nome UNIQUE (id_especie, nome)
);

-- --------------------------------------------------------- caracteristica --
CREATE TABLE caracteristica (
    id_caracteristica SERIAL      PRIMARY KEY,
    nome              VARCHAR(60) NOT NULL UNIQUE,
    categoria         VARCHAR(40) NOT NULL DEFAULT 'GERAL'
);

-- ----------------------------------------------------------------- animal --
CREATE TABLE animal (
    id_animal            SERIAL      PRIMARY KEY,
    id_especie           INTEGER     NOT NULL REFERENCES especie (id_especie) ON DELETE RESTRICT,
    id_raca              INTEGER     REFERENCES raca (id_raca) ON DELETE SET NULL,
    id_usuario_cadastro  INTEGER     NOT NULL REFERENCES usuario (id_usuario) ON DELETE RESTRICT,
    nome                 VARCHAR(80) NOT NULL,
    sexo                 CHAR(1)     NOT NULL,
    porte                VARCHAR(15) NOT NULL,
    idade_meses          SMALLINT    NOT NULL DEFAULT 0,
    data_resgate         DATE,
    castrado             BOOLEAN     NOT NULL DEFAULT FALSE,
    vacinado             BOOLEAN     NOT NULL DEFAULT FALSE,
    vermifugado          BOOLEAN     NOT NULL DEFAULT FALSE,
    descricao            TEXT,
    situacao             VARCHAR(20) NOT NULL DEFAULT 'DISPONIVEL',
    ativo                BOOLEAN     NOT NULL DEFAULT TRUE,
    criado_em            TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_animal_sexo     CHECK (sexo IN ('F', 'M')),
    CONSTRAINT ck_animal_porte    CHECK (porte IN ('PEQUENO', 'MEDIO', 'GRANDE')),
    CONSTRAINT ck_animal_situacao CHECK (situacao IN ('DISPONIVEL', 'EM_PROCESSO', 'ADOTADO', 'INDISPONIVEL')),
    CONSTRAINT ck_animal_idade    CHECK (idade_meses BETWEEN 0 AND 360)
);
COMMENT ON COLUMN animal.ativo IS 'RN07 - animal com solicitacoes vinculadas e inativado, nunca excluido';

-- ------------------------------------------------------------ foto_animal --
CREATE TABLE foto_animal (
    id_foto         SERIAL       PRIMARY KEY,
    id_animal       INTEGER      NOT NULL REFERENCES animal (id_animal) ON DELETE CASCADE,
    caminho_arquivo VARCHAR(255) NOT NULL,
    legenda         VARCHAR(120),
    principal       BOOLEAN      NOT NULL DEFAULT FALSE,
    ordem           SMALLINT     NOT NULL DEFAULT 1,
    CONSTRAINT ck_foto_ordem CHECK (ordem BETWEEN 1 AND 6)
);

-- RN08 - no maximo uma foto principal por animal
CREATE UNIQUE INDEX uk_foto_principal_por_animal
    ON foto_animal (id_animal) WHERE principal;

-- -------------------------------------------------- animal_caracteristica --
CREATE TABLE animal_caracteristica (
    id_animal         INTEGER NOT NULL REFERENCES animal (id_animal) ON DELETE CASCADE,
    id_caracteristica INTEGER NOT NULL REFERENCES caracteristica (id_caracteristica) ON DELETE CASCADE,
    PRIMARY KEY (id_animal, id_caracteristica)
);

-- ------------------------------------------------------------ atendimento --
CREATE TABLE atendimento (
    id_atendimento  SERIAL      PRIMARY KEY,
    id_animal       INTEGER     NOT NULL REFERENCES animal (id_animal) ON DELETE CASCADE,
    id_usuario      INTEGER     NOT NULL REFERENCES usuario (id_usuario) ON DELETE RESTRICT,
    tipo            VARCHAR(30) NOT NULL,
    descricao       TEXT        NOT NULL,
    data_ocorrencia DATE        NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT ck_atendimento_tipo
        CHECK (tipo IN ('CONSULTA', 'VACINA', 'CASTRACAO', 'VERMIFUGO', 'EXAME', 'OUTRO'))
);

-- ----------------------------------------------------- solicitacao_adocao --
CREATE TABLE solicitacao_adocao (
    id_solicitacao          SERIAL       PRIMARY KEY,
    id_animal               INTEGER      NOT NULL REFERENCES animal (id_animal) ON DELETE RESTRICT,
    id_usuario_responsavel  INTEGER      REFERENCES usuario (id_usuario) ON DELETE SET NULL,
    protocolo               VARCHAR(20)  NOT NULL UNIQUE,
    nome_interessado        VARCHAR(120) NOT NULL,
    email                   VARCHAR(160) NOT NULL,
    telefone                VARCHAR(20)  NOT NULL,
    cidade                  VARCHAR(80)  NOT NULL,
    uf                      CHAR(2)      NOT NULL,
    tipo_moradia            VARCHAR(30)  NOT NULL,
    possui_outros_animais   BOOLEAN      NOT NULL DEFAULT FALSE,
    mensagem                TEXT,
    status                  VARCHAR(20)  NOT NULL DEFAULT 'PENDENTE',
    data_solicitacao        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_decisao            TIMESTAMP,
    CONSTRAINT ck_solicitacao_status CHECK (
        status IN ('PENDENTE', 'EM_ANALISE', 'APROVADA', 'REJEITADA', 'CONCLUIDA', 'CANCELADA')),
    CONSTRAINT ck_solicitacao_moradia CHECK (
        tipo_moradia IN ('CASA_COM_PATIO', 'CASA_SEM_PATIO', 'APARTAMENTO', 'SITIO_CHACARA')),
    -- RN03 - protocolo no formato AAAA-NNNNNN
    CONSTRAINT ck_solicitacao_protocolo CHECK (protocolo ~ '^[0-9]{4}-[0-9]{6}$')
);

-- ------------------------------------------------- historico_solicitacao --
CREATE TABLE historico_solicitacao (
    id_historico    SERIAL      PRIMARY KEY,
    id_solicitacao  INTEGER     NOT NULL REFERENCES solicitacao_adocao (id_solicitacao) ON DELETE CASCADE,
    id_usuario      INTEGER     REFERENCES usuario (id_usuario) ON DELETE SET NULL,
    status_anterior VARCHAR(20),
    status_novo     VARCHAR(20) NOT NULL,
    observacao      TEXT,
    data_registro   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE historico_solicitacao IS 'RNF07 - registro imutavel de quem mudou, quando e por que';

-- ---------------------------------------------------------------- indices --
CREATE INDEX idx_animal_situacao          ON animal (situacao);
CREATE INDEX idx_animal_especie           ON animal (id_especie);
CREATE INDEX idx_solicitacao_status       ON solicitacao_adocao (status, protocolo);
CREATE INDEX idx_solicitacao_animal       ON solicitacao_adocao (id_animal);
CREATE INDEX idx_solicitacao_email        ON solicitacao_adocao (email);
CREATE INDEX idx_historico_solicitacao    ON historico_solicitacao (id_solicitacao);
CREATE INDEX idx_foto_animal              ON foto_animal (id_animal, ordem);
