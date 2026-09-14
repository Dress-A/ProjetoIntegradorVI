'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('Usuario', {
  id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(120), allowNull: false, validate: { len: [3, 120] } },
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true, validate: { isEmail: true } },
  senha_hash: { type: DataTypes.STRING(255), allowNull: false },
  perfil: {
    type: DataTypes.STRING(20), allowNull: false, defaultValue: 'VOLUNTARIO',
    validate: { isIn: [['VOLUNTARIO', 'ADMINISTRADOR']] }
  },
  ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  tentativas_login: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
  bloqueado_ate: { type: DataTypes.DATE },
  criado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'usuario',
  defaultScope: { attributes: { exclude: ['senha_hash'] } },
  scopes: { comSenha: { attributes: { include: ['senha_hash'] } } }
});
