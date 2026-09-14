'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('Animal', {
  id_animal: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_especie: { type: DataTypes.INTEGER, allowNull: false },
  id_raca: { type: DataTypes.INTEGER },
  id_usuario_cadastro: { type: DataTypes.INTEGER, allowNull: false },
  nome: { type: DataTypes.STRING(80), allowNull: false, validate: { len: [2, 80] } },
  sexo: { type: DataTypes.CHAR(1), allowNull: false, validate: { isIn: [['F', 'M']] } },
  porte: {
    type: DataTypes.STRING(15), allowNull: false,
    validate: { isIn: [['PEQUENO', 'MEDIO', 'GRANDE']] }
  },
  idade_meses: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0, validate: { min: 0, max: 360 } },
  data_resgate: { type: DataTypes.DATEONLY },
  castrado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  vacinado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  vermifugado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  descricao: { type: DataTypes.TEXT },
  situacao: {
    type: DataTypes.STRING(20), allowNull: false, defaultValue: 'DISPONIVEL',
    validate: { isIn: [['DISPONIVEL', 'EM_PROCESSO', 'ADOTADO', 'INDISPONIVEL']] }
  },
  ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  criado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  atualizado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'animal',
  hooks: {
    beforeUpdate: (animal) => { animal.atualizado_em = new Date(); }
  }
});
