-- ============================================================================
--  AdotaPel - dados de demonstracao
--  Conteudo integralmente ficticio (RNF06 / LGPD).
--  Executado por "npm run db:setup", DEPOIS da criacao dos usuarios
--  (as senhas sao geradas com bcrypt pelo script scripts/setup-db.js).
-- ============================================================================

-- ------------------------------------------------------- tabelas de apoio --
INSERT INTO especie (nome, descricao) VALUES
    ('Cão', 'Canis lupus familiaris'),
    ('Gato', 'Felis catus');

INSERT INTO raca (id_especie, nome) VALUES
    (1, 'SRD'), (1, 'Labrador'), (1, 'Poodle'), (1, 'Pinscher'),
    (1, 'Border Collie'), (1, 'Pastor Alemão'),
    (2, 'SRD'), (2, 'Siamês'), (2, 'Persa'), (2, 'Angorá');

INSERT INTO caracteristica (nome, categoria) VALUES
    ('Dócil', 'TEMPERAMENTO'),
    ('Brincalhão', 'TEMPERAMENTO'),
    ('Tranquilo', 'TEMPERAMENTO'),
    ('Tímido', 'TEMPERAMENTO'),
    ('Convive com crianças', 'CONVIVENCIA'),
    ('Convive com outros animais', 'CONVIVENCIA'),
    ('Precisa de espaço amplo', 'CUIDADO'),
    ('Cuidados especiais', 'CUIDADO'),
    ('Adaptado a apartamento', 'CONVIVENCIA'),
    ('Idoso', 'GERAL');

-- ------------------------------------------------------------- animais ----
-- id_usuario_cadastro: 1 = administradora, 2 = voluntario
INSERT INTO animal
    (id_especie, id_raca, id_usuario_cadastro, nome, sexo, porte, idade_meses,
     data_resgate, castrado, vacinado, vermifugado, descricao, situacao) VALUES
    (1, 1, 2, 'Mel', 'F', 'MEDIO', 24, '2025-11-12', TRUE, TRUE, TRUE,
     'Resgatada no bairro Fragata, chegou magra e hoje está no peso certo. Cumprimenta todo mundo abanando o rabo e adora ficar deitada ao sol. Aceita bem a coleira e já sabe passear na guia.', 'DISPONIVEL'),
    (1, 2, 2, 'Thor', 'M', 'GRANDE', 48, '2025-08-03', TRUE, TRUE, TRUE,
     'Labrador dócil, encontrado preso em uma corrente curta. Precisa de pátio ou de passeios diários porque tem muita energia. Já convive com outros cães na casa de acolhimento.', 'EM_PROCESSO'),
    (2, 7, 2, 'Nina', 'F', 'PEQUENO', 12, '2026-01-20', TRUE, TRUE, TRUE,
     'Gatinha resgatada de um terreno baldio no Areal. Tímida nos primeiros dias, depois vira sombra da pessoa. Usa a caixa de areia sem falhas e está acostumada a apartamento.', 'DISPONIVEL'),
    (1, 4, 2, 'Bilu', 'M', 'PEQUENO', 6, '2026-03-05', FALSE, TRUE, TRUE,
     'Filhote entregue por uma protetora do Laranjal. Castração agendada para quando completar oito meses, já incluída no termo de adoção. Muito brincalhão e apegado a gente.', 'DISPONIVEL'),
    (2, 8, 1, 'Luna', 'F', 'MEDIO', 36, '2025-06-14', TRUE, TRUE, TRUE,
     'Siamesa de olhos azuis, tranquila e independente. Prefere casas sem crianças pequenas porque não gosta de barulho. Dorme a maior parte do dia e come em horários certos.', 'DISPONIVEL'),
    (1, 1, 1, 'Pipoca', 'F', 'MEDIO', 60, '2025-02-28', TRUE, TRUE, TRUE,
     'Adulta, calma e já educada. Ficou dois anos na casa de acolhimento esperando adoção. Ideal para quem quer companhia sem a agitação de um filhote.', 'DISPONIVEL'),
    (1, 5, 2, 'Fumaça', 'M', 'MEDIO', 30, '2025-09-30', TRUE, TRUE, TRUE,
     'Border collie resgatado de uma chácara abandonada. Muito inteligente, aprende comandos rápido e precisa de atividade para não ficar entediado.', 'DISPONIVEL'),
    (2, 7, 2, 'Amora', 'F', 'PEQUENO', 4, '2026-05-18', FALSE, TRUE, TRUE,
     'Filhote encontrada dentro de um motor de carro na Zona Norte. Está no acolhimento até completar a idade de castração. Come bem e brinca com qualquer papelzinho.', 'DISPONIVEL'),
    (1, 3, 1, 'Nino', 'M', 'PEQUENO', 96, '2024-12-01', TRUE, TRUE, TRUE,
     'Poodle idoso, entregue quando o tutor faleceu. Enxerga pouco de um olho e toma remédio para a articulação. Procura uma casa tranquila para envelhecer bem.', 'DISPONIVEL'),
    (2, 7, 2, 'Tigrado', 'M', 'MEDIO', 18, '2025-10-22', TRUE, TRUE, TRUE,
     'Chegou machucado depois de uma briga de rua e se recuperou por completo. Agora é o mais sociável do acolhimento e aceita bem outros gatos.', 'ADOTADO'),
    (1, 6, 2, 'Zeca', 'M', 'GRANDE', 72, '2025-04-09', TRUE, TRUE, TRUE,
     'Pastor alemão apreendido em uma denúncia de maus-tratos. Reservado com estranhos e leal a quem convive. Está em tratamento comportamental com voluntária.', 'INDISPONIVEL'),
    (2, 10, 1, 'Pituca', 'F', 'PEQUENO', 15, '2026-02-11', TRUE, TRUE, TRUE,
     'Angorá de pelo longo, precisa de escovação três vezes por semana. Muito carinhosa, dorme junto e mia pouco.', 'DISPONIVEL');

-- ------------------------------------------------- caracteristicas x animal --
INSERT INTO animal_caracteristica (id_animal, id_caracteristica) VALUES
    (1, 1), (1, 2), (1, 5), (1, 6),
    (2, 1), (2, 6), (2, 7),
    (3, 3), (3, 4), (3, 9),
    (4, 2), (4, 5),
    (5, 3), (5, 9),
    (6, 1), (6, 3), (6, 5),
    (7, 2), (7, 7),
    (8, 2), (8, 6),
    (9, 3), (9, 8), (9, 10),
    (10, 1), (10, 6),
    (11, 4), (11, 8),
    (12, 1), (12, 9);

-- ---------------------------------------------------------------- fotos ----
INSERT INTO foto_animal (id_animal, caminho_arquivo, legenda, principal, ordem) VALUES
    (1,  '/uploads/demo/mel-1.svg',      'Mel deitada no pátio', TRUE,  1),
    (1,  '/uploads/demo/mel-2.svg',      'Mel de coleira, pronta para o passeio', FALSE, 2),
    (2,  '/uploads/demo/thor-1.svg',     'Thor sentado na grama', TRUE,  1),
    (3,  '/uploads/demo/nina-1.svg',     'Nina no parapeito da janela', TRUE,  1),
    (4,  '/uploads/demo/bilu-1.svg',     'Bilu filhote com brinquedo', TRUE,  1),
    (5,  '/uploads/demo/luna-1.svg',     'Luna sobre a manta', TRUE,  1),
    (6,  '/uploads/demo/pipoca-1.svg',   'Pipoca olhando para a câmera', TRUE,  1),
    (7,  '/uploads/demo/fumaca-1.svg',   'Fumaça correndo no gramado', TRUE,  1),
    (8,  '/uploads/demo/amora-1.svg',    'Amora no colo da voluntária', TRUE,  1),
    (9,  '/uploads/demo/nino-1.svg',     'Nino descansando na almofada', TRUE,  1),
    (10, '/uploads/demo/tigrado-1.svg',  'Tigrado depois da recuperação', TRUE,  1),
    (11, '/uploads/demo/zeca-1.svg',     'Zeca em treinamento', TRUE,  1),
    (12, '/uploads/demo/pituca-1.svg',   'Pituca recém-escovada', TRUE,  1);

-- --------------------------------------------------------- atendimentos ----
INSERT INTO atendimento (id_animal, id_usuario, tipo, descricao, data_ocorrencia) VALUES
    (1, 2, 'VACINA',    'Aplicada a V10, primeira dose. Sem reação nas 24 horas seguintes.', '2025-11-20'),
    (1, 2, 'CASTRACAO', 'Castração realizada na parceria com o Instituto SOS Animais. Pontos retirados em 10 dias.', '2025-12-15'),
    (2, 1, 'CONSULTA',  'Avaliação da lesão no pescoço causada pela corrente. Cicatrizada, sem necessidade de retorno.', '2025-08-10'),
    (3, 2, 'VERMIFUGO', 'Segunda dose do vermífugo, peso 2,8 kg.', '2026-02-02'),
    (9, 1, 'EXAME',     'Exame de sangue e avaliação ortopédica. Iniciado condroprotetor de uso contínuo.', '2026-04-03'),
    (10, 2, 'CONSULTA', 'Alta do tratamento do ferimento na orelha.', '2025-11-15');

-- -------------------------------------------------------- solicitacoes ----
INSERT INTO solicitacao_adocao
    (id_animal, id_usuario_responsavel, protocolo, nome_interessado, email, telefone,
     cidade, uf, tipo_moradia, possui_outros_animais, mensagem, status,
     data_solicitacao, data_decisao) VALUES
    (1, NULL, '2026-000148', 'Maria S. Duarte', 'maria.duarte@exemplo.com.br', '(53) 99999-0148',
     'Pelotas', 'RS', 'CASA_COM_PATIO', TRUE,
     'Moro em casa com pátio cercado e já tenho um gato castrado. Posso buscar a Mel no fim de semana.',
     'PENDENTE', '2026-09-02 14:12:00', NULL),
    (1, 1, '2026-000151', 'Rafael Lopes Terra', 'rafael.terra@exemplo.com.br', '(53) 98888-0151',
     'Capão do Leão', 'RS', 'CASA_SEM_PATIO', FALSE,
     'Trabalho em casa e teria tempo para os passeios diários.',
     'EM_ANALISE', '2026-09-04 09:40:00', NULL),
    (2, 1, '2026-000140', 'Joana P. Vieira', 'joana.vieira@exemplo.com.br', '(53) 97777-0140',
     'Pelotas', 'RS', 'SITIO_CHACARA', TRUE,
     'Tenho chácara com espaço grande e outros dois cães, todos castrados.',
     'APROVADA', '2026-08-21 17:05:00', '2026-08-28 10:30:00'),
    (10, 1, '2026-000102', 'Carlos E. Brizola', 'carlos.brizola@exemplo.com.br', '(53) 96666-0102',
     'Rio Grande', 'RS', 'APARTAMENTO', FALSE,
     'Apartamento com telas de proteção em todas as janelas.',
     'CONCLUIDA', '2026-07-10 11:00:00', '2026-07-25 15:20:00'),
    (3, 1, '2026-000133', 'Beatriz Nunes', 'beatriz.nunes@exemplo.com.br', '(53) 95555-0133',
     'Pelotas', 'RS', 'APARTAMENTO', FALSE,
     'Nunca tive gato, mas li bastante sobre os cuidados.',
     'REJEITADA', '2026-08-14 20:31:00', '2026-08-19 08:15:00'),
    (6, NULL, '2026-000155', 'Antônio Ramires', 'antonio.ramires@exemplo.com.br', '(53) 94444-0155',
     'Pelotas', 'RS', 'CASA_COM_PATIO', FALSE,
     'Procuro uma cadela adulta e calma para fazer companhia à minha mãe.',
     'PENDENTE', '2026-09-06 08:22:00', NULL);

-- ---------------------------------------------------------- historico -----
INSERT INTO historico_solicitacao
    (id_solicitacao, id_usuario, status_anterior, status_novo, observacao, data_registro) VALUES
    (1, NULL, NULL, 'PENDENTE', 'Solicitação registrada pelo formulário público.', '2026-09-02 14:12:00'),
    (2, NULL, NULL, 'PENDENTE', 'Solicitação registrada pelo formulário público.', '2026-09-04 09:40:00'),
    (2, 1, 'PENDENTE', 'EM_ANALISE', 'Entrevista por telefone agendada para 08/09.', '2026-09-05 10:02:00'),
    (3, NULL, NULL, 'PENDENTE', 'Solicitação registrada pelo formulário público.', '2026-08-21 17:05:00'),
    (3, 1, 'PENDENTE', 'EM_ANALISE', 'Visita à chácara marcada.', '2026-08-25 09:12:00'),
    (3, 1, 'EM_ANALISE', 'APROVADA', 'Espaço adequado e outros animais castrados. Entrega combinada.', '2026-08-28 10:30:00'),
    (4, NULL, NULL, 'PENDENTE', 'Solicitação registrada pelo formulário público.', '2026-07-10 11:00:00'),
    (4, 1, 'PENDENTE', 'APROVADA', 'Apartamento telado, adotante já teve gatos antes.', '2026-07-18 14:00:00'),
    (4, 1, 'APROVADA', 'CONCLUIDA', 'Termo de adoção assinado e animal entregue.', '2026-07-25 15:20:00'),
    (5, NULL, NULL, 'PENDENTE', 'Solicitação registrada pelo formulário público.', '2026-08-14 20:31:00'),
    (5, 1, 'PENDENTE', 'REJEITADA', 'Janelas sem tela de proteção; orientada a refazer o pedido após a instalação.', '2026-08-19 08:15:00'),
    (6, NULL, NULL, 'PENDENTE', 'Solicitação registrada pelo formulário público.', '2026-09-06 08:22:00');

-- Sincroniza as sequences apos as cargas com id explicito (nenhuma aqui usa id fixo,
-- mas a chamada e inofensiva e protege contra edicoes futuras do seed).
SELECT setval(pg_get_serial_sequence('animal', 'id_animal'),             (SELECT COALESCE(MAX(id_animal), 1) FROM animal));
SELECT setval(pg_get_serial_sequence('solicitacao_adocao', 'id_solicitacao'), (SELECT COALESCE(MAX(id_solicitacao), 1) FROM solicitacao_adocao));
