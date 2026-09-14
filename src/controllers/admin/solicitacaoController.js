'use strict';

const solicitacaoService = require('../../services/solicitacaoService');
const animalService = require('../../services/animalService');
const statusSolicitacao = require('../../domain/statusSolicitacao');
const { asyncHandler } = require('../../middlewares/erros');

/** RF10 - UC10: lista com filtros por situacao, animal, cidade e periodo. */
const listar = asyncHandler(async (req, res) => {
  const filtros = {
    status: req.query.status || '',
    animal: req.query.animal || '',
    cidade: req.query.cidade || '',
    protocolo: req.query.protocolo || '',
    de: req.query.de || '',
    ate: req.query.ate || ''
  };

  const [resultado, animais] = await Promise.all([
    solicitacaoService.listar(filtros, req.query.pagina || 1),
    animalService.listarParaSelecao()
  ]);

  res.render('admin/solicitacoes/lista', {
    titulo: 'Solicitações de adoção',
    resultado,
    filtros,
    animais,
    statusPossiveis: statusSolicitacao.listar().map((s) => ({ valor: s, rotulo: statusSolicitacao.rotulo(s) })),
    paginaAtiva: 'solicitacoes'
  });
});

const detalhar = asyncHandler(async (req, res) => {
  const solicitacao = await solicitacaoService.buscar(req.params.id);
  const proximos = statusSolicitacao.proximosStatus(solicitacao.status);

  res.render('admin/solicitacoes/detalhe', {
    titulo: `Solicitação ${solicitacao.protocolo}`,
    solicitacao,
    proximos: proximos.map((s) => ({
      valor: s,
      rotulo: statusSolicitacao.rotulo(s),
      exigeObservacao: statusSolicitacao.exigeObservacao(s)
    })),
    paginaAtiva: 'solicitacoes'
  });
});

/** RF11 - UC11: aprovar, recusar, concluir ou cancelar (RN04, RN05, RN06, RN10). */
const decidir = asyncHandler(async (req, res) => {
  const resultado = await solicitacaoService.registrarDecisao(
    req.params.id,
    req.body.status,
    req.body.observacao,
    req.session.usuario
  );

  const rotulo = statusSolicitacao.rotulo(resultado.novoStatus);
  req.avisar('sucesso',
    [`Pedido ${resultado.solicitacao.protocolo} marcado como "${rotulo}".`, ...resultado.efeitos].join(' '));

  res.redirect(`/admin/solicitacoes/${req.params.id}`);
});

module.exports = { listar, detalhar, decidir };
