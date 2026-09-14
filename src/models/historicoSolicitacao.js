'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('HistoricoSolicitacao', {
  id_historico: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_solicitacao: { type: DataTypes.INTEGER, allowNull: false },
  id_usuario: { type: DataTypes.INTEGER },
  status_anterior: { type: DataTypes.STRING(20) },
  status_novo: { type: DataTypes.STRING(20), allowNull: false },
  observacao: { type: DataTypes.TEXT },
  data_registro: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, { tableName: 'historico_solicitacao' });
