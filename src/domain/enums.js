'use strict';

/** Listas fixas usadas nos formularios e nas validacoes. */
const PORTES = [
  { valor: 'PEQUENO', rotulo: 'Pequeno' },
  { valor: 'MEDIO', rotulo: 'Médio' },
  { valor: 'GRANDE', rotulo: 'Grande' }
];

const SEXOS = [
  { valor: 'F', rotulo: 'Fêmea' },
  { valor: 'M', rotulo: 'Macho' }
];

const PERFIS = [
  { valor: 'VOLUNTARIO', rotulo: 'Voluntário' },
  { valor: 'ADMINISTRADOR', rotulo: 'Administrador' }
];

const TIPOS_MORADIA = [
  { valor: 'CASA_COM_PATIO', rotulo: 'Casa com pátio' },
  { valor: 'CASA_SEM_PATIO', rotulo: 'Casa sem pátio' },
  { valor: 'APARTAMENTO', rotulo: 'Apartamento' },
  { valor: 'SITIO_CHACARA', rotulo: 'Sítio ou chácara' }
];

const TIPOS_ATENDIMENTO = [
  { valor: 'CONSULTA', rotulo: 'Consulta' },
  { valor: 'VACINA', rotulo: 'Vacina' },
  { valor: 'CASTRACAO', rotulo: 'Castração' },
  { valor: 'VERMIFUGO', rotulo: 'Vermífugo' },
  { valor: 'EXAME', rotulo: 'Exame' },
  { valor: 'OUTRO', rotulo: 'Outro' }
];

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const MAX_FOTOS_POR_ANIMAL = 6; // RN08

function valores(lista) {
  return lista.map((item) => item.valor);
}

function rotuloDe(lista, valor) {
  const achado = lista.find((item) => item.valor === valor);
  return achado ? achado.rotulo : valor;
}

module.exports = {
  PORTES, SEXOS, PERFIS, TIPOS_MORADIA, TIPOS_ATENDIMENTO, UFS,
  MAX_FOTOS_POR_ANIMAL, valores, rotuloDe
};
