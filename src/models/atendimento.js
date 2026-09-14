'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('Atendimento', {
  id_atendimento: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_animal: { type: DataTypes.INTEGER, allowNull: false },
  id_usuario: { type: DataTypes.INTEGER, allowNull: false },
  tipo: {
    type: DataTypes.STRING(30), allowNull: false,
    validate: { isIn: [['CONSULTA', 'VACINA', 'CASTRACAO', 'VERMIFUGO', 'EXAME', 'OUTRO']] }
  },
  descricao: { type: DataTypes.TEXT, allowNull: false },
  data_ocorrencia: { type: DataTypes.DATEONLY, allowNull: false }
}, { tableName: 'atendimento' });
