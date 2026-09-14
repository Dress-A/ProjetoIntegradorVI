'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('Caracteristica', {
  id_caracteristica: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(60), allowNull: false, unique: true },
  categoria: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'GERAL' }
}, { tableName: 'caracteristica' });
