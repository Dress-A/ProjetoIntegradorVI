'use strict';

const painelService = require('../../services/painelService');
const { asyncHandler } = require('../../middlewares/erros');

/** RF16 - painel com os numeros da operacao (RN09: so administrador). */
const exibir = asyncHandler(async (req, res) => {
  const resumo = await painelService.resumo();

  res.render('admin/painel', {
    titulo: 'Painel',
    resumo,
    paginaAtiva: 'painel'
  });
});

module.exports = { exibir };
