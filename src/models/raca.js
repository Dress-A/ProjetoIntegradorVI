'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('Raca', {
  id_raca: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_especie: { type: DataTypes.INTEGER, allowNull: false },
  nome: { type: DataTypes.STRING(80), allowNull: false }
}, { tableName: 'raca' });
