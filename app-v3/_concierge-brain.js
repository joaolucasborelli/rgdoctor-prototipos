/* ============================================================================
   CONCIERGE — a inteligência que responde na aba
   ----------------------------------------------------------------------------
   Duas camadas:

   1) MODELO REAL (opcional). Se existir uma chave salva, a resposta vem de um
      modelo de verdade, com os dados da paciente no contexto. Para ligar, no
      console do navegador:
          ConciergeBrain.usarModelo('sk-...')            // OpenAI
          ConciergeBrain.usarModelo('sk-...', 'https://api.openai.com/v1', 'gpt-4o-mini')
      Para desligar: ConciergeBrain.semModelo()

   2) CÉREBRO LOCAL (padrão). Funciona sem internet e sem chave. Conhece a ficha
      inteira da paciente — exames, biomarcadores com histórico, medicamentos,
      alergias, condições e consultas — e responde em cima dela.

   A REGRA CLÍNICA, nas duas camadas: explica o valor, a faixa e a evolução.
   Nunca diz o que aquilo significa como diagnóstico. Isso é do médico.
   ============================================================================ */
(function (global) {
  'use strict';

  // ══════════════════════════════ a ficha da paciente
  var F = {
    nome: 'Ana', idade: 45, sexo: 'feminino', sangue: 'O+', plano: 'Unimed Nacional',
    condicoes: [
      { nome: 'Diabetes tipo 2', desde: 2021 },
      { nome: 'Hipertensão', desde: 2019 }
    ],
    alergias: [
      { nome: 'Dipirona', tipo: 'medicamento', reacao: 'inchaço nos lábios e falta de ar' },
      { nome: 'Frutos do mar', tipo: 'alimento', reacao: 'manchas vermelhas e coceira' },
      { nome: 'Poeira', tipo: 'ambiental', reacao: 'espirros e nariz entupido' }
    ],
    remedios: [
      { nome: 'Losartana', dose: '50 mg', hora: '08:00', motivo: 'pressão alta' },
      { nome: 'Metformina', dose: '850 mg', hora: '12:00 e 20:00', motivo: 'diabetes tipo 2' },
      { nome: 'Sinvastatina', dose: '20 mg', hora: '22:00', motivo: 'colesterol' }
    ],
    medico: 'Dr. Marcos Alves', especialidade: 'clínico geral',
    proximaConsulta: 'daqui a nove dias, com o Dr. Marcos',
    ultimoExame: '12 dias atrás, no Lab. São Camilo',
    // biomarcadores: valor de hoje, faixa, e o histórico
    marcadores: {
      ferritina:   { nome:'Ferritina', v:96, un:'ng/mL', ref:'15 a 150', st:'normal',
        hist:[['ago/2024',18],['nov/2025',34],['hoje',96]],
        oq:'A ferritina é o estoque de ferro do seu corpo — é de onde ele tira ferro quando precisa.' },
      hemoglobina: { nome:'Hemoglobina', v:13.4, un:'g/dL', ref:'12,0 a 15,5', st:'normal',
        hist:[['ago/2024',11.8],['hoje',13.4]],
        oq:'A hemoglobina é o que carrega oxigênio no sangue.' },
      glicemia:    { nome:'Glicemia de jejum', v:118, un:'mg/dL', ref:'70 a 99', st:'acima',
        hist:[['ago/2024',142],['nov/2025',131],['hoje',118]],
        oq:'É o açúcar no sangue depois de algumas horas sem comer.' },
      glicada:     { nome:'Hemoglobina glicada', v:7.2, un:'%', ref:'até 6,5', st:'acima',
        hist:[['nov/2025',7.8],['hoje',7.2]],
        oq:'É a média do seu açúcar no sangue dos últimos três meses.' },
      colesterol:  { nome:'Colesterol total', v:214, un:'mg/dL', ref:'até 190', st:'acima',
        hist:[['hoje',214]],
        oq:'É a soma de todos os tipos de colesterol no seu sangue.' },
      ldl:         { nome:'LDL', v:138, un:'mg/dL', ref:'até 130', st:'acima',
        hist:[['nov/2025',162],['hoje',138]],
        oq:'É o colesterol que se acumula na parede das artérias.' },
      hdl:         { nome:'HDL', v:58, un:'mg/dL', ref:'acima de 40', st:'normal',
        hist:[['hoje',58]],
        oq:'É o colesterol que ajuda a limpar as artérias.' },
      triglicerideos:{ nome:'Triglicerídeos', v:142, un:'mg/dL', ref:'até 150', st:'normal',
        hist:[['hoje',142]],
        oq:'É a gordura que circula no sangue.' },
      tsh:         { nome:'TSH', v:2.1, un:'mUI/L', ref:'0,4 a 4,0', st:'normal',
        hist:[['nov/2025',2.6],['hoje',2.1]],
        oq:'É o hormônio que comanda a tireoide.' },
      vitaminad:   { nome:'Vitamina D', v:22, un:'ng/mL', ref:'30 a 100', st:'abaixo',
        hist:[['hoje',22]],
        oq:'A vitamina D participa da absorção de cálcio e do funcionamento da imunidade.' },
      creatinina:  { nome:'Creatinina', v:0.9, un:'mg/dL', ref:'0,6 a 1,1', st:'normal',
        hist:[['hoje',0.9]],
        oq:'Mostra como os rins estão filtrando o sangue.' },
      leucocitos:  { nome:'Leucócitos', v:6800, un:'/mm³', ref:'4.000 a 11.000', st:'normal',
        hist:[['ago/2024',7200],['hoje',6800]],
        oq:'São as células de defesa do seu corpo.' }
    }
  };

  var APELIDOS = {
    ferritina:['ferritina','ferro','anemia'],
    hemoglobina:['hemoglobina','hb'],
    glicemia:['glicemia','glicose','açúcar','acucar','açucar'],
    glicada:['glicada','hba1c','a1c','hemoglobina glicada'],
    colesterol:['colesterol total','colesterol'],
    ldl:['ldl','colesterol ruim','colesterol rui'],
    hdl:['hdl','colesterol bom'],
    triglicerideos:['triglicer','triglicérides','triglicerides'],
    tsh:['tsh','tireoide','tireóide'],
    vitaminad:['vitamina d','vit d','vitd'],
    creatinina:['creatinina','rim','rins'],
    leucocitos:['leucócito','leucocito','defesa','imunidade']
  };

  // ══════════════════════════════ utilidades
  function limpa(s){
    return String(s||'').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }
  function tem(t, arr){ return arr.some(function(w){ return t.indexOf(limpa(w))>=0; }); }
  function num(n){ return String(n).replace('.', ','); }

  function achaMarcador(t){
    for (var k in APELIDOS){
      if (APELIDOS[k].some(function(a){ return t.indexOf(limpa(a))>=0; })) return F.marcadores[k];
    }
    return null;
  }

  function frasePos(m){
    if (m.st==='normal') return 'está **dentro** da faixa do laboratório';
    if (m.st==='acima')  return 'está **acima** da faixa do laboratório';
    return 'está **abaixo** da faixa do laboratório';
  }

  function evolucao(m){
    if (!m.hist || m.hist.length<2) return '';
    var linhas = m.hist.map(function(h){ return h[0]+': '+num(h[1])+' '+m.un; }).join('\n');
    var pri=m.hist[0][1], ult=m.hist[m.hist.length-1][1];
    var dir = ult>pri ? 'subiu' : (ult<pri ? 'caiu' : 'ficou estável');
    return '\n\nComo foi no tempo:\n'+linhas+'\n\nDe lá pra cá '+dir+'.';
  }

  function cartaoMarcador(m){
    var r = 'Sua **'+m.nome.toLowerCase()+'** hoje é **'+num(m.v)+' '+m.un+'**. '
          + 'A faixa de referência do laboratório é de '+m.ref+', então '+frasePos(m)+'.';
    r += '\n\n'+m.oq;
    r += evolucao(m);
    r += '\n\n---\n\nO que esse número significa pro seu caso é o '+F.medico+' quem vê. '
       + 'Eu deixei o valor, a faixa e o histórico organizados pra vocês olharem juntos na consulta.';
    return r;
  }

  // ══════════════════════════════ o cérebro local
  function local(pergunta, historico){
    var t = limpa(pergunta);

    // saudação
    if (/^(oi|ola|opa|bom dia|boa tarde|boa noite|e ai|eai|hey|hi)\b/.test(t) && t.length<30){
      return 'Oi, '+F.nome+'. Sou o Concierge do seu RG Saúde.\n\n'
           + 'Tenho aqui seus três exames, seus '+F.remedios.length+' medicamentos, suas '+F.alergias.length+' alergias '
           + 'e suas consultas com o '+F.medico+'.\n\nO que você quer saber?';
    }

    // quem é você
    if (tem(t,['quem e voce','o que voce faz','como funciona','voce e um medico','você é médico','vc é medico'])){
      return 'Eu sou o Concierge — a parte do RG Saúde que conversa com você.\n\n'
           + 'Eu leio seus exames, organizo tudo num lugar só, explico o que cada valor mede e preparo '
           + 'o resumo que você leva pra consulta.\n\n'
           + 'O que eu **não** faço é diagnosticar nem receitar. Isso é do '+F.medico+'. '
           + 'Eu preparo o caso; ele decide.';
    }

    // um marcador específico
    var m = achaMarcador(t);
    if (m){
      if (tem(t,['ruim','grave','preocupa','perigoso','normal?','ta bom','tá bom','esta bom'])){
        var r = cartaoMarcador(m);
        if (m.st!=='normal'){
          r = 'Vou te dar o número e o contexto, que é o que eu posso fazer.\n\n---\n\n'+r;
        }
        return r;
      }
      if (tem(t,['melhorou','piorou','evolu','historico','histórico','comparar','antes','subiu','caiu'])){
        var e = evolucao(m).replace(/^\n\n/,'');
        if (!e) return 'Só tenho um resultado de **'+m.nome.toLowerCase()+'** até agora: '+num(m.v)+' '+m.un+
                       ' (faixa: '+m.ref+'). Quando vier o próximo, eu comparo os dois automaticamente.';
        return e+'\n\n---\n\nValor de hoje: **'+num(m.v)+' '+m.un+'**, e '+frasePos(m)+' ('+m.ref+').';
      }
      if (tem(t,['o que fazer','como melhor','como resolver','o que eu faco','dica'])){
        return cartaoMarcador(m)+'\n\n---\n\nPra saber o que fazer com isso, vale abrir a aba **Documentos**, '
             + 'entrar nesse exame e tocar em **Ver melhorias** — lá eu deixei a trajetória de 30 e 90 dias.';
      }
      return cartaoMarcador(m);
    }

    // medicamentos
    if (tem(t,['remedio','remédio','medicamento','tomo','tomar','posologia','receita'])){
      var lista = F.remedios.map(function(r){
        return '• **'+r.nome+' '+r.dose+'** — '+r.hora+' ('+r.motivo+')';
      }).join('\n');
      return 'Hoje você toma três:\n\n'+lista+'\n\n---\n\nTudo isso está na aba **Meu RG**, '
           + 'com o horário de cada um. Se algum mudou, me fala que eu atualizo.';
    }

    // alergias
    if (tem(t,['alergia','alergica','alérgica','posso tomar','dipirona','novalgina'])){
      var la = F.alergias.map(function(a){
        return '• **'+a.nome+'** ('+a.tipo+') — '+a.reacao;
      }).join('\n');
      var extra='';
      if (t.indexOf('dipirona')>=0 || t.indexOf('novalgina')>=0){
        extra = '\n\n---\n\n⚠️ Atenção: **Novalgina é dipirona**. Você tem alergia registrada a dipirona, '
              + 'com inchaço nos lábios e falta de ar. Não tome sem falar com o '+F.medico+'.';
      }
      return 'Suas alergias registradas:\n\n'+la+extra;
    }

    // exames em geral / resumo
    if (tem(t,['exame','resultado','laudo','hemograma','resumo','ultimo exame','último exame'])){
      return 'Seu exame mais recente é de '+F.ultimoExame+' — 12 marcadores no total.\n\n'
           + 'Dentro da faixa: ferritina, hemoglobina, HDL, triglicerídeos, TSH, creatinina e leucócitos.\n'
           + 'Acima da faixa: glicemia de jejum (118), hemoglobina glicada (7,2%), colesterol total (214) e LDL (138).\n'
           + 'Abaixo da faixa: vitamina D (22).\n\n---\n\n'
           + 'Quer que eu abra algum desses? É só falar o nome. '
           + 'E se quiser ver tudo com gráfico, está na aba **Documentos**.';
    }

    // consulta
    if (tem(t,['consulta','medico','médico','marcar','retorno','agendar','quando'])){
      return 'Sua próxima consulta é '+F.proximaConsulta+'.\n\n'
           + 'Ele deixou um recado: *traz o exame de sangue que você fez no São Camilo, vamos olhar a glicada junto.*\n\n'
           + '---\n\nJá montei o resumo de uma página com os três exames em ordem, pra você levar.';
    }

    // condições
    if (tem(t,['diabete','pressao','pressão','hipertens','condicao','condição','doenca','doença'])){
      var lc = F.condicoes.map(function(c){ return '• **'+c.nome+'** — desde '+c.desde; }).join('\n');
      return 'No seu RG estão registradas:\n\n'+lc+'\n\n'
           + 'Os remédios que você toma hoje conversam com as duas: losartana pra pressão, metformina pro diabetes.';
    }

    // dados pessoais
    if (tem(t,['meu sangue','tipo sanguineo','tipo sanguíneo','minha idade','quantos anos','meu plano','convenio','convênio'])){
      return 'Do seu RG: **'+F.idade+' anos**, sangue **'+F.sangue+'**, plano **'+F.plano+'**.\n\n'
           + 'Contato de emergência: Roberto Costa (marido) e Marina Costa (filha).';
    }

    // "isso é ruim?" sem contexto — olha a última coisa falada
    if (tem(t,['isso e ruim','isso é ruim','e ruim','é ruim','e grave','é grave','me preocupo','devo me preocupar'])){
      for (var i=historico.length-1;i>=0;i--){
        var mm = achaMarcador(limpa(historico[i].texto||''));
        if (mm) return cartaoMarcador(mm);
      }
      return 'Depende de qual valor você está olhando. Me fala o nome do marcador — ferritina, glicada, '
           + 'colesterol, vitamina D — que eu te mostro o número, a faixa e como ele mudou no tempo.';
    }

    // pedido de diagnóstico — a linha que não se cruza
    if (tem(t,['o que eu tenho','qual a doenca','qual a doença','sera que e','será que é','diagnostico','diagnóstico','estou com'])){
      return 'Essa é a pergunta que eu não posso responder — e não é falta de dado, é a regra.\n\n'
           + 'Eu organizo o que você tem e explico o que cada número mede. Quem junta tudo e diz o que é '
           + 'precisa ser o '+F.medico+'.\n\n---\n\n'
           + 'O que eu posso fazer agora: montar o resumo com os valores que estão fora da faixa e o histórico deles, '
           + 'pra você levar na consulta '+F.proximaConsulta.replace('daqui a ','daqui a ')+'.';
    }

    // urgência
    if (tem(t,['dor no peito','falta de ar','desmai','sangrando','emergencia','emergência','socorro','passando mal'])){
      return '⚠️ Se você está sentindo isso **agora**, não espera por mim.\n\n'
           + 'Procura um pronto-atendimento ou liga **192** (SAMU).\n\n---\n\n'
           + 'Seu RG está no celular — o QR Code na aba **QR Code** mostra suas alergias e seus remédios '
           + 'pra quem for te atender. Sua alergia a dipirona está lá.';
    }

    // agradecimento
    if (tem(t,['obrigad','valeu','vlw','brigad'])){
      return 'Por nada, '+F.nome+'. Estou aqui a qualquer hora — inclusive de madrugada.';
    }

    // fallback: reconhece que não sabe, mas oferece o que sabe
    return 'Não achei isso na sua ficha, então prefiro não chutar.\n\n'
         + 'O que eu tenho aqui do seu RG: os **12 marcadores** do exame de '+F.ultimoExame+', '
         + 'seus **três remédios** de hoje, suas **três alergias**, suas condições em acompanhamento '
         + 'e a consulta '+F.proximaConsulta+'.\n\n---\n\n'
         + 'Pode perguntar de qualquer um desses pelo nome que eu te respondo com o número e o histórico. '
         + 'E se for uma dúvida clínica de verdade, ela entra no resumo que vai pro '+F.medico+'.';
  }

  // ══════════════════════════════ modelo real (opcional)
  var CFG = {
    chave: null, base: 'https://api.openai.com/v1', modelo: 'gpt-4o-mini'
  };
  try {
    var s = localStorage.getItem('vitae_concierge_modelo');
    if (s) CFG = Object.assign(CFG, JSON.parse(s));
  } catch (_) {}

  var SISTEMA =
    'Você é o Concierge do RG Saúde, um assistente de saúde brasileiro que conversa por texto com a paciente.\n\n' +
    'A FICHA DELA (use sempre, é a fonte da verdade):\n' + JSON.stringify(F) + '\n\n' +
    'REGRAS ABSOLUTAS:\n' +
    '1. Você NUNCA diagnostica, nunca receita e nunca diz o que a pessoa "tem". Se pedirem, explique com ' +
    'gentileza que quem junta tudo e decide é o médico dela, e ofereça preparar o resumo pra consulta.\n' +
    '2. Você explica o que cada exame mede, mostra o valor, a faixa de referência e como mudou no tempo.\n' +
    '3. Fale em português do Brasil, direto e acolhedor. Frases curtas. Sem jargão.\n' +
    '4. Nunca use emoji, exceto ⚠️ em situação de urgência real.\n' +
    '5. Use **negrito** só em números e nomes de exame.\n' +
    '6. Para separar a resposta em mais de uma bolha, use uma linha com apenas ---\n' +
    '7. Se a pergunta for de urgência (dor no peito, falta de ar, desmaio), oriente procurar ' +
    'pronto-atendimento ou ligar 192 antes de qualquer outra coisa.\n' +
    '8. Respostas curtas: no máximo 5 linhas por bolha.';

  async function modelo(pergunta, historico){
    var msgs = [{ role:'system', content: SISTEMA }];
    historico.slice(-8).forEach(function(h){
      msgs.push({ role: h.de==='paciente' ? 'user' : 'assistant', content: h.texto });
    });
    msgs.push({ role:'user', content: pergunta });

    var r = await fetch(CFG.base + '/chat/completions', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+CFG.chave },
      body: JSON.stringify({ model: CFG.modelo, messages: msgs, temperature: 0.4, max_tokens: 500 })
    });
    if (!r.ok) throw new Error('modelo respondeu ' + r.status);
    var d = await r.json();
    return (d.choices && d.choices[0] && d.choices[0].message.content) || '';
  }

  // ══════════════════════════════ a porta de entrada
  global.ConciergeBrain = {
    ficha: F,

    async responder(pergunta, historico){
      historico = historico || [];
      if (CFG.chave){
        try { return await modelo(pergunta, historico); }
        catch (e){ console.warn('[concierge] modelo falhou, usando o cérebro local:', e.message); }
      }
      // pausa curta pra parecer que pensou
      await new Promise(function(r){ setTimeout(r, 700 + Math.random()*700); });
      return local(pergunta, historico);
    },

    respostaAnexo(nome){
      var n = limpa(nome);
      if (n.indexOf('.pdf')>=0 || n.indexOf('exame')>=0 || n.indexOf('hemograma')>=0){
        return 'Li e já guardei junto com os seus. Está na aba **Documentos**, com a data.\n\n---\n\n'
             + 'Em modo demonstração eu não leio o arquivo de verdade — no app, cada valor entra estruturado '
             + 'e passa a ser comparável com os exames que você já tinha.';
      }
      return 'Recebi e guardei no seu RG.\n\n---\n\n'
           + 'Em modo demonstração eu não leio a imagem de verdade. No app, se for um laudo ou uma receita, '
           + 'eu extraio cada campo e ele vira dado comparável dentro da aba **Documentos**.';
    },

    usarModelo(chave, base, nomeModelo){
      CFG.chave = chave;
      if (base) CFG.base = base;
      if (nomeModelo) CFG.modelo = nomeModelo;
      try { localStorage.setItem('vitae_concierge_modelo', JSON.stringify(CFG)); } catch(_){}
      console.log('[concierge] modelo real ligado:', CFG.modelo);
      return 'ok';
    },
    semModelo(){
      CFG.chave = null;
      try { localStorage.removeItem('vitae_concierge_modelo'); } catch(_){}
      console.log('[concierge] voltou pro cérebro local');
      return 'ok';
    }
  };
})(window);
