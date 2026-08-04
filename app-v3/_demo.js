/* ============================================================================
   MODO DEMO — app RG Saúde
   ----------------------------------------------------------------------------
   Substitui o backend por dados simulados. Nenhum cadastro, nenhum login,
   nenhuma chamada de rede. Serve pra navegar por todas as telas e fluxos.

   Como ligar:   qualquer tela + ?demo=1     (fica ligado até desligar)
   Como desligar: qualquer tela + ?demo=0
   Porta de entrada: demo.html

   NÃO altera nenhuma tela. Só troca as funções do vitaeAPI depois que o
   api.js termina de carregar. Com o modo desligado, este arquivo nem carrega.
   ============================================================================ */
(function () {
  'use strict';
  if (!window.vitaeAPI) { console.warn('[demo] vitaeAPI não encontrado'); return; }

  var LS = window.localStorage;
  var ok = function (v) { return Promise.resolve(v); };
  var hoje = new Date();
  function dias(n) { var d = new Date(hoje); d.setDate(d.getDate() + n); return d.toISOString(); }
  function meses(n) { var d = new Date(hoje); d.setMonth(d.getMonth() + n); return d.toISOString(); }

  // ──────────────────────────────────────────────────── quem é a paciente
  var USUARIO = {
    id: 'demo-ana-costa',
    nome: 'Ana Costa',
    email: 'ana.costa@exemplo.com',
    celular: '+5511987654321',
    tipo: 'PACIENTE',
    fotoUrl: null,
    criadoEm: meses(-14)
  };

  var PERFIL = {
    id: 'perfil-demo',
    genero: 'FEMININO',
    dataNascimento: '1981-03-12',
    alturaCm: 165,
    pesoKg: 68,
    tipoSanguineo: 'O+',
    cpf: '123.456.789-00',
    nomeSocial: null,
    contatoEmergenciaNome: 'Roberto Costa',
    contatoEmergenciaTel: '(11) 98888-1234',
    parentescoEmergencia: 'Marido',
    contatoEmergenciaNome2: 'Marina Costa',
    contatoEmergenciaTel2: '(11) 97777-5566',
    parentescoEmergencia2: 'Filha',
    condicoes: 'Diabetes tipo 2 (desde 2021); Hipertensão (desde 2019)',
    cirurgias: 'Colecistectomia (2016)',
    historicoFamiliar: 'Mãe com diabetes tipo 2; pai com hipertensão',
    implantes: 'Nenhum',
    planoSaude: 'Unimed Nacional',
    gestante: false,
    flagsApp: {
      onboardingExamesVisto: true,
      onboardingConsultasVisto: true,
      onboardingQrCodeVisto: true,
      termosAceitosEm: meses(-14)
    }
  };

  // ─────────────────────────────── nada de onboarding no modo demonstração
  // As telas checam estas chaves antes de abrir os tutoriais. Marcando todas
  // como vistas, nenhum popup aparece — o app abre direto no conteúdo.
  try {
    ['vitae_onb_exames_visto', 'vitae_onb_quiz_visto', 'vitae_boasvindas_visto',
     'vitae_onb_consultas_visto', 'vitae_onb_qr_visto', 'vitae_onb_saude_visto']
      .forEach(function (k) { LS.setItem(k, '1'); });
  } catch (_) {}

  // ─────────────────────────────── a barra de abas nova
  // Sai Consultas, entra Concierge e Busca. Exames vira Documentos.
  // Reescrito daqui pra não ter que editar as onze telas uma por uma.
  var ABAS = [
    { id: 'meurg',      rot: 'Meu RG',     dest: '01-saude.html',
      ic: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="9"/>' },
    { id: 'documentos', rot: 'Documentos', dest: '09-exames-lista.html',
      ic: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
    { id: 'concierge',  rot: 'Concierge',  dest: '13-concierge.html',
      ic: '<line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="5.6" y1="5.6" x2="18.4" y2="18.4"/><line x1="18.4" y1="5.6" x2="5.6" y2="18.4"/>' },
    { id: 'busca',      rot: 'Busca',      dest: '11-busca.html',
      ic: '<circle cx="11" cy="11" r="7"/><line x1="16.2" y1="16.2" x2="21" y2="21"/>' },
    { id: 'qrcode',     rot: 'QR Code',    dest: '12-qr-code.html',
      ic: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/><line x1="21" y1="14" x2="21" y2="21"/><line x1="14" y1="21" x2="21" y2="21"/>' }
  ];

  function abaAtiva() {
    var f = (location.pathname.split('/').pop() || '').toLowerCase();
    if (f.indexOf('01-saude') === 0 || f.indexOf('40-saude') === 0 || f.indexOf('03-medicamentos') === 0 ||
        f.indexOf('06-alergias') === 0 || f.indexOf('41-') === 0 || f.indexOf('42-') === 0) return 'meurg';
    if (f.indexOf('09-exames') === 0 || f.indexOf('43-exames') === 0 || f.indexOf('10-exame') === 0) return 'documentos';
    if (f.indexOf('13-concierge') === 0) return 'concierge';
    if (f.indexOf('11-busca') === 0) return 'busca';
    if (f.indexOf('12-qr') === 0) return 'qrcode';
    return null;
  }

  function trocaAbas() {
    var barras = document.querySelectorAll('.tab-bar');
    if (!barras.length) return;
    // a tela de exames carrega o CSS antigo, que pinta a aba ativa de verde
    if (!document.getElementById('demoAbaCor')) {
      var st = document.createElement('style'); st.id = 'demoAbaCor';
      st.textContent = '.tab-bar .tab.active,.tab-bar .tab.active *{color:#2563EB!important;stroke:#2563EB!important}';
      document.head.appendChild(st);
    }
    var ativa = abaAtiva();
    var html = ABAS.map(function (a) {
      var on = a.id === ativa;
      return '<div class="tab' + (on ? ' active' : '') + '"' +
             (on ? '' : ' onclick="window.location.href=\'' + a.dest + '\'"') + '>' +
             '<svg viewBox="0 0 24 24">' + a.ic + '</svg>' +
             '<span class="tab-label">' + a.rot + '</span></div>';
    }).join('');
    barras.forEach(function (b) { b.innerHTML = html; });
  }

  // Cinto e suspensório: se algum tutorial escapar, some com ele.
  // (não remove nada do código — só esconde enquanto a demonstração está ligada)
  window.addEventListener('DOMContentLoaded', function () {
    trocaAbas();
    setTimeout(trocaAbas, 400);
    var esconde = function () {
      ['#onb', '#onbOverlay', '#tpl-onbOverlay', '.onb-overlay', '.onboarding-overlay']
        .forEach(function (sel) {
          document.querySelectorAll(sel).forEach(function (el) {
            el.classList.remove('active', 'show', 'open');
            el.style.display = 'none';
          });
        });
      document.body.style.overflow = '';
    };
    esconde();
    setTimeout(esconde, 350);
    setTimeout(esconde, 1200);
  });

  // ──────────────────────────────────────────────────── alergias
  var ALERGIAS = [
    { id: 'al-1', nome: 'Dipirona',      tipo: 'MEDICAMENTO', gravidade: 'GRAVE',     reacao: 'Inchaço nos lábios e falta de ar', fonte: 'manual',  criadoEm: meses(-14) },
    { id: 'al-2', nome: 'Frutos do mar', tipo: 'ALIMENTO',    gravidade: 'MODERADA',  reacao: 'Manchas vermelhas e coceira',      fonte: 'manual',  criadoEm: meses(-12) },
    { id: 'al-3', nome: 'Poeira',        tipo: 'AMBIENTAL',   gravidade: 'LEVE',      reacao: 'Espirros e nariz entupido',        fonte: 'scan',    criadoEm: meses(-6) }
  ];

  // ──────────────────────────────────────────────────── medicamentos
  var MEDICAMENTOS = [
    { id: 'md-1', nome: 'Losartana',   dosagem: '50 mg',  frequencia: '1x ao dia',  horario: '08:00',
      motivo: 'Pressão alta',        medicoPrescritor: 'Dr. Marcos Alves', dataInicio: meses(-18),
      duracaoDias: null, quantidadeEstoque: 42, quantidadePorDose: 1, ativo: true, fonte: 'manual' },
    { id: 'md-2', nome: 'Metformina',  dosagem: '850 mg', frequencia: '2x ao dia',  horario: '12:00, 20:00',
      motivo: 'Diabetes tipo 2',     medicoPrescritor: 'Dra. Helena Prado', dataInicio: meses(-24),
      duracaoDias: null, quantidadeEstoque: 18, quantidadePorDose: 1, ativo: true, fonte: 'scan' },
    { id: 'md-3', nome: 'Sinvastatina', dosagem: '20 mg', frequencia: '1x ao dia',  horario: '22:00',
      motivo: 'Colesterol',          medicoPrescritor: 'Dr. Marcos Alves', dataInicio: meses(-8),
      duracaoDias: null, quantidadeEstoque: 27, quantidadePorDose: 1, ativo: true, fonte: 'manual' },
    { id: 'md-4', nome: 'Amoxicilina', dosagem: '500 mg', frequencia: '3x ao dia',  horario: '08:00, 16:00, 00:00',
      motivo: 'Infecção de garganta', medicoPrescritor: 'Dr. Marcos Alves', dataInicio: meses(-5),
      dataFim: meses(-5), duracaoDias: 7, quantidadeEstoque: 0, quantidadePorDose: 1, ativo: false, fonte: 'manual' }
  ];

  // ──────────────────────────────────────────────────── exames + biomarcadores
  function P(nome, valor, unidade, ref, cls, sistema, expl, impacto, dicas) {
    return {
      id: 'p-' + nome.toLowerCase().replace(/[^a-z]/g, '') + '-' + Math.round(Math.random() * 1e6),
      nome: nome, valor: String(valor), unidade: unidade, valorReferencia: ref,
      classificacao: cls, status: cls === 'NORMAL' ? 'NORMAL' : (cls === 'CRITICO' ? 'CRITICO' : 'ATENCAO'),
      sistema: sistema,
      // o app lê snake_case (o servidor manda camelCase — bug conhecido, aqui mandamos os dois)
      explicacao_simples: expl, explicacaoSimples: expl,
      impacto_pessoal: impacto, impactoPessoal: impacto,
      dicas: dicas || null
    };
  }

  var PARAMS_MAR2026 = [
    P('Ferritina', 96, 'ng/mL', '15 a 150', 'NORMAL', 'Nutricional',
      'A ferritina é o estoque de ferro do seu corpo. É de onde ele tira ferro quando precisa.',
      'O seu está em 96, bem no meio da faixa. Em 2024 estava em 18 e em 2025 em 34 — subiu de forma consistente.',
      [{ name: 'Manter o que está fazendo', desc: 'A subida veio junto com a mudança de alimentação. Vale seguir.' }]),
    P('Hemoglobina', 13.4, 'g/dL', '12,0 a 15,5', 'NORMAL', 'Nutricional',
      'A hemoglobina é o que carrega oxigênio no sangue.', 'O seu valor está dentro do esperado.', null),
    P('Glicemia de jejum', 118, 'mg/dL', '70 a 99', 'ALTO', 'Metabolico',
      'É o açúcar no sangue depois de algumas horas sem comer.',
      'O seu está em 118, acima da faixa de referência do laboratório. O Dr. Marcos vê isso junto com sua hemoglobina glicada.',
      [{ name: 'Levar na consulta', desc: 'Esse valor conversa com o seu diabetes. Vale mostrar o histórico.' },
       { name: 'Caminhada depois das refeições', desc: '15 minutos após almoço e jantar ajudam no controle.' }]),
    P('Hemoglobina glicada', 7.2, '%', 'até 6,5', 'ALTO', 'Metabolico',
      'É a média do seu açúcar no sangue dos últimos três meses.',
      'O seu está em 7,2%. A faixa do laboratório vai até 6,5%.',
      [{ name: 'Conversar sobre a dose', desc: 'É o número que o médico usa pra decidir ajuste de medicação.' }]),
    P('Colesterol total', 214, 'mg/dL', 'até 190', 'ALTO', 'Cardio',
      'É a soma de todos os tipos de colesterol no seu sangue.',
      'O seu está em 214, acima do limite. Você já toma sinvastatina há oito meses.',
      [{ name: 'Ver junto com o LDL', desc: 'O colesterol total sozinho diz pouco. O LDL é o que mais importa aqui.' }]),
    P('LDL', 138, 'mg/dL', 'até 130', 'ALTO', 'Cardio',
      'É o colesterol que se acumula na parede das artérias.',
      'O seu está em 138. Estava em 162 no exame anterior — caiu 15%.', null),
    P('HDL', 58, 'mg/dL', 'acima de 40', 'NORMAL', 'Cardio',
      'É o colesterol que ajuda a limpar as artérias.', 'O seu está bom.', null),
    P('Triglicerídeos', 142, 'mg/dL', 'até 150', 'NORMAL', 'Cardio',
      'É a gordura que circula no sangue.', 'O seu está dentro da faixa, perto do limite de cima.', null),
    P('TSH', 2.1, 'mUI/L', '0,4 a 4,0', 'NORMAL', 'Hormonal',
      'É o hormônio que comanda a tireoide.', 'O seu está no meio da faixa.', null),
    P('Creatinina', 0.9, 'mg/dL', '0,6 a 1,1', 'NORMAL', 'Geral',
      'Mostra como os rins estão filtrando o sangue.', 'O seu está normal.', null),
    P('Vitamina D', 22, 'ng/mL', '30 a 100', 'BAIXO', 'Nutricional',
      'A vitamina D participa da absorção de cálcio e do funcionamento da imunidade.',
      'O seu está em 22, abaixo da faixa. É comum em quem pega pouco sol.',
      [{ name: 'Sol da manhã', desc: '15 a 20 minutos por dia, braços e pernas expostos, sem protetor nesse tempo.' },
       { name: 'Falar com o médico sobre reposição', desc: 'Reposição só com orientação — a dose depende do seu caso.' }]),
    P('Leucócitos', 6800, '/mm³', '4.000 a 11.000', 'NORMAL', 'Imunidade',
      'São as células de defesa do seu corpo.', 'A contagem está normal.', null)
  ];

  var PARAMS_NOV2025 = [
    P('Ferritina', 34, 'ng/mL', '15 a 150', 'NORMAL', 'Nutricional', 'A ferritina é o estoque de ferro do seu corpo.', 'Subiu em relação a 2024.', null),
    P('Glicemia de jejum', 131, 'mg/dL', '70 a 99', 'ALTO', 'Metabolico', 'É o açúcar no sangue em jejum.', 'Estava mais alto neste exame.', null),
    P('Hemoglobina glicada', 7.8, '%', 'até 6,5', 'ALTO', 'Metabolico', 'Média do açúcar dos últimos três meses.', 'Estava em 7,8%.', null),
    P('LDL', 162, 'mg/dL', 'até 130', 'ALTO', 'Cardio', 'Colesterol que se acumula nas artérias.', 'Estava mais alto.', null),
    P('TSH', 2.6, 'mUI/L', '0,4 a 4,0', 'NORMAL', 'Hormonal', 'Hormônio que comanda a tireoide.', 'Normal.', null),
    P('T4 livre', 1.1, 'ng/dL', '0,9 a 1,7', 'NORMAL', 'Hormonal', 'Hormônio da tireoide.', 'Normal.', null)
  ];

  var PARAMS_AGO2024 = [
    P('Ferritina', 18, 'ng/mL', '15 a 150', 'NORMAL', 'Nutricional', 'A ferritina é o estoque de ferro do seu corpo.', 'Estava no limite de baixo da faixa.', null),
    P('Hemoglobina', 11.8, 'g/dL', '12,0 a 15,5', 'BAIXO', 'Nutricional', 'Carrega oxigênio no sangue.', 'Estava um pouco abaixo.', null),
    P('Glicemia de jejum', 142, 'mg/dL', '70 a 99', 'CRITICO', 'Metabolico', 'Açúcar no sangue em jejum.', 'Estava bem acima da faixa.', null),
    P('Leucócitos', 7200, '/mm³', '4.000 a 11.000', 'NORMAL', 'Imunidade', 'Células de defesa.', 'Normal.', null)
  ];

  function conta(ps, c) {
    return ps.filter(function (p) {
      if (c === 'N') return p.classificacao === 'NORMAL';
      if (c === 'A') return p.classificacao === 'ALTO' || p.classificacao === 'BAIXO' || p.classificacao === 'ATENCAO';
      return p.classificacao === 'CRITICO';
    }).length;
  }

  // ── a foto do exame (miniatura do laudo)
  // Desenha um laudo de laboratório em SVG e devolve como imagem embutida,
  // pra o card do exame mostrar a foto do papel em vez de um ícone genérico.
  function fotoLaudo(lab, titulo, linhas, cor) {
    var y = 176, rows = '';
    linhas.forEach(function (l, i) {
      var c = l[2] || '#3A4250';
      rows +=
        '<rect x="26" y="' + (y - 15) + '" width="288" height="30" rx="4" fill="' + (i % 2 ? '#F7F8FA' : '#FFFFFF') + '"/>' +
        '<text x="38" y="' + (y + 5) + '" font-family="Helvetica,Arial" font-size="13" fill="#5B6472">' + l[0] + '</text>' +
        '<text x="304" y="' + (y + 5) + '" font-family="Helvetica,Arial" font-size="13" font-weight="bold" text-anchor="end" fill="' + c + '">' + l[1] + '</text>';
      y += 32;
    });
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="340" height="430" viewBox="0 0 340 430">' +
      '<rect width="340" height="430" fill="#FDFDFD"/>' +
      '<rect x="0" y="0" width="340" height="74" fill="' + cor + '"/>' +
      '<circle cx="34" cy="37" r="14" fill="#FFFFFF" fill-opacity="0.22"/>' +
      '<text x="34" y="43" font-family="Helvetica,Arial" font-size="15" font-weight="bold" text-anchor="middle" fill="#FFFFFF">+</text>' +
      '<text x="58" y="34" font-family="Helvetica,Arial" font-size="14" font-weight="bold" fill="#FFFFFF">' + lab + '</text>' +
      '<text x="58" y="52" font-family="Helvetica,Arial" font-size="10" fill="#FFFFFF" fill-opacity="0.75">Medicina diagnóstica</text>' +
      '<text x="26" y="104" font-family="Helvetica,Arial" font-size="9" letter-spacing="1.6" fill="#9AA2AE">RESULTADO DE EXAME</text>' +
      '<text x="26" y="126" font-family="Helvetica,Arial" font-size="15" font-weight="bold" fill="#1B2430">' + titulo + '</text>' +
      '<text x="26" y="146" font-family="Helvetica,Arial" font-size="11" fill="#8A93A0">Paciente: Ana Costa</text>' +
      '<line x1="26" y1="158" x2="314" y2="158" stroke="#E6E9EF" stroke-width="1"/>' +
      rows +
      '<line x1="26" y1="' + (y + 6) + '" x2="314" y2="' + (y + 6) + '" stroke="#E6E9EF" stroke-width="1"/>' +
      '<text x="26" y="' + (y + 28) + '" font-family="Helvetica,Arial" font-size="10" fill="#A8AEB8">Responsável técnico · CRM-SP 41.220</text>' +
      '<path d="M26 ' + (y + 56) + ' q18 -18 34 0 t34 0 t30 -4" stroke="#3A4250" stroke-width="1.6" fill="none" opacity="0.55"/>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // ── laudo de verdade (foto de um hemograma real), embutido aqui pra não
  //    depender de nenhum arquivo solto na pasta.
  var LAUDO_REAL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCAEsAPoDASIAAhEBAxEB/8QAGwABAAIDAQEAAAAAAAAAAAAAAAMEAQIFBgf/xABEEAACAQMDAgIECQoFAgQHAQABAgMABBEFEiETMSJBUQYUYXGBFTJVkZQjQqGxwdFSVGLwFiQzcjU2c4LhBzd0g5Px/8QAGAEBAQEBAQAAAAAAAAAAAAAAAAECAwT/xAAiEQEBAAMAAwEBAQAAAAAAAAAAAQIREgMhMWEiQf/aAAwDAQACEQMRAD8A/TkREBERARF5mX45i4+ScaJsuVktFuigbqLfeeArJb8S2T69NF4Mfwilc8h3hWTpHPTeyRw//wAg2vT8O8SxfEoi/Fk1aTT2kU5h8iOytxs+pMpfjWiz52bBgYj8nJfoiYNzV/MvNb8JsI+GnOdHkMg6gjBdHuSfLfhJjb8i3KT69pEBsAouVEREBERAREQEWLI8SigfMC17mwAGVw4bfA9pW1AREQEREBFU3Ijfkvga65GNDnDyB4+5WoCIqociOaSVkZJMTtLttrq6QWoiICIiAiIgIiICIiAiIgIiICIiAiIgIiIPJ+EObNjYsUGK7Tk5T+mx9fIHLnfMLXyeFjQeMYWfHFky42NieuxrRZlFG3v7uJrz2tfR/CUacvw2R20ZdJEXdmuewhv2r5L4MYPiD8jKfh02WBmh0chpriTRa72bFevxSTC15vJbc9HhXgEE5ZNk+Iw40Mh+JINPlF1YB432WiLOdD4pkmCR0mThFxjlcd54m/KY/wA9twfYtPhvhzW+Mx4c/RyLvqCJ1+jU103b+68uPBd4X47mRvssxYpHFx/OaWkN+nUFrvq3dZ651qPovhtm9XwOARQvfDOWydYfJb3APvtU/CPKkzPgpG+XEkxS3IY0Mk5IA59yn4/A/G+AmJDL8tgiDvetPw1/wDpyH/1o/uKxw1/M/WuW/d/GjxbxnIiy4/DfC4Wz5rmhzi75MY9qzTS/Cbw6P0mZ2LmRNGqSKNtOA70q8eVnhnw1y3ZhEbMyNphkdweNr7cL6HO8QxcHFdPkStawCxvu72DzXF/nUk26nvdteJ4r8JHM8Gws/w8BwmlDXMcLI2Nj37Ld4X+W5ckT57seLHc01jsFub5WV8iMeSH4O4D5Glon8REjGns2qH3L9GCeSTGan6YW5XdERFg2Fxzgxpc400CyT2XVxzQ5pa4AtIog90HzTRJNj47Xubpz5zM8aTq0DfnyoNW8eLSnFjmELLyHhuOwu3IJ+U7yHdaZsKQ58c0TmNY2ExAf6LI3A9wpaW40DWaREwN8tIQeNL47M2FpbDHrbE+SUOJoaXaRXvKt/K8/UMZij6hnbEPWNfJt1/+XzXqOxoHXqhjNgN3aOBuB7lhnwhN4xG447ei2J5e7SKe521Hz2tBld487oNc1kZc1jpJTZoNBoV7XbUrpvFpRkFkUcZDOk14cdw95rTttsF6IxYAwMEMelo0gaBQHkno2OGOHRjDSdR9Ubkd0Hi4viPRz8nIeGmGcyP1A7tZHTQfnNq0eNy+jTF0LOs0M0tDttT+GH2+a0syvD3MxwyJpa93Ti+LFbi9vZSiczw7pwTdJvxgLmfFiw1v53sA80EPytLZiLYur1XMDrOnS0W5x77cLFh+JS4+M0xxCV76yJyT/rdQA9tfcvYnOHDiuyXxxmP5ZcGA3ff7VS+bGjc1sEMQkEwhbbKBPJqh2FoPQbIHM1bgf7hSkvGzMqLNysWJhPRZI6Z7yKaWs+8X9y1enxZOHO6B7mvEReARRog0750G9FThuc/Cgc424xtJJ7mlcgIeNuURB83Fn+Nx9BvoUs8jiev1GBrWHbZhH5vJ1G+K7pD4h8InZLWy4ELWENGwNWXNs3ewDXHbuWlPEPDPFneKzZGFK1rnklkpmd6rdAAYWVVahdjfdQl8M+EGQwsnzYNJANNceQ8OHYdrHt2QQm8U+EgkdJH4UC1jXgR3s42yr7mvW4+UrfE/EPH486L0Pw/XEyIvcwbh7iw7au1O2rk17Vn/ACR8I2AOjz4eq2IRtcXGgLB2bp9lb3fsVo8L+EIz3T/lGMB72h9G7YC4igW03Zw23uuUH0ODJNNhQSZMYimcwF7Bfqmtxur0RAREQEREBERAREQZvEMKHxDDkxpwSx45GxB7Ee0L4vxPw3MxTKJ35EJdzl4wLo5+wMjRu13tF2vs8z0q2+ihptrgbdWk7UeN63XmGDx23/Hx77NII2Pnxx7PNa+PK4ss8ZXwsfhjBI0nPiO+wgjke/5hQ+9fVeEeByzva7KjlixGuDyyc3LkOHBf5NHZq9F2P43qH+Ij0AEU2gXeR45P2Ugg8bB/z4y0g02xbTfq2a325891rn5blPrjHxyf4r+GsckvgBbEx8juqzZrSTyvTy/D8fxLBjgy2F8Y0uoEjcD2KhsfiYz9TpGnGBd6tjfy7ccKno+OV608B9211R8u+4WO7qTbT/d6b8/w3E8Rx+jlxCRg4vYj3HsvMg+CPhMEzZOi+UtNhsry5o+ZdfH446RrmyMYNIBAePnPHJVvS8WEDKkaXhzrt433Ffm8c7e5JcpNSlkt9xtzfDcbPZEzIYXNieHsAJFEccLWvE6XjXXLjKzolzj0w4agLFC69604UfiQzNWW9hiLTs07A3sOPm+Zc2evrqX38ekiIuXQiIgIiICIiAoTFwicWC3VsFNEHhYHhzIseP0qV8LmSyCK36ba6xweNvLdXnwrB0mF0zy5sPSILxYZzx2/u1uzMQZQaC8tqwaANgiioHCDp5X6zUrNJaRfakEHx4kmC6F8zTHN6urWAXH2fQuHCxHzxtZIWzQ2fVf6xsUb+nlD4bqx2xOmdQ1AmhwdiN+FdFi9LMlnDz8Zy0j2AfuQY3eFYkcbmvnkDGxGJw1gUwm/781ZHhYsc0gZORJK0HTqF7NoGvd8y0z4rZeoQdLntAuuKNgqJwmFoaXv0iLpAeQ7n38IL4QBAwNfraGgB22/t2U1VjQjHx44WkuDBQJ5VqAiIg+Q+FuJn5/jmLi4NgvxJSHumfG2N2poD/V5cL2BXh+M/lnD/LE0M+VPEZY8aQAutlMjIkb5etqBrzX6WiD4hsrj4t4mM6TKb4w2d/5Pjc6QQltfF6QPVIPe+/KzeBZYPi/gkWJlZjs18bz4nHkyP/092u2vVxp7exfoCg+GN72PfG1z2G2OIBLT7PJBNERAREQEREBERBV1X9VzTE7SOHDuoyzyMJDYHv8AIhQe7KbJIWNY5upukE1t3P3o5+VpOmNhdR2JoXYr96CYnko/4d+3uR0zxDI8Qu1NaSG/6jvsoB+UXfIjoHej7D++lZC6Y11mNadO+k3vaDJ6bmGMkYDg4OqnO5Hn96OzcsFlYDyCAXb8cX+/6FV4k3xN00vojiGCP4vQ5gt1H5WoHvXHksrz48/KJaxseOIw0N6rC8uDgS69NWRY8gg9GPMyn4xkOE4PD2t0E1sQLPzWfoXDmZYhid6E7W5tvZq+Sdtr+crzhF46IsgGYueW6WU5nJ00Rt29bnnZU5Mfwn1yjHki0EuMWotBaL2Dtjew/wC4+SD6dccaaSBZ8l5nhY8SGRkvz3NETzcLA5p0CztYHlXmsGjx9zoSJCGmS5QHxkgeQNcbjzOx89g9+KRzx68ZYfIqoZMheGnGkF9727fis/h7s78nP9IDRkjUWF7w4E8i9I4HHzLzZh8IA+MwHU0NdrEkkdlxaQKpvDSAfn9iD2/SJKs40nHGyhNk5DWs6WM4ucSPW4Gx3PzgfSvBkj+FAaWsniNCrtlk+tRBrjdvIvZSdF8JdNMmYAWabe9ltdXytm8b3X+0c2UHrnNyxIB6C4s2sh2/e9vm+1Rdn5jXkegPLQSNQNrG1vjb4mvkdpkaGWxj2aXDbVuW3fO/G6yyQ/ChrXtjnikP5ji5goiufV3utv8Azm+Ag9p+XkNdABiPd1GtL6/MJIsfNv8AQrIZ8iTJe12OY4mkgPcd3bA39pHzLN4ufEzBCPDWMEusOkLngeqOW7g88LJBH42S0TvIDsgO9R7PUj39XjfsP3oPeRfMyR/CYguZLGAbJadF0SNhtsQAeb5UWxfCcRM+OaXBp16nM3dvWnbbgDf/AFHyQfRzSPYQGRF9+R4VE+XPGWdPDfIHNtx1VpNgV9v2LLhx+JjKx/SJHmFrXl51MNkkaQ6huQL3Fdl6yDz8fxDJmymxP8OmijPMriKG1/fYVbfEswucHeFzNAHqnUDZ+bheolIMeDl5GS+Rs+E/GDQCC5wOrn+/nWxUT9cSMMIaW/nA/N/NQEmYQLijBoXve9oNSqy5HRYk0ja1MY5wvzAXS6SjTN963HzKjK9JPo/RF+v8aLFadJ5v21wg+fyPHs2PMMbXx6fydJkfI/PBdXzbBY//ABN4j6LnP6kWqHw5mQz1B8skg/MvaGP4q7CBe2EZTYtJ06acS7ftwB29pUhi+IaJg9kZ9Z5aWhgLmgeqziqs3v5boPnfHvhV4lgx5BgkhBZj48guMHd7qct3hvwgzsjOfFI+ItbHI4Uzu0GlvOL4s9o1sxiS2MHU1h457efPs4oq6SPxBmOOlA3rHqjVTL59SzVDb2dkHymF8L/FZvydrkh+PYS/4sc/F/xFT8M+FvimT4riQSyQmOWHW4CMA30o3fe4r7DCxpW9brwREtDel6rQPkixsNvWCwxR+MBjXHBwGSBleqBsb7b+VbII+DeL5eZ4xkY8zmGOOSRrQG0aDYyP/wBivTny8yOdzI8EyMBoP11Yob/aVVhjPGZc8EDGGR+8Q/NoUSebv7FvyOroHRrVqF35IMHp+fpJ/JrifLWunOzwHf8Aw51gEtAfyd9vZwPpWjXmbXDF3unfQqs5viEsUbcZzYXmVmt4o0yvW5QegDY3FFEHCICIiAiIgxSsgMz9UrmOsE9vt+j3LsDoIS4NyC4bvN7+Q5/vlaOlC9zjoY5xO5oHcLno8IB+LZW/5vnygzdKAuc5s7wXSAktPc8BTZ0ujobOS3Td/Pzf2LR0o62Y2iQeO6i2GEAhrGAVRAHzoKMhsEkz43vdqIZbQONzRVOrF3PUkol79xvxRora6GGRxLmMcT3IBXPR8cAfFR1yNggzwS40T6Y9zjoa29PYDY386vizIZntYwnU4agCCNlJsEF22OOwewGxXWQwsd6kbGkeQQYp34k0zmvkcHE0Rp7jerr2KUL8ZoD43uIc4uvTzd7fNa1GCB5sxMdffSPP8Vw48AJeY2DaiSOw3QZAzFnOhrnjWHNHq13s9lJ7YGPGqR4AkobbaiKq6WgNxmO1NEQIJNiuf7tHNxnklwicT3NboMLX4QjIEr6EYBtvZp93K0MxIpQae4gFwOwo37Fc2HGds1kRregArI4o4r6bGsvnSKtBJjdDGtsmhVldREBERAREQEREBFHqM0l2ptAWTakCCLHCAi45zWgFxAs1ue6iZowLMjAPMuH99kE0UDNE3mRgsXu4cea62VjnaWvaSOwNoJIoNljcCWvaQBZIPbzXRIxwJDmkDkgoJIuFzW3ZArzK6CCLHCAi4CCSAdxyuOkY1wa57Q49iUElGSRkQBeaBND3rnVj1adbdV1V7/3suOmh7yR7ebht/doIty4HCxK0/P8A35LoyYSdpAa5retrRrYPlNEfNWK58kHRIDh06dwdt0E45GyNJb2NGxW6koxuY4XGWkX+aVJAREQFx7tLC7yFrqhN/kv/APKUHynpOLkTubK/HZOWCWQF0rQ0O3Fu2H5ysc3DBLzk4LSWa79JeLbdXzxZq1KLw7w7IhD5nO6ksDGyt6zgCNAFEX5D71J3gXhLnsOlxcxojFTO2ArbntsPoXWkXYszdJix8jBf1Wl1CZ7i5vBI39ig3HZh48mS0YrYRCdTw6Rw0Vv9gUsXwbwzGym5EEdTNsB3UJ5sfTyFrnbjOxn4s0nqOYWOBebIrffnhXkeJB4j4dhTNfDJisdHG42GzOAaNnHjtpO6ufnYeTpY7Iw3CH4vU10gDarlw2HHN7qx3hHhLgfWkAIIIbM4Dck1t7SVaPB/C4S6PpaWuNuj1u0u8rbwQO3kpoYGPw3TQwtma0uJ0sPXbqJ27j2q1vieG7KizRlYvWlALCTKNXraBTfear22r2eDeFyPtge6Tch/WdqBNEm7sGgN/JcPwe8IjYT0ixoIAqV3qHbjfY7DhNCvEwsfNx+tjGF0WpwNSyt3BNgjbzKQ5+NHiOx2TY/ScCDqExsHe7I43+Vxvytvh+LgeHsdFiEMZKRbS4kE1p79zXzrj/C8ER0/qaIxVOmfQbt6vPydhtxsryPKbneGSOGnIxX6wHEgzEUbIs9ue/Gytklw4YmPkMIbLKYm22a3PB3bxfI+xacfwfwiKWOaFrSYiCLkJbfFkHYnflSPg/h0zjckziHE/wDUu2JJut9t3H6VNDPh+J4uM5/o02O0s9VwLJj7zuN+Oey9oT5xAIdiEHgjUsMuD4eTK2V5DnPL3XM4EEtojnYECiOFtbLC1oa17AAKABGwV5Hetn+eL9D062f54v0OQTRF2kSMJ8tQXXSxtvU9ormzwnMHOtn+eL9D062f54v0PQzRBxaZGAjkagu9WOgdbaPG6cwc62f54v0PTrZ/ni/Q9GzRudpbI0k9gVJ0jGttzgBdXfdOYI9bP88X6Hp1s/zxfoeo+kwfpWqccrJQTG9rqq6PnunMHnnw5xolsFjaw+Qdq7e9cd4WXCS2Q3IC1x6klkEAc37AvUROYMksWTNE2N4xywPD61P5BtZx4aRE2PpYxY35ILpDXO3u3K9NE5g813hznta1zMctaCANcnFAfcAp4+JNjSOfG3H1Fpabc87E2VvROYPPhwpICTFHjNJYGEgvsgX+JUoMSXHgliiZjNZLWsapDdAD7gFuROYMORjZGTKZJDDqIAOl8jbo2OFnZ4SGN0tZDVaf82XiiPPyJXrInMHmweHOgm6kbYdZFWZJD2rufJW5GNPkztllGO54AA9Z4qjY+1bUTmDyhjh0hcBja2jVYdICKBF/aVW+CB+p7nYg180+QVYG1dthwvXDGjhoHbhOmz/Q36AnIwwse6ERROxnNEvU2c8nUDfPvUfQTNBEwx4zo2WWguk8iD3/ANxXohoHAA9wQAAUAAPYnIq8KDoJ5cYtYAGtkBYSf9tb+xoXprz8X/5rL/6DP/2cvQXFUREQFx7dTHN8xS6iDxoMXJjgiY7Chc5jA0u6o3oV/pVnSyf1GL64fwr1UV3R5QiyW8YMQ90w/hR0OQ427AhJ8zKD/wDyvVRN0eV0Mj9Qh+tH8KkWZbjZw4yfMzD+Femibo8oQ5DXWMCEEd+qP4VJzMtwp2HGR5GYfwr00TdHldHIof4CHbj40bf9qkWZZsHDjN8/HDf/ALV6aJujyujkAUMCGvLqj+FBDkNNtwYgfZKP4VHxEeMNznPwOk6ARUGSkUX778X5d1F0nj3rkQYppjdIvl1et34uvmTdFhhyHEl2DCSe5lH8K56PPqv0CG//AFR/D7EB8WE4Ia0xCWS2uLbLSBp3HFG/bws7ZPhE4Ql8OK0gO1hrtid65+b8U3RoEGQDYwIRRv8AzR/CumHJLiTgxEnk9Ufwr0MYzHHjOQGibSNYZxatTdHkmDIN3gQm/OUfwrphyTzgxfXD+Feqibo8psOQ0gtwIQRwRKP4VItyzzhx83/nD+Femibo8oQ5A4wIR/8AlH8K62PKYTowom3zUwH/APKt8QZnmeF2FI0Ri+ox1C63FbHmtPuN9lkjk8cMQMkMIl6J1AOGjXq7d/k+2rTdGis39UZ9f/SlZv6oz6/+lW4Ds90kvprYmNGnQI++wve/O+y8/FPwgZIxs7ceSIvcXOJGoN7AVQTqjXWb+qM+v/pSs39UZ9f/AErHG74QxwNBZjyv6Flz6DjJfGxApWvf46JZA2LEMYcNB7ubRu99jde72p1RfWb+qM+v/pSs39UZ9f/SvSROqPNrN/VGfX/0pWb+qM+v/pXpLFK7N9MkbEI+kGs0l42Jt2rje/kp1RVWb+qM+v8A6UrM/VGfX/0rTiuyHY8hnBD9bw3gHTqOn2cUvNjd46yBg0RPd0hqMhGrXvZ2oeVCk3RprN/VGfX/ANKVm/qjPr/6VnhfL4uMepI4jKOnbiWkfJ9agCPzvsKg+T4Qud6sGKwCY1T+WbVf28b+5OqNdZv6oz6/+lKzf1Rn1/8ASmE7xR2RGMtkLIemS4s3OqzQ523r6VLKPiJyJG4ojDR0y0ycEajr43uqTdHcKGcZkk00bYwY2sAD9RNEnyHmt6z4Tp3QE5Ap/UfVijp1HTfzUtCgIiICIiAi8HO+ErMPMycc45cYNIsSD1y6uBz+cn/CQCGWXHDB7Y2xOPx7Qaeu2rt8/wCyoLQeD5b8FMj4dsw8zJxzjlxg0ixIPXLq4HP5yfhIBDLLHjB7Y2xOPx7Qaeu2rt8/7Kgt9RB8dvQFEsg942d+Cvfw80Ta5PDPU0MdcMuvcnc+r7APmpBg8W+FbcHwmDMbjOe6UtHTLtOm2l253vjt3XoM+E+O/wADkzjBOxrPzHRP1Guew2vfjm181H4b4l4XiZDT4a+ORkbtBcSNRvSCPV7FpXreH+Nulze1+eXwyOOl1yQOo1XHqm//AJIL5/hZ4dj9ZssckboyBWm7v6VPP+E2HgYbcqSKZ0RfoJa3jY891wfDDwiTIla1krWMkbGCG3etou6ux5X9lezB43j5cbnQPa8sBLmg3XmOOfegzeF/CjA8YlLcSTUeQARfvC8/x/xDPzc+PwrwWZ8U0R+PldsGA9uD5+Y8lqL8Twvxvw3JYRHDl67LOxDaB2/E+8LFDl4Xhviec/xLE9WXKMkeQXbEmg2h5Cq3+ZBqfl+K/wDgi3Kx8kzMDrrIiZW3vHf7Ff4b8IsHxCJ8kUxaGSNjJdxbjt9Kb4/OyPCcqfBw3Rv06gJXNIcNwTt7iVwuUcTKM+G7dvyoyBTxdgD3Fb9gvSJ4pLNMxebiJZ/CmMbHiYzHOfIWuc5wDe1+deW3fZWSeIzYzfEHOjLnRSNaxrTfrOOw+7f2ry54Mjw3xrHl8Nia5+G0/GD5RJoOI9zqPHb2rzJH+I4/i0nib4pQyN/RcyIOJfWzTQ39hHz90H0+F4wJs+PGyIY3lprqx+xxseXBaeV6oyIS4NEsZceBqFn2r5jw2fDzpfDpsdo6vSf1JGMDdRoi+CD3+9d8Bxo/EMr0mSHF6jS5thzXvBcNRoAAcnvfPCD6l2XjMcWuyImuHIL8lRHmYspIjyIXkctc0/eu5A/wCXPl9lVN4RmuxpTHKfiHmwT+Z7fcvE8emAyPTsL0dEHU53k47b7hcnldXjJZteliy+jTuDpNmk3E32j5X/AJfvW3xLBz80SNZlNZAWtqNroM7dr2VuF8IsPPy34+O/W5tk1x4d/f8ANo2XlwXEmmMbf8xNTHxr5Sn9CJj++oS0aQO/T4/2s7DlR5jHukyBM45DXNZbdWhtu+bp7Xdc2r9vpUXi+PT+K54nmixSXY+n8+U/oZTUdINj7t54XPFPHZY4G4uZlvOTKzUY29Q6TzR4NR/8y1u/A8OoZUcMoLnlx4d8yQwGYyIB0h5xn9GXAj8P34QSNTa0RQOdFsSSXRuI9nb2rzHqiKKPGyIYzHhtcMnUwFrx78bF7fyD7lTBPn5+RE9jZxHUdZdCiOK54XLGvrDxObqBOl7RVXt42+7lTIA0AABQCJqZR9V4T4b4vlYORhmL0TFmieHZDPzHMPI9pAvfevmXlZfxr4bg5EOFDmZTDPHGIw8yMOsu0uJ4B2AA/nSD6R8V8HxJXQwZuNI+Nu4rY9x7ETIhc3xJ8ROG8OZ0nEDcbuJ3B9NpNZfP4uT4b4nA/GxMibJn6bnxlxLXHVdi+K5+9V4H8Ac6HKw44v5uKUOD3xNe19ADuLIvfnnv3+lZBEJHNhZE0HgtaBey6MeIu16WBw76QvNyXtNfM4vg8uf4tPjZsojx8mHTHFC/QSNr3JJs8Xa1n4KeD5jppcbFEZjIJfM0EE0BsATvxztz3XvfBnw2XPzYWNc4RRSNfIQKrTv95IH2r0X4WPidfIx8YRVHqLXAaS0e3sd+dvY0PmpWTeIzYjXQvbo6ceoOsSHnbelDwyeXHZktdlyRSNJHxTeeC0i/YCSaP2r6PxHxjEwsSCXKmDBM3W1jRepvsAvbceUXwvhTIQC8OY0OJ0k24k+YB/mkG7wj4Vt8YyBFHiOxpKPUD3aiXX6vsJHf2rr+xjnAM/OeGjmvJXNbEHESAOsWaHft32XztH4ipdWv/JI6dPr87HdnfyrY7oPYX6P16uzZAJ7WVGVpTIfk6vD0G+YHYq8bcSXvfN4TXTZLYY9mnk9lgn0RTdEV8ejf/8ANK9J3wefFVOZmzYzXRSjThYWa5jbFwuY5oPnZs+xB6MOMXwwvbmSN3VS0oJfEcbwvOa2Rr43FrRoJI2G+3zea9DEz5cKZoi8HgxsdrbdI25ftAO/dfVYudNlY7YHYb4ntFH4kkNDe1E2m6MzsvJhnb0miXHc0nRxvvvvyufC7wSPxfKZFO4tj0lz2t3JGwB9lXf2LFB4NgxeHZOTPl4kkbGh0kUEwe7ke8Nun8jV5r2/hL4qMdmVj4uY2WTLxHNbCXhpi9YOJHZ22o/8LTP4jj48pjaPWjmIabG4a4Ea++4WeH4M4uNjxNZFI+RgILzIS4V3vy9nZeR4XiZOF4tjSY0MjPCsprjLC9wLo3Vv6ptxG1e78Fpx8mXHzWvyGl+VjyGKGRz7cx3fRfarv2X7lqRcbY45pnQMDpnMcHu1B27hp53Bur9y+X8Ex8HxHKzYvE43ZORHlOc+RxaWlpb2sV3/APfKJ4TgvI8QzcRz2ktPU0SEEluwq/nJ23JXHDIieR8UMbi4Vb47DhoP+r8VZ0oI2vLxNjxsBc1oi9RxAoDbzOw2G+9r2GeMTQNMcQjLSQdY7VXPz7fSg9r4TfBmDJnZk4kMcbYYnFzQTb3dvsWzxAlvhZLTRJZXvsL5+Xxr4V4bH5mHkQTQPBaWEadDeSaLbNbb7cn5uYeVn4XwUyMuLLxTBEA5rHsp1cE3W12eNlM7uPUyMbxKPO6uH0K0lry+iSNjRHkNz9ivbNjzY0mOzHDmyO1jkFwvcgV3G9r22SDLlaBLpjMdW3d1fyVjMzHnhZLC0OkjcYw4Cx3q/aOO3ZAf+MvJfDixmVzXNBBs00Vs4X371+n3Ll2E/BhkA6MRafl6xY/BbcXKZlwiSMOG9FrhRafI+RVzXBwsGwgy/khn6WX7Pw80/JDP0sv2fgvSRBQzGYzHfCDbXAg3zusnhfhz/DIjE3S9vnq3+m1txmyfKcSf7bXe7hehp2Ha0FbtWk6QNVbXwsvpM/oPWtl6dVUfLjlaZC5rHFrbcBsPNZBP60eN0j06Zqugd/L27oOMdmO0EOib2NheiOFhixTDjtjhLmuc7c3sPP6FrjjbGwNbwEHUQ8IgpecgSnptjLKG7nEG/oXNWX+jh+sP4LQiCg+lkbNhBrmzu78F1nXvexAA/2G/vVyIKcv0j0d3ohaJf9wtRZ6XoZeiHqAWNzX3q9EFGN6TpPpAiuxWi9lVL6b1jpEPT7atR9ihyStSIKcT0j0f/ABYYJdRvQdq7d1TgHNMWpwjLXOc4lzjZBOwqvJa0QUS+kdA9ERdWtq1Vv71R/wCM60hLYekbo2b/AL/utbUQZv8AGdN14+ttzZq/o+9Q/wDGdMdN/e/2fj/L61sRBTF6R6VN1AwQ7dOjZ99qgemgSbY55Ll+7la0QU4vX6X+K09QuJ9UbAdgrkRB//Z';

  var FOTOS = {
    'ex-1': fotoLaudo('Lab. São Camilo', 'Hemograma e perfil metabólico', [
      ['Hemoglobina', '13,4 g/dL'], ['Ferritina', '96 ng/mL'],
      ['Glicemia de jejum', '118 mg/dL', '#C4362B'], ['Hb glicada', '7,2 %', '#C4362B'],
      ['Colesterol total', '214 mg/dL', '#C4362B'], ['HDL', '58 mg/dL'],
      ['Vitamina D', '22 ng/mL', '#E27C2C']
    ], '#1F5FBF'),
    'ex-2': fotoLaudo('Lab. Delboni', 'Perfil tireoidiano e glicêmico', [
      ['TSH', '2,6 mUI/L'], ['T4 livre', '1,1 ng/dL'],
      ['Glicemia de jejum', '131 mg/dL', '#C4362B'], ['Hb glicada', '7,8 %', '#C4362B'],
      ['LDL', '162 mg/dL', '#C4362B'], ['Ferritina', '34 ng/mL']
    ], '#0E7490'),
    'ex-3': fotoLaudo('Lab. Fleury', 'Hemograma completo', [
      ['Hemoglobina', '11,8 g/dL', '#E27C2C'], ['Ferritina', '18 ng/mL'],
      ['Glicemia de jejum', '142 mg/dL', '#C4362B'], ['Leucócitos', '7.200 /mm³']
    ], '#5B4B8A')
  };

  function exame(id, tipo, lab, data, params, resumo, origemLab) {
    var c = conta(params, 'C'), a = conta(params, 'A'), n = conta(params, 'N');
    return {
      id: id, tipoExame: tipo, laboratorio: lab, dataExame: data, criadoEm: data,
      status: 'CONCLUIDO',
      statusGeral: c > 0 ? 'CRITICO' : (a > 0 ? 'ATENCAO' : 'NORMAL'),
      totalParametros: params.length, normalCount: n, atencaoCount: a, criticoCount: c,
      origem: origemLab ? 'LABORATORIO' : 'PACIENTE',
      criadoPorPaciente: !origemLab,
      // a miniatura é a foto de um laudo de verdade (arquivo em app-v3/fotos/)
      arquivoUrl: 'fotos/laudo.jpg',
      nomePacienteExame: 'Ana Costa',
      resumoIA: resumo,
      analise: resumo,
      parametros: params
    };
  }

  var EXAMES = [
    exame('ex-1', 'Hemograma completo e perfil metabólico', 'Lab. São Camilo', dias(-12), PARAMS_MAR2026,
      'Esse exame avaliou 12 marcadores do seu corpo. A maioria está dentro da faixa ideal. Alguns valores ligados ao seu metabolismo e ao coração merecem um olhar mais cuidadoso — nada grave, mas vale levar na próxima consulta. A ferritina, que estava baixa em 2024, subiu de forma consistente.', true),
    exame('ex-2', 'Perfil tireoidiano e glicêmico', 'Lab. Delboni', dias(-105), PARAMS_NOV2025,
      'Exame com 6 marcadores. Os hormônios da tireoide estão normais. Os valores de açúcar no sangue estavam acima da faixa nesse momento.', true),
    exame('ex-3', 'Hemograma completo', 'Lab. Fleury', dias(-560), PARAMS_AGO2024,
      'Exame de 2024, enviado por você como foto. Serviu de ponto de partida: a ferritina estava no limite de baixo e a glicemia bem acima.', false)
  ];

  // ──────────────────────────────────────────────────── médicos e consultas
  var MEDICOS = [
    {
      id: 'me-1', nome: 'Dr. Marcos Alves', especialidade: 'Clínico geral',
      crm: 'CRM-SP 128.443', clinica: 'Consultório Vila Mariana', fotoUrl: null,
      telefone: '5511999990001', whatsappHabilitado: true,
      endereco: 'Rua Domingos de Morais, 1.061 — Vila Mariana, São Paulo',
      contatoDisponivel: true, diasAtendimento: ['seg', 'ter', 'qua', 'qui', 'sex'],
      horaInicio: '08:00', horaFim: '18:00',
      agendamentos: [
        { id: 'ag-1', titulo: 'Retorno', tipo: 'RETORNO', dataHora: dias(9), local: 'Rua Domingos de Morais, 1.061 — Vila Mariana',
          medicoNome: 'Dr. Marcos Alves', statusProposta: 'CONFIRMADO',
          recadoPaciente: 'Traz o exame de sangue que você fez no São Camilo. Vamos olhar a glicada junto.',
          lembrete24h: true, confirmadoEm: dias(-3) },
        { id: 'ag-2', titulo: 'Consulta', tipo: 'CONSULTA', dataHora: dias(-24), local: 'Rua Domingos de Morais, 1.061',
          medicoNome: 'Dr. Marcos Alves', statusProposta: 'CONFIRMADO', recadoPaciente: null }
      ],
      documentos: [
        { id: 'doc-1', tipo: 'RECEITA', titulo: 'Receita — Losartana e Sinvastatina', criadoEm: dias(-24), visualizadoEm: dias(-23), url: null },
        { id: 'doc-2', tipo: 'PEDIDO', titulo: 'Pedido de exame — hemograma e perfil metabólico', criadoEm: dias(-24), visualizadoEm: null, url: null }
      ],
      retornoPendente: null,
      totalConsultas: 6
    },
    {
      id: 'me-2', nome: 'Dra. Helena Prado', especialidade: 'Endocrinologista',
      crm: 'CRM-SP 96.210', clinica: 'Clínica Moema', fotoUrl: null,
      telefone: '5511999990002', whatsappHabilitado: false,
      endereco: 'Alameda dos Nhambiquaras, 1.200 — Moema, São Paulo',
      contatoDisponivel: false,
      agendamentos: [
        { id: 'ag-3', titulo: 'Consulta', tipo: 'CONSULTA', dataHora: dias(-96), local: 'Alameda dos Nhambiquaras, 1.200',
          medicoNome: 'Dra. Helena Prado', statusProposta: 'CONFIRMADO', recadoPaciente: null }
      ],
      documentos: [
        { id: 'doc-3', tipo: 'LAUDO', titulo: 'Laudo — avaliação endocrinológica', criadoEm: dias(-96), visualizadoEm: dias(-95), url: null }
      ],
      retornoPendente: {
        id: 'ret-1', statusProposta: 'AGUARDANDO_PACIENTE', contadorTrocas: 0,
        recadoPaciente: 'Podemos remarcar seu acompanhamento? Escolhe o melhor horário pra você.',
        propostasAtuais: [
          { data: dias(16).slice(0, 10), hora: '09:30' },
          { data: dias(18).slice(0, 10), hora: '14:00' },
          { data: dias(23).slice(0, 10), hora: '16:30' }
        ]
      },
      totalConsultas: 2
    }
  ];

  var PRE_CONSULTA = {
    token: 'demo-token-pre-consulta',
    medicoNome: 'Dr. Marcos Alves',
    perguntasFeitas: 7,
    perguntasTotal: 11,
    criadoEm: dias(-2)
  };

  var AUTORIZACOES = [
    { id: 'au-1', medicoNome: 'Dr. Marcos Alves', medicoCrm: 'CRM-SP 128.443', tipo: 'COMPLETO',
      criadoEm: dias(-24), expiraEm: meses(12), ativo: true },
    { id: 'au-2', medicoNome: 'Dra. Helena Prado', medicoCrm: 'CRM-SP 96.210', tipo: 'LEITURA',
      criadoEm: dias(-96), expiraEm: dias(-30), ativo: false }
  ];

  // ──────────────────────────────────────────────────── troca as funções
  var API = window.vitaeAPI;
  var novo = {
    // sessão
    isLoggedIn: function () { return true; },
    getToken: function () { return 'demo-token'; },
    getUsuario: function () { return USUARIO; },
    setUsuario: function (u) { USUARIO = Object.assign({}, USUARIO, u || {}); return USUARIO; },
    jaTemRG: function () { return true; },
    logout: function () { window.location.href = 'demo.html'; },
    login: function () { return ok({ token: 'demo-token', usuario: USUARIO }); },
    cadastro: function () { return ok({ token: 'demo-token', usuario: USUARIO }); },
    loginSocial: function () { return ok({ token: 'demo-token', usuario: USUARIO }); },
    verificarSms: function () { return ok({ token: 'demo-token', usuario: USUARIO }); },
    esqueciSenha: function () { return ok({ ok: true }); },

    // perfil
    getPerfil: function () { return ok({ usuario: USUARIO, perfilSaude: PERFIL, perfil: PERFIL }); },
    buscarPerfil: function () { return ok({ usuario: USUARIO, perfilSaude: PERFIL, perfil: PERFIL }); },
    atualizarPerfil: function (d) { Object.assign(PERFIL, d || {}); return ok({ perfilSaude: PERFIL }); },
    atualizarConta: function (d) { Object.assign(USUARIO, d || {}); return ok({ usuario: USUARIO }); },
    uploadFoto: function (url) { USUARIO.fotoUrl = url; return ok({ fotoUrl: url }); },
    getFlagsApp: function () { return ok(PERFIL.flagsApp || {}); },
    setFlagsApp: function (f) { Object.assign(PERFIL.flagsApp, f || {}); return ok(PERFIL.flagsApp); },

    // alergias
    listarAlergias: function () { return ok({ alergias: ALERGIAS }); },
    adicionarAlergia: function (d) {
      var a = Object.assign({ id: 'al-' + Date.now(), fonte: 'manual', criadoEm: new Date().toISOString() }, d);
      ALERGIAS.push(a); return ok({ alergia: a });
    },
    removerAlergia: function (id) {
      ALERGIAS = ALERGIAS.filter(function (a) { return a.id !== id; }); return ok({ ok: true });
    },
    infoAlergia: function (nome) {
      return ok({ info: { resumo: 'Informação sobre ' + nome + '. Em modo demonstração o texto é fixo.', cuidados: ['Evitar contato', 'Avisar sempre o médico'] } });
    },
    scanAlergia: function () { return ok({ alergias: [{ nome: 'Ibuprofeno', tipo: 'MEDICAMENTO' }] }); },

    // medicamentos
    listarMedicamentos: function () { return ok({ medicamentos: MEDICAMENTOS }); },
    adicionarMedicamento: function (d) {
      var m = Object.assign({ id: 'md-' + Date.now(), ativo: true, fonte: 'manual' }, d);
      MEDICAMENTOS.push(m); return ok({ medicamento: m });
    },
    atualizarMedicamento: function (id, d) {
      MEDICAMENTOS.forEach(function (m) { if (m.id === id) Object.assign(m, d || {}); });
      return ok({ ok: true });
    },
    removerMedicamento: function (id) {
      MEDICAMENTOS = MEDICAMENTOS.filter(function (m) { return m.id !== id; }); return ok({ ok: true });
    },
    infoMedicamento: function (nome) {
      return ok({ info: { resumo: 'Informação sobre ' + nome + '. Em modo demonstração o texto é fixo.', cuidados: ['Tomar no mesmo horário todo dia'] } });
    },
    scanReceita: function () {
      return ok({ medicamentos: [{ nome: 'Omeprazol', dosagem: '20 mg', frequencia: '1x ao dia' }] });
    },

    // exames
    listarExames: function () { return ok({ exames: EXAMES }); },
    getExame: function (id) {
      var e = EXAMES.filter(function (x) { return x.id === id; })[0] || EXAMES[0];
      return ok({ exame: e });
    },
    uploadExame: function () {
      return new Promise(function (res) {
        setTimeout(function () {
          var novoEx = exame('ex-' + Date.now(), 'Exame enviado agora', 'Enviado por você',
            new Date().toISOString(), PARAMS_MAR2026.slice(0, 6),
            'Exame de demonstração. Em modo demo o processamento é instantâneo.', false);
          EXAMES.unshift(novoEx);
          res({ exame: novoEx });
        }, 1200);
      });
    },
    deletarExame: function (id) {
      EXAMES = EXAMES.filter(function (e) { return e.id !== id; }); return ok({ ok: true });
    },

    // consultas e médicos
    listarMeusMedicos: function () { return ok({ medicos: MEDICOS }); },
    listarAgendamentos: function () {
      var todos = [];
      MEDICOS.forEach(function (m) { (m.agendamentos || []).forEach(function (a) { todos.push(Object.assign({ medico: m }, a)); }); });
      return ok({ agendamentos: todos });
    },
    getProximoAgendamento: function () { return ok({ agendamento: MEDICOS[0].agendamentos[0] }); },
    getPreConsultaEmAndamento: function () { return ok({ preConsulta: PRE_CONSULTA }); },
    confirmarRetorno: function () { return ok({ ok: true }); },
    propostaRemarcacao: function () { return ok({ ok: true }); },
    baixarDocumento: function () { return ok({ url: null, mensagem: 'Documento de demonstração' }); },
    getMedicoDoPaciente: function () { return ok({ medico: MEDICOS[0] }); },
    registrarCliqueContato: function () { return ok({ ok: true }); },

    // QR e autorizações
    getQrData: function () {
      return ok({ usuario: USUARIO, perfilSaude: PERFIL, alergias: ALERGIAS, medicamentos: MEDICAMENTOS, url: null });
    },
    listarAutorizacoes: function () { return ok({ autorizacoes: AUTORIZACOES }); },
    autorizarMedico: function (d) {
      var a = Object.assign({ id: 'au-' + Date.now(), ativo: true, criadoEm: new Date().toISOString() }, d);
      AUTORIZACOES.push(a); return ok({ autorizacao: a });
    },
    revogarAutorizacao: function (id) {
      AUTORIZACOES.forEach(function (a) { if (a.id === id) a.ativo = false; }); return ok({ ok: true });
    },

    // score, timeline, notificações
    getScoreAtual: function () {
      return ok({ score: { geral: 74, sono: 68, atividade: 62, produtividade: 80, exames: 79, confianca: 'media', idadeBiologica: 47, idadeCronologica: 45 } });
    },
    getHistoricoScores: function () { return ok({ scores: [] }); },
    getMelhorias: function () { return ok({ melhorias: [] }); },
    recalcularScores: function () { return ok({ ok: true }); },
    getNotificacoes: function () { return ok({ notificacoes: [] }); },
    getTimeline: function () { return ok({ timeline: [] }); },
    getDadosPdf: function () { return ok({ usuario: USUARIO, perfilSaude: PERFIL }); },

    // consentimentos
    registrarConsentimento: function () { return ok({ ok: true }); },
    listarConsentimentos: function () { return ok({ consentimentos: [] }); },
    getStatusConsentimentos: function () { return ok({ status: { TERMOS: true, LGPD: true } }); },

    // pré-consulta
    getPreConsultaPorToken: function () { return ok({ preConsulta: PRE_CONSULTA }); },
    responderPreConsulta: function () { return ok({ ok: true }); },
    responderPreConsultaComAudio: function () { return ok({ ok: true }); },

    // empresa
    getMinhaEmpresa: function () { return ok({ empresa: null }); },
    validarConvite: function () { return ok({ empresa: { nome: 'Empresa de demonstração' } }); },
    vincularEmpresa: function () { return ok({ ok: true }); }
  };

  Object.keys(novo).forEach(function (k) { API[k] = novo[k]; });

  // qualquer método que sobrou e ainda chama a rede: devolve vazio em vez de erro
  Object.keys(API).forEach(function (k) {
    if (typeof API[k] !== 'function' || novo[k]) return;
    var orig = API[k];
    API[k] = function () {
      try {
        var r = orig.apply(API, arguments);
        if (r && typeof r.catch === 'function') return r.catch(function () { return {}; });
        return r;
      } catch (_) { return ok({}); }
    };
  });

  // corta a rede de vez: nada de chamada pendurada
  var _fetch = window.fetch;
  window.fetch = function (url) {
    var u = String(url || '');
    if (u.indexOf('railway.app') >= 0 || u.indexOf('api.vitaidsaude.com') >= 0 || u.indexOf('localhost:3002') >= 0) {
      return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return _fetch.apply(window, arguments);
  };

  // selo discreto pra ninguém confundir com o app de verdade
  window.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('demoTag')) return;
    var t = document.createElement('div');
    t.id = 'demoTag';
    t.textContent = 'DEMONSTRAÇÃO';
    t.style.cssText = 'position:fixed;top:6px;left:50%;transform:translateX(-50%);z-index:99999;' +
      'background:rgba(13,15,20,.78);color:#fff;font:700 8px/1 -apple-system,sans-serif;' +
      'letter-spacing:.14em;padding:4px 9px;border-radius:20px;pointer-events:none;';
    document.body.appendChild(t);
  });

  console.log('[demo] modo demonstração ligado — dados simulados, sem rede');
})();
