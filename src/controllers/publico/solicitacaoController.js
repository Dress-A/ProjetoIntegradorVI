'use strict';

const solicitacaoService = require('../../services/solicitacaoService');
const { asyncHandler } = require('../../middlewares/erros');

/** RF04 - UC04: recebe o pedido e devolve o protocolo. */
const registrar = asyncHandler(async (req, res) => {
  const solicitacao = await solicitacaoService.registrarInteresse(req.params.id, req.body);

  // O protocolo viaja pela sessao: nao entra na URL (privacidade) e some apos ser lido.
  req.session.protocoloGerado = {
    protocolo: solicitacao.protocolo,
    email: solicitacao.email,
    idAnimal: solicitacao.id_animal
  };

  res.redirect('/solicitacoes/confirmacao');
});

const confirmacao = asyncHandler(async (req, res) => {
  const dados = req.session.protocoloGerado;
  req.session.protocoloGerado = null;

  if (!dados) {
    req.avisar('aviso', 'A confirmação já foi exibida. Consulte seu pedido pelo protocolo.');
    return res.redirect('/acompanhar');
  }

  return res.render('publico/confirmacao', {
    titulo: 'Pedido registrado',
    dados,
    paginaAtiva: 'animais'
  });
});

/** RF05 - UC05. */
const formularioConsulta = (req, res) => res.render('publico/acompanhar', {
  titulo: 'Acompanhar pedido',
  solicitacao: null,
  paginaAtiva: 'acompanhar'
});

const consultar = asyncHandler(async (req, res) => {
  const solicitacao = await solicitacaoService.consultarPorProtocolo(req.body.protocolo, req.body.email);

  res.render('publico/acompanhar', {
    titulo: `Pedido ${solicitacao.protocolo}`,
    solicitacao,
    paginaAtiva: 'acompanhar'
  });
});

module.exports = { registrar, confirmacao, formularioConsulta, consultar };
