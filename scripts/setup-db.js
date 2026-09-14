#!/usr/bin/env node
'use strict';

/**
 * Cria o banco do zero: esquema, usuarios (com senha embaralhada pelo bcrypt)
 * e dados de demonstracao.
 *
 *   npm run db:setup     -> cria o esquema e carrega tudo
 *   npm run db:reset     -> mesma coisa (o schema.sql ja derruba as tabelas)
 *
 * As senhas nao ficam no seed.sql: sao geradas aqui, para nunca existir um
 * hash fixo dentro do repositorio (RNF04).
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');

const CAMINHO_SCHEMA = path.resolve(env.raiz, 'db', 'schema.sql');
const CAMINHO_SEED = path.resolve(env.raiz, 'db', 'seed.sql');

function ler(arquivo) {
  if (!fs.existsSync(arquivo)) {
    throw new Error(`Arquivo não encontrado: ${arquivo}`);
  }
  return fs.readFileSync(arquivo, 'utf8');
}

async function criarUsuarios(cliente) {
  const equipe = [
    {
      nome: 'Andressa Ávila',
      email: env.seed.adminEmail,
      senha: env.seed.adminSenha,
      perfil: 'ADMINISTRADOR'
    },
    {
      nome: 'Bruno Cardoso',
      email: env.seed.voluntarioEmail,
      senha: env.seed.voluntarioSenha,
      perfil: 'VOLUNTARIO'
    }
  ];

  for (const pessoa of equipe) {
    // eslint-disable-next-line no-await-in-loop
    const hash = await bcrypt.hash(pessoa.senha, 10);
    // eslint-disable-next-line no-await-in-loop
    await cliente.query(
      'INSERT INTO usuario (nome, email, senha_hash, perfil, ativo) VALUES ($1, $2, $3, $4, TRUE)',
      [pessoa.nome, pessoa.email.toLowerCase(), hash, pessoa.perfil]
    );
  }

  return equipe;
}

async function principal() {
  const cliente = new Client({
    host: env.banco.host,
    port: env.banco.porta,
    database: env.banco.nome,
    user: env.banco.usuario,
    password: env.banco.senha
  });

  console.log(`Conectando em ${env.banco.host}:${env.banco.porta}/${env.banco.nome}...`);
  await cliente.connect();

  try {
    await cliente.query('BEGIN');

    console.log('1/3 Criando o esquema (db/schema.sql)...');
    await cliente.query(ler(CAMINHO_SCHEMA));

    console.log('2/3 Criando os usuários da equipe com senha embaralhada...');
    const equipe = await criarUsuarios(cliente);

    console.log('3/3 Carregando os dados de demonstração (db/seed.sql)...');
    await cliente.query(ler(CAMINHO_SEED));

    await cliente.query('COMMIT');

    const { rows } = await cliente.query(`
      SELECT
        (SELECT COUNT(*) FROM animal)             AS animais,
        (SELECT COUNT(*) FROM solicitacao_adocao) AS solicitacoes,
        (SELECT COUNT(*) FROM foto_animal)        AS fotos,
        (SELECT COUNT(*) FROM atendimento)        AS atendimentos
    `);

    const t = rows[0];
    console.log('\nBanco pronto.');
    console.log(`  ${t.animais} animais, ${t.fotos} fotos, ${t.solicitacoes} solicitações, ${t.atendimentos} atendimentos.`);
    console.log('\nContas de acesso criadas:');
    equipe.forEach((pessoa) => {
      console.log(`  ${pessoa.perfil.padEnd(14)} ${pessoa.email}  senha: ${pessoa.senha}`);
    });
    console.log('\nTroque essas senhas antes de qualquer uso real. Agora rode: npm start');
  } catch (erro) {
    await cliente.query('ROLLBACK');
    console.error('\nFalhou, nada foi gravado:', erro.message);
    process.exitCode = 1;
  } finally {
    await cliente.end();
  }
}

principal().catch((erro) => {
  console.error('Erro inesperado:', erro.message);
  process.exit(1);
});
