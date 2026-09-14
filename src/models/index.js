'use strict';

const { sequelize, Sequelize } = require('../config/database');

const { DataTypes } = Sequelize;

const Usuario = require('./usuario')(sequelize, DataTypes);
const Especie = require('./especie')(sequelize, DataTypes);
const Raca = require('./raca')(sequelize, DataTypes);
const Caracteristica = require('./caracteristica')(sequelize, DataTypes);
const Animal = require('./animal')(sequelize, DataTypes);
const FotoAnimal = require('./fotoAnimal')(sequelize, DataTypes);
const AnimalCaracteristica = require('./animalCaracteristica')(sequelize, DataTypes);
const Atendimento = require('./atendimento')(sequelize, DataTypes);
const SolicitacaoAdocao = require('./solicitacaoAdocao')(sequelize, DataTypes);
const HistoricoSolicitacao = require('./historicoSolicitacao')(sequelize, DataTypes);

/* ------------------------- relacionamentos (secao 5) ---------------------- */

// especie 1:N raca / especie 1:N animal
Especie.hasMany(Raca, { foreignKey: 'id_especie', as: 'racas' });
Raca.belongsTo(Especie, { foreignKey: 'id_especie', as: 'especie' });

Especie.hasMany(Animal, { foreignKey: 'id_especie', as: 'animais' });
Animal.belongsTo(Especie, { foreignKey: 'id_especie', as: 'especie' });

// raca 0..1:N animal (raca e opcional, para os sem raca definida)
Raca.hasMany(Animal, { foreignKey: 'id_raca', as: 'animais' });
Animal.belongsTo(Raca, { foreignKey: 'id_raca', as: 'raca' });

// usuario 1:N animal (quem cadastrou)
Usuario.hasMany(Animal, { foreignKey: 'id_usuario_cadastro', as: 'animaisCadastrados' });
Animal.belongsTo(Usuario, { foreignKey: 'id_usuario_cadastro', as: 'cadastradoPor' });

// animal 1:N foto
Animal.hasMany(FotoAnimal, { foreignKey: 'id_animal', as: 'fotos', onDelete: 'CASCADE' });
FotoAnimal.belongsTo(Animal, { foreignKey: 'id_animal', as: 'animal' });

// animal N:N caracteristica
Animal.belongsToMany(Caracteristica, {
  through: AnimalCaracteristica, foreignKey: 'id_animal',
  otherKey: 'id_caracteristica', as: 'caracteristicas'
});
Caracteristica.belongsToMany(Animal, {
  through: AnimalCaracteristica, foreignKey: 'id_caracteristica',
  otherKey: 'id_animal', as: 'animais'
});

// animal 1:N atendimento / usuario 1:N atendimento
Animal.hasMany(Atendimento, { foreignKey: 'id_animal', as: 'atendimentos', onDelete: 'CASCADE' });
Atendimento.belongsTo(Animal, { foreignKey: 'id_animal', as: 'animal' });
Usuario.hasMany(Atendimento, { foreignKey: 'id_usuario', as: 'atendimentos' });
Atendimento.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'responsavel' });

// animal 1:N solicitacao / usuario 1:N solicitacao (quem analisou)
Animal.hasMany(SolicitacaoAdocao, { foreignKey: 'id_animal', as: 'solicitacoes' });
SolicitacaoAdocao.belongsTo(Animal, { foreignKey: 'id_animal', as: 'animal' });
Usuario.hasMany(SolicitacaoAdocao, { foreignKey: 'id_usuario_responsavel', as: 'solicitacoesAnalisadas' });
SolicitacaoAdocao.belongsTo(Usuario, { foreignKey: 'id_usuario_responsavel', as: 'responsavel' });

// solicitacao 1:N historico / usuario 1:N historico
SolicitacaoAdocao.hasMany(HistoricoSolicitacao, {
  foreignKey: 'id_solicitacao', as: 'historico', onDelete: 'CASCADE'
});
HistoricoSolicitacao.belongsTo(SolicitacaoAdocao, { foreignKey: 'id_solicitacao', as: 'solicitacao' });
Usuario.hasMany(HistoricoSolicitacao, { foreignKey: 'id_usuario', as: 'registrosHistorico' });
HistoricoSolicitacao.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'autor' });

module.exports = {
  sequelize,
  Sequelize,
  Usuario,
  Especie,
  Raca,
  Caracteristica,
  Animal,
  FotoAnimal,
  AnimalCaracteristica,
  Atendimento,
  SolicitacaoAdocao,
  HistoricoSolicitacao
};
