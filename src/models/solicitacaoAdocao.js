'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('SolicitacaoAdocao', {
  id_solicitacao: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_animal: { type: DataTypes.INTEGER, allowNull: false },
  id_usuario_responsavel: { type: DataTypes.INTEGER },
  protocolo: {
    type: DataTypes.STRING(20), allowNull: false, unique: true,
    validate: { is: /^[0-9]{4}-[0-9]{6}$/ }
  },
  nome_interessado: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(160), allowNull: false, validate: { isEmail: true } },
  telefone: { type: DataTypes.STRING(20), allowNull: false },
  cidade: { type: DataTypes.STRING(80), allowNull: false },
  uf: { type: DataTypes.CHAR(2), allowNull: false },
  tipo_moradia: {
    type: DataTypes.STRING(30), allowNull: false,
    validate: { isIn: [['CASA_COM_PATIO', 'CASA_SEM_PATIO', 'APARTAMENTO', 'SITIO_CHACARA']] }
  },
  possui_outros_animais: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  mensagem: { type: DataTypes.TEXT },
  status: {
    type: DataTypes.STRING(20), allowNull: false, defaultValue: 'PENDENTE',
    validate: { isIn: [['PENDENTE', 'EM_ANALISE', 'APROVADA', 'REJEITADA', 'CONCLUIDA', 'CANCELADA']] }
  },
  data_solicitacao: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  data_decisao: { type: DataTypes.DATE }
}, { tableName: 'solicitacao_adocao' });
