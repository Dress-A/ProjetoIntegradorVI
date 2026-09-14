'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('AnimalCaracteristica', {
  id_animal: { type: DataTypes.INTEGER, primaryKey: true },
  id_caracteristica: { type: DataTypes.INTEGER, primaryKey: true }
}, { tableName: 'animal_caracteristica' });
