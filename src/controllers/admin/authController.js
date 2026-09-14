'use strict';

const authService = require('../../services/authService');
const { asyncHandler } = require('../../middlewares/erros');

const formularioLogin = (req, res) => {
  if (req.session.usuario) return res.redirect('/admin');
  return res.render('admin/login', { titulo: 'Entrar na administração' });
};

/** UC06 - autenticar-se no sistema. */
const entrar = asyncHandler(async (req, res) => {
  const usuario = await authService.autenticar(req.body.email, req.body.senha);

  const destino = req.session.destinoAposLogin || '/admin';

  // Troca o identificador da sessão após o login, contra fixação de sessão.
  await new Promise((resolver, rejeitar) => {
    req.session.regenerate((erro) => (erro ? rejeitar(erro) : resolver()));
  });

  req.session.usuario = usuario;
  req.session.avisos = [{ tipo: 'sucesso', texto: `Bem-vinda, ${usuario.nome.split(' ')[0]}.` }];

  return res.redirect(destino);
});

const sair = (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
};

module.exports = { formularioLogin, entrar, sair };
