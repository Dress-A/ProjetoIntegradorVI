'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const { MAX_FOTOS_POR_ANIMAL } = require('../domain/enums');

fs.mkdirSync(env.upload.diretorio, { recursive: true });

const armazenamento = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.upload.diretorio),
  filename: (req, file, cb) => {
    const extensao = file.mimetype === 'image/png' ? '.png' : '.jpg';
    const identificador = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `animal-${req.params.id || 'novo'}-${identificador}${extensao}`);
  }
});

/** Limite de envio a JPEG e PNG de ate 2 MB (secao 6). */
function filtro(req, file, cb) {
  if (env.upload.tiposAceitos.includes(file.mimetype)) return cb(null, true);
  const erro = new multer.MulterError('LIMITE_TIPO_ARQUIVO');
  erro.message = 'Envie imagens JPEG ou PNG.';
  return cb(erro);
}

const upload = multer({
  storage: armazenamento,
  fileFilter: filtro,
  limits: { fileSize: env.upload.maxBytes, files: MAX_FOTOS_POR_ANIMAL }
});

const uploadFotos = upload.array('fotos', MAX_FOTOS_POR_ANIMAL);

/** Traduz o erro do multer em mensagem legivel antes de chegar ao usuario. */
function tratarUpload(req, res, next) {
  uploadFotos(req, res, (erro) => {
    if (!erro) return next();

    const mensagens = {
      LIMIT_FILE_SIZE: `Cada imagem precisa ter no máximo ${Math.round(env.upload.maxBytes / 1024 / 1024)} MB.`,
      LIMIT_FILE_COUNT: `Envie no máximo ${MAX_FOTOS_POR_ANIMAL} imagens por vez.`,
      LIMITE_TIPO_ARQUIVO: 'Envie imagens JPEG ou PNG.'
    };

    req.avisar('erro', mensagens[erro.code] || 'Não foi possível enviar as imagens.');
    return res.redirect(path.posix.join('/admin/animais', String(req.params.id || ''), 'fotos'));
  });
}

module.exports = { upload, tratarUpload };
