'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('Especie', {
  id_especie: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(60), allowNull: false, unique: true },
  descricao: { type: DataTypes.STRING(160) }
}, { tableName: 'especie' });
