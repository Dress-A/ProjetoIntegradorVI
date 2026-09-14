'use strict';

const statusAnimal = require('../domain/statusAnimal');
const statusSolicitacao = require('../domain/statusSolicitacao');
const { PORTES, SEXOS, PERFIS, TIPOS_MORADIA, TIPOS_ATENDIMENTO, UFS, rotuloDe } = require('../domain/enums');

/** Idade em texto: o banco guarda meses, a tela mostra "2 anos". */
function idade(meses) {
  const total = Number(meses || 0);
  if (total < 1) return 'Recém-nascido';
  if (total < 12) return `${total} ${total === 1 ? 'mês' : 'meses'}`;
  const anos = Math.floor(total / 12);
  const resto = total % 12;
  const parteAnos = `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  return resto ? `${parteAnos} e ${resto} ${resto === 1 ? 'mês' : 'meses'}` : parteAnos;
}

function data(valor) {
  if (!valor) return '—';
  const d = valor instanceof Date ? valor : new Date(`${valor}`.length === 10 ? `${valor}T12:00:00` : valor);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
}

function dataHora(valor) {
  if (!valor) return '—';
  const d = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function sexo(valor) {
  return rotuloDe(SEXOS, valor);
}

function porte(valor) {
  return rotuloDe(PORTES, valor);
}

function moradia(valor) {
  return rotuloDe(TIPOS_MORADIA, valor);
}

function tipoAtendimento(valor) {
  return rotuloDe(TIPOS_ATENDIMENTO, valor);
}

function perfil(valor) {
  return rotuloDe(PERFIS, valor);
}

function situacaoAnimal(valor) {
  return statusAnimal.rotulo(valor);
}

function statusPedido(valor) {
  return statusSolicitacao.rotulo(valor);
}

function explicacaoPedido(valor) {
  return statusSolicitacao.explicacaoPublica(valor);
}

/** Opcoes de mudanca de situacao permitidas a partir da atual (RF09). */
function proximasSituacoes(atual) {
  return statusAnimal.proximasSituacoes(atual).map((valor) => ({
    valor, rotulo: statusAnimal.rotulo(valor)
  }));
}

/** Classe do selo. RNF02: a cor nunca e a unica pista — o texto vai junto. */
function classeSituacao(valor) {
  return `selo selo--${String(valor || '').toLowerCase()}`;
}

/** Foto principal do animal, com alternativa quando ainda nao ha foto. */
function fotoPrincipal(animal) {
  const fotos = (animal && animal.fotos) || [];
  const principal = fotos.find((f) => f.principal) || fotos[0];
  return principal ? principal.caminho_arquivo : '/img/sem-foto.svg';
}

function legendaFoto(animal) {
  const fotos = (animal && animal.fotos) || [];
  const principal = fotos.find((f) => f.principal) || fotos[0];
  if (principal && principal.legenda) return principal.legenda;
  return animal && animal.nome ? `Foto de ${animal.nome}` : 'Animal ainda sem foto cadastrada';
}

/** Resumo "Cão · Fêmea · Médio · 2 anos" usado nos cartoes. */
function resumoAnimal(animal) {
  const partes = [];
  if (animal.especie) partes.push(animal.especie.nome);
  partes.push(sexo(animal.sexo));
  partes.push(porte(animal.porte));
  partes.push(idade(animal.idade_meses));
  return partes.join(' · ');
}

function telefone(valor) {
  const numeros = String(valor || '').replace(/\D/g, '');
  if (numeros.length === 11) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  if (numeros.length === 10) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  return valor || '—';
}

function pluralizar(quantidade, singular, plural) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

/** Monta a query string das paginas mantendo os filtros escolhidos. */
function comPagina(queryBase, pagina) {
  return queryBase ? `?${queryBase}&pagina=${pagina}` : `?pagina=${pagina}`;
}

module.exports = {
  idade, data, dataHora, sexo, porte, moradia, tipoAtendimento, perfil,
  situacaoAnimal, statusPedido, explicacaoPedido, classeSituacao, proximasSituacoes,
  fotoPrincipal, legendaFoto, resumoAnimal, telefone, pluralizar, comPagina,
  UFS
};
