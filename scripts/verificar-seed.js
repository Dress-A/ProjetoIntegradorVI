'use strict';

/**
 * Confere o db/seed.sql contra o db/schema.sql sem precisar de um PostgreSQL:
 * colunas existentes, número de valores por linha, restrições CHECK de lista,
 * o formato do protocolo e as chaves estrangeiras.
 *
 * Vale porque o setup-db.js roda o seed inteiro numa transação: qualquer
 * linha inválida derruba a carga toda.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const schema = fs.readFileSync(path.join(RAIZ, 'db', 'schema.sql'), 'utf8');
const seed = fs.readFileSync(path.join(RAIZ, 'db', 'seed.sql'), 'utf8');

const falhas = [];

/* ------------------------------------------------- leitura do schema.sql -- */
function corpoDaTabela(nome) {
  const inicio = schema.search(new RegExp(`CREATE TABLE ${nome}\\s*\\(`, 'i'));
  if (inicio === -1) return null;
  let i = schema.indexOf('(', inicio);
  let profundidade = 0;
  let fim = i;
  for (; fim < schema.length; fim += 1) {
    if (schema[fim] === '(') profundidade += 1;
    if (schema[fim] === ')') { profundidade -= 1; if (profundidade === 0) break; }
  }
  return schema.slice(i + 1, fim);
}

function partesDoCorpo(corpo) {
  const partes = [];
  let nivel = 0;
  let atual = '';
  for (const ch of corpo) {
    if (ch === '(') nivel += 1;
    if (ch === ')') nivel -= 1;
    if (ch === ',' && nivel === 0) { partes.push(atual); atual = ''; } else { atual += ch; }
  }
  partes.push(atual);
  return partes.map((linha) => linha.split('--')[0].trim()).filter(Boolean);
}

const tabelas = {};
for (const achado of schema.matchAll(/CREATE TABLE (\w+)/gi)) {
  const nome = achado[1];
  const corpo = corpoDaTabela(nome);
  const partes = partesDoCorpo(corpo);

  const colunas = partes
    .filter((l) => !/^(CONSTRAINT|PRIMARY KEY|UNIQUE|CHECK|FOREIGN KEY)\b/i.test(l))
    .map((l) => l.split(/\s+/)[0]);

  // CHECK de lista: coluna IN ('A', 'B', ...)
  const listas = {};
  for (const check of corpo.matchAll(/CHECK\s*\(\s*(\w+)\s+IN\s*\(([^)]+)\)/gi)) {
    listas[check[1]] = [...check[2].matchAll(/'([^']*)'/g)].map((m) => m[1]);
  }

  // chaves estrangeiras
  const estrangeiras = {};
  partes.forEach((linha) => {
    const ref = linha.match(/^(\w+)\s+\w+.*REFERENCES\s+(\w+)/i);
    if (ref) estrangeiras[ref[1]] = ref[2];
  });

  tabelas[nome] = { colunas, listas, estrangeiras };
}

/* --------------------------------------------------- leitura do seed.sql -- */
function separarTuplas(texto) {
  const tuplas = [];
  let nivel = 0;
  let aspas = false;
  let atual = '';
  for (let i = 0; i < texto.length; i += 1) {
    const ch = texto[i];
    if (ch === "'" ) {
      if (aspas && texto[i + 1] === "'") { atual += "''"; i += 1; continue; }
      aspas = !aspas;
    }
    if (!aspas && ch === '(') { nivel += 1; if (nivel === 1) { atual = ''; continue; } }
    if (!aspas && ch === ')') { nivel -= 1; if (nivel === 0) { tuplas.push(atual); continue; } }
    if (nivel > 0) atual += ch;
  }
  return tuplas;
}

function separarValores(tupla) {
  const valores = [];
  let aspas = false;
  let nivel = 0;
  let atual = '';
  for (let i = 0; i < tupla.length; i += 1) {
    const ch = tupla[i];
    if (ch === "'") {
      if (aspas && tupla[i + 1] === "'") { atual += "''"; i += 1; continue; }
      aspas = !aspas;
      atual += ch;
      continue;
    }
    if (!aspas && ch === '(') nivel += 1;
    if (!aspas && ch === ')') nivel -= 1;
    if (!aspas && nivel === 0 && ch === ',') { valores.push(atual.trim()); atual = ''; continue; }
    atual += ch;
  }
  valores.push(atual.trim());
  return valores;
}

const linhasPorTabela = {};
let totalLinhas = 0;

// O fim do comando é o primeiro ";" FORA de aspas: o seed tem texto com
// ponto e vírgula dentro, e um corte ingênuo truncaria o INSERT.
function extrairInserts(texto) {
  const achados = [];
  const inicio = /INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES/gi;
  let m;
  while ((m = inicio.exec(texto)) !== null) {
    let i = inicio.lastIndex;
    let aspas = false;
    for (; i < texto.length; i += 1) {
      const ch = texto[i];
      if (ch === "'") {
        if (aspas && texto[i + 1] === "'") { i += 1; continue; }
        aspas = !aspas;
      }
      if (!aspas && ch === ';') break;
    }
    achados.push([m[0], m[1], m[2], texto.slice(inicio.lastIndex, i)]);
    inicio.lastIndex = i;
  }
  return achados;
}

const inserts = extrairInserts(seed);

console.log(`Conferindo ${inserts.length} comandos INSERT do seed.sql\n`);

inserts.forEach((insert) => {
  const tabela = insert[1];
  const colunas = insert[2].split(',').map((c) => c.trim());
  const tuplas = separarTuplas(insert[3]);

  const definicao = tabelas[tabela];
  if (!definicao) {
    falhas.push(`INSERT em "${tabela}": tabela não existe no schema.sql`);
    return;
  }

  colunas.forEach((coluna) => {
    if (!definicao.colunas.includes(coluna)) {
      falhas.push(`INSERT em ${tabela}: coluna "${coluna}" não existe na tabela`);
    }
  });

  linhasPorTabela[tabela] = (linhasPorTabela[tabela] || 0) + tuplas.length;
  totalLinhas += tuplas.length;

  tuplas.forEach((tupla, indice) => {
    const valores = separarValores(tupla);

    if (valores.length !== colunas.length) {
      falhas.push(`INSERT em ${tabela}, linha ${indice + 1}: ${valores.length} valores para `
        + `${colunas.length} colunas`);
      return;
    }

    colunas.forEach((coluna, i) => {
      const bruto = valores[i];
      const texto = bruto.replace(/^'|'$/g, '');

      // restrições CHECK de lista
      const lista = definicao.listas[coluna];
      if (lista && bruto !== 'NULL' && !lista.includes(texto)) {
        falhas.push(`INSERT em ${tabela}, linha ${indice + 1}: ${coluna} = "${texto}" `
          + `não está em (${lista.join(', ')})`);
      }

      // formato do protocolo (RN03)
      if (coluna === 'protocolo' && !/^\d{4}-\d{6}$/.test(texto)) {
        falhas.push(`INSERT em ${tabela}, linha ${indice + 1}: protocolo "${texto}" `
          + 'fora do formato AAAA-NNNNNN');
      }
    });
  });
});

/* --------------------------------------------------- chaves estrangeiras -- */
// O seed usa SERIAL, então os identificadores saem em sequência a partir de 1.
// A tabela usuario é carregada pelo setup-db.js, com duas contas.
const limites = { usuario: 2 };
Object.entries(linhasPorTabela).forEach(([tabela, total]) => { limites[tabela] = total; });

inserts.forEach((insert) => {
  const tabela = insert[1];
  const colunas = insert[2].split(',').map((c) => c.trim());
  const definicao = tabelas[tabela];
  if (!definicao) return;

  separarTuplas(insert[3]).forEach((tupla, indice) => {
    const valores = separarValores(tupla);
    colunas.forEach((coluna, i) => {
      const alvo = definicao.estrangeiras[coluna];
      if (!alvo) return;
      const bruto = valores[i];
      if (bruto === 'NULL') return;

      const numero = Number(bruto);
      const maximo = limites[alvo];
      if (!Number.isInteger(numero) || numero < 1 || (maximo && numero > maximo)) {
        falhas.push(`INSERT em ${tabela}, linha ${indice + 1}: ${coluna} = ${bruto} aponta para `
          + `${alvo}, que terá ${maximo} registro(s)`);
      }
    });
  });
});

/* ------------------------------------------------------------- resultado -- */
Object.entries(linhasPorTabela).forEach(([tabela, total]) => {
  console.log(`  ${tabela.padEnd(24)} ${String(total).padStart(3)} linha(s)`);
});
console.log(`\n  ${totalLinhas} linhas no total`);

if (falhas.length) {
  console.log('\nFALHAS');
  falhas.forEach((f) => console.log(`  ${f}`));
} else {
  console.log('\n  Nenhuma falha: colunas, contagem de valores, restrições CHECK, formato do '
    + 'protocolo\n  e chaves estrangeiras conferem com o schema.sql.');
}

process.exitCode = falhas.length ? 1 : 0;
