/* ============================================================================
   Consultórios, clínicas e médicos do ecossistema — dados da aba Busca
   Usado por 11-busca.html e 11b-consultorio.html
   ============================================================================ */

/* ── FOTOS DE VERDADE
   Quando você tiver as fotos dos consultórios, joga os arquivos em
   app-v3/fotos/ e escreve o nome na lista `fotos` de cada lugar aqui embaixo.
   Exemplo:
       fotos: ['fotos/marcos-1.jpg', 'fotos/marcos-2.jpg', 'fotos/marcos-3.jpg']
   A primeira vira a capa; as outras entram na galeria.
   Enquanto a lista estiver vazia, entra o desenho abaixo no lugar.        */

function fotoDe(x, alta, i) {
  i = i || 0;
  if (x && x.fotos && x.fotos.length) return x.fotos[i % x.fotos.length];
  var w = alta ? 780 : 420, h = alta ? 420 : 264;
  var c1 = x.cor, c2 = x.cor2 || x.cor;
  var s =
   '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 420 264">' +
   '<defs>' +
     '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
       '<stop offset="0" stop-color="'+c1+'"/><stop offset="1" stop-color="'+c2+'"/></linearGradient>' +
     '<linearGradient id="v" x1="0" y1="0" x2="0" y2="1">' +
       '<stop offset="0" stop-color="#FFFFFF" stop-opacity="0.20"/>' +
       '<stop offset="1" stop-color="#000000" stop-opacity="0.16"/></linearGradient>' +
   '</defs>' +
   '<rect width="420" height="264" fill="url(#g)"/>' +
   // piso
   '<rect y="196" width="420" height="68" fill="#FFFFFF" fill-opacity="0.10"/>' +
   // janelas / fachada
   '<rect x="28"  y="46" width="86" height="120" rx="6" fill="#FFFFFF" fill-opacity="0.17"/>' +
   '<rect x="126" y="66" width="66" height="100" rx="6" fill="#FFFFFF" fill-opacity="0.12"/>' +
   '<rect x="300" y="40" width="92" height="126" rx="6" fill="#FFFFFF" fill-opacity="0.15"/>' +
   '<line x1="71" y1="46" x2="71" y2="166" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="2"/>' +
   '<line x1="346" y1="40" x2="346" y2="166" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="2"/>' +
   // balcão
   '<rect x="206" y="132" width="82" height="64" rx="5" fill="#FFFFFF" fill-opacity="0.22"/>' +
   '<rect x="206" y="132" width="82" height="9"  rx="4" fill="#FFFFFF" fill-opacity="0.34"/>' +
   // planta
   '<rect x="356" y="150" width="26" height="46" rx="4" fill="#FFFFFF" fill-opacity="0.24"/>' +
   '<circle cx="369" cy="140" r="18" fill="#FFFFFF" fill-opacity="0.20"/>' +
   // cadeiras da espera
   '<rect x="40"  y="176" width="34" height="10" rx="4" fill="#FFFFFF" fill-opacity="0.26"/>' +
   '<rect x="82"  y="176" width="34" height="10" rx="4" fill="#FFFFFF" fill-opacity="0.26"/>' +
   '<rect x="124" y="176" width="34" height="10" rx="4" fill="#FFFFFF" fill-opacity="0.26"/>' +
   // a cruz da saúde
   '<g opacity="0.9">' +
     '<rect x="228" y="52" width="38" height="12" rx="6" fill="#FFFFFF" fill-opacity="0.55"/>' +
     '<rect x="241" y="39" width="12" height="38" rx="6" fill="#FFFFFF" fill-opacity="0.55"/>' +
   '</g>' +
   '<rect width="420" height="264" fill="url(#v)"/>' +
   '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
}

/* ── o retrato de um médico (usa a foto quando existir) */
function retratoDe(nome, cor, foto) {
  if (foto) return foto;
  var ini = nome.replace(/^Dr[a]?\.\s*/, '').split(' ').slice(0, 2)
              .map(function (p) { return p[0]; }).join('').toUpperCase();
  var s =
   '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">' +
   '<rect width="160" height="160" fill="'+cor+'"/>' +
   '<circle cx="80" cy="62" r="26" fill="#FFFFFF" fill-opacity="0.28"/>' +
   '<path d="M26 160 q0 -46 54 -46 t54 46 z" fill="#FFFFFF" fill-opacity="0.28"/>' +
   '<text x="80" y="150" font-family="Helvetica,Arial" font-size="26" font-weight="bold" ' +
   'text-anchor="middle" fill="#FFFFFF" fill-opacity="0.0">'+ini+'</text>' +
   '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
}

/* WhatsApp do concierge — na demonstração todos caem no mesmo número.
   Quando cada consultório tiver o seu, é só pôr um campo `whatsapp` no
   lugar dele aqui embaixo que ele passa a valer no lugar deste. */
var WHATSAPP_PADRAO = '5519996471503';

function whatsappDe(x) {
  var num = (x && x.whatsapp) || WHATSAPP_PADRAO;
  var msg = 'Olá! Vim pelo app RG Saúde e queria falar com ' + ((x && x.nome) || 'vocês') + '.';
  return 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg);
}

var LOCAIS = [
  {
    id: 'marcos', tipo: 'medico',
    nome: 'Dr. Marcos Alves', especialidade: 'Clínico geral', registro: 'CRM-SP 128.443',
    sub: 'Consultório próprio', nota: 4.9, avaliacoes: 84, km: 1.2, bairro: 'Vila Mariana',
    endereco: 'Rua Domingos de Morais, 1.061 · Vila Mariana, São Paulo',
    planos: ['Unimed Nacional', 'Bradesco Saúde', 'Particular'],
    hoje: true, preco: 320, cor: '#2563EB', cor2: '#4C8AF0',
    fotos: ['fotos/consultorio-1.jpg','fotos/consultorio-5.jpg','fotos/consultorio-7.jpg','fotos/consultorio-8.jpg'],
    sobre: 'Atende clínica geral há 18 anos no mesmo endereço. Consulta de 40 minutos, com pré-consulta enviada pelo WhatsApp antes de você chegar.',
    horarios: 'Segunda a sexta · 08h às 18h',
    tempoMedio: 'Costuma responder em 12 minutos',
    equipe: [
      { nome: 'Dr. Marcos Alves', papel: 'Clínico geral · CRM-SP 128.443', cor: '#2563EB', foto: 'fotos/medico-1.jpg' },
      { nome: 'Renata Lima', papel: 'Recepção', cor: '#8A93A0', foto: 'fotos/medico-2.jpg' }
    ],
    comentarios: [
      { autor: 'Beatriz O.', quando: 'há 3 dias', nota: 5,
        txt: 'Cheguei e ele já sabia tudo que eu tinha respondido antes. Não precisei repetir nada. A consulta rendeu muito mais.' },
      { autor: 'Antônio P.', quando: 'há 2 semanas', nota: 5,
        txt: 'Explica com calma e não tem pressa. Minha filha conseguiu acompanhar tudo pelo aplicativo depois.' },
      { autor: 'Rui M.', quando: 'há 1 mês', nota: 4,
        txt: 'Ótimo atendimento. A sala de espera é pequena, mas nunca esperei mais que 10 minutos.' }
    ]
  },
  {
    id: 'sofia', tipo: 'medico',
    nome: 'Dra. Sofia Antunes', especialidade: 'Clínico geral', registro: 'CRM-SP 121.089',
    sub: 'Consultório próprio', nota: 4.9, avaliacoes: 52, km: 2.4, bairro: 'Ipiranga',
    endereco: 'Rua Bom Pastor, 480 · Ipiranga, São Paulo',
    planos: ['Unimed Nacional', 'SulAmérica', 'Particular'],
    hoje: false, preco: 300, cor: '#6040BE', cor2: '#8C6BE0',
    fotos: ['fotos/consultorio-8.jpg','fotos/consultorio-2.jpg','fotos/consultorio-1.jpg','fotos/consultorio-5.jpg'],
    sobre: 'Foco em acompanhamento de doenças crônicas. Retorno sempre agendado na saída da consulta.',
    horarios: 'Terça a sábado · 09h às 17h',
    tempoMedio: 'Costuma responder em 40 minutos',
    equipe: [{ nome: 'Dra. Sofia Antunes', papel: 'Clínico geral · CRM-SP 121.089', cor: '#6040BE', foto: 'fotos/medico-2.jpg' }],
    comentarios: [
      { autor: 'Marta N.', quando: 'há 1 semana', nota: 5,
        txt: 'Foi a primeira médica que olhou meus exames antigos junto com os novos. Fez diferença.' },
      { autor: 'Cida F.', quando: 'há 3 semanas', nota: 5,
        txt: 'Muito atenciosa. Saí com tudo anotado no aplicativo, não perdi nenhum papel.' }
    ]
  },
  {
    id: 'helena', tipo: 'medico',
    nome: 'Dra. Helena Prado', especialidade: 'Endocrinologista', registro: 'CRM-SP 96.210',
    sub: 'Clínica Moema', nota: 4.8, avaliacoes: 61, km: 2.8, bairro: 'Moema',
    endereco: 'Alameda dos Nhambiquaras, 1.200 · Moema, São Paulo',
    planos: ['Bradesco Saúde', 'Particular'],
    hoje: true, preco: 420, cor: '#0E7490', cor2: '#2AA5B8',
    fotos: ['fotos/consultorio-4.jpg','fotos/consultorio-5.jpg','fotos/consultorio-7.jpg','fotos/consultorio-2.jpg'],
    sobre: 'Endocrinologia com foco em diabetes tipo 2 e tireoide. Trabalha com metas trimestrais e revisão de exames a cada consulta.',
    horarios: 'Segunda, quarta e sexta · 13h às 19h',
    tempoMedio: 'Costuma responder em 2 horas',
    equipe: [
      { nome: 'Dra. Helena Prado', papel: 'Endocrinologista · CRM-SP 96.210', cor: '#0E7490', foto: 'fotos/medico-2.jpg' },
      { nome: 'Dr. Caio Bertoldo', papel: 'Nutrólogo · CRM-SP 154.902', cor: '#1C8548', foto: 'fotos/medico-1.jpg' }
    ],
    comentarios: [
      { autor: 'Ana C.', quando: 'há 3 meses', nota: 5,
        txt: 'Ela pediu pra eu levar os exames dos últimos dois anos. Eu já tinha tudo no aplicativo, foi só mostrar o QR.' },
      { autor: 'Pedro G.', quando: 'há 4 meses', nota: 4,
        txt: 'Excelente médica. Só não atende Unimed, o que pra mim ficou caro.' }
    ]
  },
  {
    id: 'rafael', tipo: 'medico',
    nome: 'Dr. Rafael Nunes', especialidade: 'Cardiologista', registro: 'CRM-SP 143.775',
    sub: 'Consultório próprio', nota: 4.7, avaliacoes: 97, km: 4.1, bairro: 'Saúde',
    endereco: 'Rua Vergueiro, 4.455 · Saúde, São Paulo',
    planos: ['Amil', 'Particular'],
    hoje: false, preco: 450, cor: '#B4405E', cor2: '#D9738C',
    fotos: ['fotos/consultorio-7.jpg','fotos/consultorio-3.jpg','fotos/consultorio-8.jpg','fotos/consultorio-4.jpg'],
    sobre: 'Cardiologia clínica e check-up. Faz eletrocardiograma no próprio consultório.',
    horarios: 'Segunda a quinta · 08h às 16h',
    tempoMedio: 'Costuma responder em 1 hora',
    equipe: [{ nome: 'Dr. Rafael Nunes', papel: 'Cardiologista · CRM-SP 143.775', cor: '#B4405E', foto: 'fotos/medico-1.jpg' }],
    comentarios: [
      { autor: 'Otávio R.', quando: 'há 2 semanas', nota: 5,
        txt: 'Fez o eletro na hora e já me explicou o traçado. Não precisei voltar outro dia.' }
    ]
  },
  {
    id: 'digimax', tipo: 'clinica',
    nome: 'Digimax Saúde', especialidade: '', sub: 'Rede clínica · 12 unidades', registro: '',
    nota: 4.8, avaliacoes: 2140, km: 2.0, bairro: 'unidade Paraíso',
    endereco: 'Rua Vergueiro, 1.855 · Paraíso, São Paulo',
    planos: ['Unimed Nacional', 'Bradesco Saúde', 'SulAmérica', 'Amil', 'Particular'],
    hoje: true, preco: 180, cor: '#1C8548', cor2: '#3FBE7A',
    fotos: ['fotos/consultorio-2.jpg','fotos/consultorio-7.jpg','fotos/consultorio-5.jpg','fotos/consultorio-4.jpg'],
    sobre: 'Rede com 12 unidades em São Paulo. Consulta, exame de imagem e coleta de sangue no mesmo lugar — o resultado cai direto no seu RG.',
    horarios: 'Todos os dias · 06h às 20h · coleta até 11h',
    tempoMedio: 'Costuma responder na hora',
    equipe: [
      { nome: 'Dra. Cláudia Reis', papel: 'Coordenadora clínica · CRM-SP 88.410', cor: '#1C8548', foto: 'fotos/medico-2.jpg' },
      { nome: 'Dr. Vitor Sampaio', papel: 'Radiologista · CRM-SP 132.008', cor: '#0E7490', foto: 'fotos/medico-1.jpg' },
      { nome: 'Dr. Enzo Marchetti', papel: 'Clínico geral · CRM-SP 160.771', cor: '#2563EB', foto: 'fotos/medico-1.jpg' }
    ],
    comentarios: [
      { autor: 'Camila R.', quando: 'há 4 dias', nota: 5,
        txt: 'Fiz a coleta às 7h e o resultado apareceu no aplicativo no fim da tarde. Não precisei ligar nem pegar papel.' },
      { autor: 'João R.', quando: 'há 1 semana', nota: 5,
        txt: 'Fila rápida e a recepção já sabia meu convênio. O laudo veio com código pra abrir no app.' },
      { autor: 'Marina S.', quando: 'há 3 semanas', nota: 4,
        txt: 'Estrutura ótima. Só o estacionamento que é apertado no horário de pico.' }
    ]
  },
  {
    id: 'delta', tipo: 'clinica',
    nome: 'Clínica Delta', especialidade: '', sub: 'Rede clínica · 4 unidades', registro: '',
    nota: 4.6, avaliacoes: 380, km: 3.6, bairro: 'unidade Saúde',
    endereco: 'Av. Jabaquara, 1.320 · Saúde, São Paulo',
    planos: ['Unimed Nacional', 'Particular'],
    hoje: false, preco: 210, cor: '#5B4B8A', cor2: '#8A76C4',
    fotos: ['fotos/consultorio-5.jpg','fotos/consultorio-8.jpg','fotos/consultorio-3.jpg','fotos/consultorio-6.jpg'],
    sobre: 'Clínica de imagem: ultrassom, raio-x e densitometria. Laudo assinado em até 24 horas.',
    horarios: 'Segunda a sábado · 07h às 19h',
    tempoMedio: 'Costuma responder em 3 horas',
    equipe: [
      { nome: 'Dra. Teresa Vilar', papel: 'Radiologista · CRM-SP 74.559', cor: '#5B4B8A', foto: 'fotos/medico-2.jpg' },
      { nome: 'Dr. Ivo Krause', papel: 'Ultrassonografista · CRM-SP 118.223', cor: '#0E7490', foto: 'fotos/medico-1.jpg' }
    ],
    comentarios: [
      { autor: 'Ana C.', quando: 'há 8 meses', nota: 5,
        txt: 'Fiz o ultrassom de tireoide aqui. O laudo chegou no aplicativo antes de eu chegar em casa.' },
      { autor: 'Sérgio A.', quando: 'há 1 ano', nota: 4,
        txt: 'Atendimento bom, mas demorou um pouco pra chamar.' }
    ]
  }
];

/* o desenho, ignorando as fotos — serve de rede de segurança quando o
   arquivo da foto não está na pasta ainda */
function desenhoDe(x, alta) {
  var c = {}; for (var k in x) c[k] = x[k];
  c.fotos = null;
  return fotoDe(c, alta);
}

function localPorId(id) {
  for (var i = 0; i < LOCAIS.length; i++) if (LOCAIS[i].id === id) return LOCAIS[i];
  return null;
}
