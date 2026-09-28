/* ==========================================================================
   ÓTICA NOBLESSE — comportamento do site
   Tudo que precisa ser atualizado sem mexer no layout está no CONFIG abaixo.
   ========================================================================== */
(function () {
  'use strict';

  /* ======================================================================
     CONFIG — EDITE AQUI
     ====================================================================== */
  var CONTEUDO = window.NOBLESSE_CONTEUDO || {};

  var CONFIG = {

    /* Número no formato internacional, só dígitos (55 + DDD + número).
       Vale para todos os links de WhatsApp da página. Ao trocar o número aqui,
       lembre de atualizar também o que aparece ESCRITO no HTML (header, rodapé,
       seções de contato e localização) e nos links `tel:`. */
    whatsapp: '5534997202967',

    /* FAIXA DE EVENTO, HORÁRIO, DEPOIMENTOS E SELO DO GOOGLE vêm do conteúdo
       do painel (/admin), por meio de assets/js/conteudo.js (gerado por
       scripts/conteudo.py — não editar à mão). Os valores abaixo só valem se
       aquele arquivo não carregar.

       Faixa de evento: aparece somente enquanto `ativo` for true E a data
       atual for anterior a `dataFim` (fuso do visitante). Passou do dia, some
       sozinha. */
    evento: CONTEUDO.evento || { ativo: false, dataFim: '' },

    /* Lista vazia = o site mostra "confirme pelo WhatsApp". */
    horario: CONTEUDO.horario || [],

    /* Seção de depoimentos fica oculta com a lista vazia e sem selo do Google. */
    depoimentos: CONTEUDO.depoimentos || [],

    /* Selo do Google: aparece com `nota` e `url` preenchidos. */
    google: CONTEUDO.google || { nota: null, avaliacoes: null, url: '' }
  };

  /* ====================================================================== */

  // Textos que vêm da planilha entram via innerHTML: escapar sempre.
  var esc = function (t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------- 0. INTRO DE MARCA
     A animação inteira é CSS; aqui só cuidamos de tirar o nó do caminho,
     destravar o scroll e marcar a sessão. O <head> já tem um watchdog de
     2,5s que faz isso sozinho caso este trecho nunca rode. */
  (function () {
    var raiz = document.documentElement;
    var intro = $('#intro');
    if (!intro) return;

    // marca antes de animar: se o visitante sair no meio, a próxima página
    // já não mostra o intro de novo
    try { sessionStorage.setItem('noblesseIntroVista', '1'); } catch (e) {}

    function encerrar() {
      raiz.classList.remove('com-intro');
      raiz.classList.add('sem-intro');
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }

    // não era para aparecer (2ª visita, reduzir movimento, etc.)
    if (!raiz.classList.contains('com-intro')) { encerrar(); return; }

    var prazo = window.setTimeout(encerrar, 3050); // fim da animação: 3,0s
    intro.addEventListener('animationend', function (e) {
      if (e.animationName !== 'intro-sai') return;
      window.clearTimeout(prazo);
      encerrar();
    });
  })();

  /* ---------------------------------------------------- 1. HEADER / SCROLL */
  var header = $('#site-header');

  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 80);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ------------------------------------------------- 1b. FAIXA DE EVENTO */
  (function () {
    var faixa = $('#faixa-evento');
    if (!faixa) return;

    var ev = CONFIG.evento || {};
    var fim = ev.dataFim ? new Date(ev.dataFim) : null;
    var dataValida = fim && !isNaN(fim.getTime());

    if (!dataValida && window.console && console.warn) {
      console.warn('[Noblesse] CONFIG.evento.dataFim inválida: ' + ev.dataFim);
    }
    if (!ev.ativo || !dataValida || Date.now() >= fim.getTime()) return;

    faixa.hidden = false;
    // dá folga no topo do hero para a faixa não encostar no conteúdo
    document.documentElement.classList.add('evento-ativo');
  })();

  /* -------------------------------------------------------- 2. MENU MOBILE */
  var toggle = $('#menu-toggle');
  var nav = $('#nav');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }

  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });

  // fecha ao clicar em um link do painel
  $$('a', nav).forEach(function (link) {
    link.addEventListener('click', function () { setMenu(false); });
  });

  // fecha com Esc e devolve o foco ao botão
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });

  // fecha ao clicar fora
  document.addEventListener('click', function (e) {
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    if (!nav.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
  });

  // ao voltar para o desktop, garante o painel fechado
  window.matchMedia('(min-width: 880px)').addEventListener('change', function (e) {
    if (e.matches) setMenu(false);
  });

  /* ------------------------------------------ 3. REVELAÇÃO E LINK ATIVO */
  /* Os divisores dourados entram como mais um tipo de elemento observado pelo
     mesmo IntersectionObserver — o CSS é que decide o efeito de cada classe. */
  var revealItems = $$('.reveal, .divisor');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    revealItems.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
      revealObs.observe(el);
    });
  }
  // avisa o watchdog do <head> que as animações estão sob controle
  window.__noblesseRevealReady = true;

  if ('IntersectionObserver' in window) {
    var navLinks = $$('.nav-list a');
    var sections = navLinks
      .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
      .filter(Boolean);

    var activeObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { activeObs.observe(s); });
  }

  /* ------------------------------------------------------- 4. HORÁRIO */
  if (CONFIG.horario && CONFIG.horario.length) {
    var texto = CONFIG.horario.map(function (h) { return h.dias + ': ' + h.horas; }).join(' · ');

    var wrap = $('#horario-wrap');
    $('#horario-texto').innerHTML = CONFIG.horario.map(function (h) {
      return '<span>' + esc(h.dias) + ': <strong>' + esc(h.horas) + '</strong></span>';
    }).join('<br>');
    wrap.hidden = false;

    var pendente = $('#horario-pendente');
    if (pendente) pendente.hidden = true;

    var footerH = $('#footer-horario');
    if (footerH) { footerH.textContent = texto; footerH.hidden = false; }
  }

  /* -------------------------------------------------- 5. PROVA SOCIAL */
  var secao = $('#depoimentos');
  var track = $('#testimonials-track');
  var g = CONFIG.google || {};
  var temDepoimentos = !!(CONFIG.depoimentos && CONFIG.depoimentos.length);
  var temGoogle = !!(g.url && g.nota);

  if (temDepoimentos || temGoogle) {
    secao.hidden = false;

    if (temDepoimentos) {
      track.innerHTML = CONFIG.depoimentos.map(function (d) {
        var nota = Math.max(0, Math.min(5, Math.round(d.nota || 5)));
        var estrelas = new Array(nota + 1).join('★') + new Array(6 - nota).join('☆');
        var foto = d.foto
          ? '<img src="' + esc(d.foto) + '" alt="" loading="lazy" width="40" height="40">'
          : '';
        return '' +
          '<figure class="testimonial">' +
            '<p class="stars" aria-label="Avaliação: ' + nota + ' de 5">' + estrelas + '</p>' +
            '<blockquote>“' + esc(d.texto) + '”</blockquote>' +
            '<figcaption>' + foto + '<span>' + esc(d.nome) + '</span></figcaption>' +
          '</figure>';
      }).join('');

      initCarrossel();
    } else {
      $('.testimonials').hidden = true;
    }

    if (temGoogle) {
      var badge = $('#google-badge');
      badge.href = g.url;
      $('#google-rating').textContent = String(g.nota).replace('.', ',') + ' no Google';
      $('#google-count').textContent = g.avaliacoes ? g.avaliacoes + ' avaliações' : 'Ver avaliações';
      badge.hidden = false;

      var footerG = $('#footer-google');
      if (footerG) footerG.href = g.url;
    }
  } else if (window.console && console.info) {
    console.info(
      '[Noblesse] Seção de prova social oculta: preencha os depoimentos ' +
      'e/ou o selo do Google no painel do site (/admin).'
    );
  }

  function initCarrossel() {
    var prev = $('#tst-prev');
    var next = $('#tst-next');
    var dots = $('#tst-dots');
    var cards = $$('.testimonial', track);
    if (!cards.length) return;

    cards.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Ir para o depoimento ' + (i + 1));
      b.addEventListener('click', function () { irPara(i); });
      dots.appendChild(b);
    });

    function passo() {
      return cards[0].offsetWidth + 20; // largura do card + gap
    }
    function indiceAtual() {
      return Math.round(track.scrollLeft / passo());
    }
    function irPara(i) {
      track.scrollTo({ left: i * passo(), behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    prev.addEventListener('click', function () { irPara(Math.max(0, indiceAtual() - 1)); });
    next.addEventListener('click', function () { irPara(Math.min(cards.length - 1, indiceAtual() + 1)); });

    // navegação por teclado dentro do carrossel
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev.click(); }
    });
    track.tabIndex = 0;

    function sincronizar() {
      var i = indiceAtual();
      $$('button', dots).forEach(function (b, n) { b.classList.toggle('is-active', n === i); });
      prev.disabled = track.scrollLeft < 8;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    }
    track.addEventListener('scroll', function () {
      window.clearTimeout(track._t);
      track._t = window.setTimeout(sincronizar, 90);
    }, { passive: true });
    window.addEventListener('resize', sincronizar);
    sincronizar();
  }

  /* ------------------------------------------------------- 5a. VITRINE
     A esteira anda sozinha por CSS. Aqui fica só o botão de pausar/retomar
     (exigência de acessibilidade para conteúdo em movimento) e a economia de
     não animar com a aba em segundo plano. Sem JS, a esteira continua
     rodando normalmente — só não dá para pausar pelo botão, por isso ele
     começa oculto e o script o revela. */
  (function () {
    var esteira = $('#vitrine-esteira');
    var botao = $('#vitrine-pausa');
    if (!esteira || !botao) return;

    botao.hidden = false;

    function definir(parada) {
      esteira.classList.toggle('vitrine-parada', parada);
      botao.setAttribute('aria-pressed', String(parada));
      $('.vitrine-pausa-texto', botao).textContent = parada ? 'Retomar vitrine' : 'Pausar vitrine';
    }

    botao.addEventListener('click', function () {
      definir(botao.getAttribute('aria-pressed') !== 'true');
    });

    // aba em segundo plano: não gasta bateria animando o que ninguém vê
    document.addEventListener('visibilitychange', function () {
      if (botao.getAttribute('aria-pressed') === 'true') return; // pausa manual manda
      esteira.classList.toggle('vitrine-parada', document.hidden);
    });

    if (reduceMotion) definir(true);
  })();

  /* ------------------------------------------------ 5b. LINKS DE WHATSAPP
     O site não tem formulário: o agendamento acontece pelos links de WhatsApp
     e pelo link de telefone, que funcionam mesmo sem JavaScript (os endereços
     estão escritos no HTML). Isto aqui apenas sincroniza o NÚMERO de todos eles
     com CONFIG.whatsapp, preservando a mensagem própria de cada link — assim,
     se o número mudar, basta trocar em um lugar. */
  $$('a[href*="wa.me/"]').forEach(function (a) {
    a.setAttribute('href', a.getAttribute('href').replace(/wa\.me\/\d+/, 'wa.me/' + CONFIG.whatsapp));
  });

  /* ------------------------------------------------------------ 6. RODAPÉ */
  $('#ano').textContent = new Date().getFullYear();

})();
