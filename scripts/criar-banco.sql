-- Cria o banco vazio. Execute uma única vez, conectado ao banco "postgres",
-- antes do "npm run db:setup":
--
--   psql -U postgres -f scripts/criar-banco.sql
--
-- Alternativa, sem abrir o psql:
--
--   createdb -U postgres adotapel
--
-- O banco herda a codificação e o idioma do servidor. Em instalação padrão do
-- PostgreSQL 16 isso já é UTF-8, que é o que o projeto precisa.

CREATE DATABASE adotapel;

-- Se o servidor tiver sido instalado com outra codificação, troque a linha
-- acima por esta, que força UTF-8 sem depender de um idioma específico estar
-- instalado no sistema operacional:
--
--   CREATE DATABASE adotapel WITH ENCODING 'UTF8' TEMPLATE template0;
