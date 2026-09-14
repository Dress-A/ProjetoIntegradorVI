'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('FotoAnimal', {
  id_foto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_animal: { type: DataTypes.INTEGER, allowNull: false },
  caminho_arquivo: { type: DataTypes.STRING(255), allowNull: false },
  legenda: { type: DataTypes.STRING(120) },
  principal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  ordem: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 1, validate: { min: 1, max: 6 } }
}, { tableName: 'foto_animal' });
