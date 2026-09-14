/* ==========================================================================
   AdotaPel — JavaScript da camada de apresentação
   Cuida de: menu no celular, painel de filtros, abas do slider, galeria,
   máscaras, confirmação antes de ações destrutivas e validação prévia.
   Tudo aqui é conveniência: nada disso substitui a validação do servidor.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------- menu no celular ----- */
  const alternarMenu = document.querySelector('.menu-alternar');
  const menu = document.getElementById('menu-principal');

  if (alternarMenu && menu) {
    const telaLarga = window.matchMedia('(min-width: 62em)');
    const ajustar = () => { menu.hidden = !telaLarga.matches; alternarMenu.setAttribute('aria-expanded', 'false'); };
    ajustar();
    telaLarga.addEventListener('change', ajustar);

    alternarMenu.addEventListener('click', function () {
      const aberto = alternarMenu.getAttribute('aria-expanded') === 'true';
      alternarMenu.setAttribute('aria-expanded', String(!aberto));
      menu.hidden = aberto;
    });
  }

  /* ---------------------------------- painel de filtros do catálogo ------ */
  const alternarFiltros = document.querySelector('.filtros-alternar');
  const painelFiltros = document.getElementById('painel-filtros');

  if (alternarFiltros && painelFiltros) {
    const telaLarga = window.matchMedia('(min-width: 62em)');
    const ajustar = () => { painelFiltros.hidden = !telaLarga.matches; alternarFiltros.setAttribute('aria-expanded', 'false'); };
    ajustar();
    telaLarga.addEventListener('change', ajustar);

    alternarFiltros.addEventListener('click', function () {
      const aberto = alternarFiltros.getAttribute('aria-expanded') === 'true';
      alternarFiltros.setAttribute('aria-expanded', String(!aberto));
      painelFiltros.hidden = aberto;
      if (!painelFiltros.hidden) painelFiltros.querySelector('input, select').focus();
    });
  }

  /* --------------------------------------------- abas do slider ---------- */
  const abas = Array.from(document.querySelectorAll('.slider__abas [role="tab"]'));

  if (abas.length) {
    const mostrar = (indice) => {
      abas.forEach(function (aba, i) {
        const selecionada = i === indice;
        aba.setAttribute('aria-selected', String(selecionada));
        aba.tabIndex = selecionada ? 0 : -1;
        document.getElementById(aba.getAttribute('aria-controls')).hidden = !selecionada;
      });
      abas[indice].focus();
    };

    abas.forEach(function (aba, i) {
      aba.addEventListener('click', () => mostrar(i));
      aba.addEventListener('keydown', function (evento) {
        if (evento.key === 'ArrowRight') mostrar((i + 1) % abas.length);
        if (evento.key === 'ArrowLeft') mostrar((i - 1 + abas.length) % abas.length);
      });
    });
  }

  /* ------------------------------------- galeria do perfil do animal ----- */
  const fotoPrincipal = document.getElementById('foto-principal');
  const miniaturas = Array.from(document.querySelectorAll('.miniatura'));

  if (fotoPrincipal && miniaturas.length) {
    miniaturas.forEach(function (botao, i) {
      botao.setAttribute('aria-pressed', String(i === 0));
      botao.addEventListener('click', function () {
        fotoPrincipal.src = botao.dataset.foto;
        fotoPrincipal.alt = botao.dataset.legenda || fotoPrincipal.alt;
        miniaturas.forEach((outro) => outro.setAttribute('aria-pressed', 'false'));
        botao.setAttribute('aria-pressed', 'true');
      });
    });
  }

  /* ------------------- raças acompanham a espécie escolhida (admin) ------ */
  const campoEspecie = document.getElementById('id_especie');
  const campoRaca = document.getElementById('id_raca');

  if (campoEspecie && campoRaca) {
    const todas = Array.from(campoRaca.options).map((opcao) => ({
      valor: opcao.value, texto: opcao.text, especie: opcao.dataset.especie
    }));

    const filtrar = function () {
      const escolhida = campoEspecie.value;
      const selecionada = campoRaca.value;
      campoRaca.innerHTML = '';

      todas
        .filter((item) => !item.especie || !escolhida || item.especie === escolhida)
        .forEach(function (item) {
          const opcao = document.createElement('option');
          opcao.value = item.valor;
          opcao.text = item.texto;
          if (item.especie) opcao.dataset.especie = item.especie;
          if (item.valor === selecionada) opcao.selected = true;
          campoRaca.add(opcao);
        });
    };

    campoEspecie.addEventListener('change', filtrar);
    filtrar();
  }

  /* --------------------------------------------------------- máscaras --- */
  const mascaras = {
    telefone: function (valor) {
      const d = valor.replace(/\D/g, '').slice(0, 11);
      if (d.length <= 2) return d.length ? '(' + d : '';
      if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
      return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    },
    protocolo: function (valor) {
      const d = valor.replace(/\D/g, '').slice(0, 10);
      return d.length <= 4 ? d : d.slice(0, 4) + '-' + d.slice(4);
    }
  };

  document.querySelectorAll('[data-mascara]').forEach(function (campo) {
    const aplicar = mascaras[campo.dataset.mascara];
    if (!aplicar) return;
    campo.addEventListener('input', function () { campo.value = aplicar(campo.value); });
  });

  /* ------------------------- confirmação antes de ação destrutiva -------- */
  document.querySelectorAll('[data-confirmar]').forEach(function (formulario) {
    formulario.addEventListener('submit', function (evento) {
      // Com campo por preencher, quem avisa é a validação logo abaixo:
      // não faz sentido pedir confirmação de um envio que nem vai sair.
      if (!formulario.checkValidity()) return;
      if (!window.confirm(formulario.dataset.confirmar)) evento.preventDefault();
    });
  });

  /* ------------------------ observação obrigatória ao recusar/cancelar --- */
  const formDecisao = document.querySelector('[data-decisao]');

  if (formDecisao) {
    const seletor = formDecisao.querySelector('#status');
    const observacao = formDecisao.querySelector('#observacao');
    const dica = formDecisao.querySelector('#dica-observacao');

    const ajustar = function () {
      const exige = seletor.selectedOptions[0].dataset.exigeObservacao === 'true';
      observacao.required = exige;
      observacao.setAttribute('aria-describedby', 'dica-observacao');
      dica.textContent = exige
        ? 'Obrigatória para esta decisão. Não aparece para o interessado.'
        : 'Opcional nesta decisão. Não aparece para o interessado.';
    };

    seletor.addEventListener('change', ajustar);
    ajustar();
  }

  /* ------------------------------------ validação prévia dos formulários - */

  /**
   * A mensagem do campo é escrita pela aplicação, e não herdada do navegador.
   * O texto de campo.validationMessage sai no idioma da interface do navegador:
   * quem usa o Chrome em inglês veria o formulário em português com o erro em
   * inglês. Aqui o site responde sempre na própria língua.
   */
  function mensagemDe(campo) {
    const estado = campo.validity;
    const tipo = (campo.type || '').toLowerCase();

    if (estado.valueMissing) {
      if (tipo === 'checkbox') return 'É preciso marcar esta opção para continuar.';
      if (campo.tagName === 'SELECT') return 'Escolha uma opção da lista.';
      return 'Preencha este campo.';
    }
    if (estado.typeMismatch) {
      if (tipo === 'email') return 'Informe um e-mail válido, como nome@provedor.com.br';
      return 'O formato deste campo não está correto.';
    }
    if (estado.tooShort) return 'Escreva pelo menos ' + campo.minLength + ' caracteres.';
    if (estado.tooLong) return 'Use no máximo ' + campo.maxLength + ' caracteres.';
    if (estado.rangeUnderflow) return 'O menor valor aceito é ' + campo.min + '.';
    if (estado.rangeOverflow) return 'O maior valor aceito é ' + campo.max + '.';
    if (estado.patternMismatch) {
      return campo.dataset.mensagemPadrao || 'O formato deste campo não está correto.';
    }
    if (estado.stepMismatch) return 'Escolha um valor dentro da faixa permitida.';
    if (estado.badInput) return 'Confira o que foi digitado neste campo.';

    return campo.validationMessage;
  }

  document.querySelectorAll('form[data-validar]').forEach(function (formulario) {
    const marcar = function (campo) {
      // A mensagem vai no bloco do campo, e não ao lado da caixa de marcação.
      const destino = campo.closest('.campo') || campo.parentElement;
      const antigo = destino.querySelector('.erro-campo');
      if (antigo) antigo.remove();

      if (campo.validity.valid) {
        campo.classList.remove('invalido');
        campo.removeAttribute('aria-invalid');
        return true;
      }

      campo.classList.add('invalido');
      campo.setAttribute('aria-invalid', 'true');
      const aviso = document.createElement('p');
      aviso.className = 'erro-campo';
      aviso.textContent = mensagemDe(campo);
      destino.appendChild(aviso);
      return false;
    };

    formulario.querySelectorAll('input, select, textarea').forEach(function (campo) {
      campo.addEventListener('blur', function () { if (campo.value !== '') marcar(campo); });
    });

    formulario.addEventListener('submit', function (evento) {
      let primeiroInvalido = null;

      formulario.querySelectorAll('input, select, textarea').forEach(function (campo) {
        if (!marcar(campo) && !primeiroInvalido) primeiroInvalido = campo;
      });

      if (primeiroInvalido) {
        evento.preventDefault();
        primeiroInvalido.focus();
        primeiroInvalido.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
  });
}());
