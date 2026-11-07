'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const temperatures = [0, .5, 1, 1.5];
  const colors = ['#89c6b3', '#f4ba57', '#e6856d', '#89b4d0', '#b1a3c8', '#b4c87b', '#c3987c', '#95b6b0', '#ccae65', '#baaf9e'];
  const modelDefault = 'qwen3.5:2b-q4_K_M';
  const examples = ['La capital de Chile es', 'En el cielo nocturno brillan las', 'El gato duerme sobre la', 'Una científica encontró un misterioso', 'Había una vez un dragón que'];
  const titles = {
    predict: ['01', '¿Qué viene después?', 'Haz una apuesta. Después mira las posibilidades que calcula la IA.'],
    context: ['02', 'Una palabra cambia todo', '¿Cómo cambia lo que predice la IA cuando cambiamos el comienzo de una frase?'],
    temperature: ['03', 'Prueba otra temperatura', 'Mismo inicio. Distintas selecciones. ¿Qué diferencias observas?'],
    story: ['04', 'Ahora tú eres la IA', 'Las posibilidades las calcula el modelo. El camino lo eliges tú.'],
    bet: ['05', 'Apuesta por el siguiente token', 'Confirma tu elección. Después el modelo genera un token y compruebas si acertaste.']
  };
  let mode = 'predict', busy = false, generation = 0, activeController = null;
  let statusData = null, topCount = 10, results = {}, samples = {}, ledger = [], events = [];
  let story = {seed: examples[4], actions: [], result: null, started: false};
  let betting = {rounds: [], current: null};

  const node = (tag, cls, text) => { const n=document.createElement(tag); if(cls)n.className=cls; if(text!==undefined)n.textContent=text; return n; };
  const fmt = (n,d=1) => n.toLocaleString('es-CL',{minimumFractionDigits:d,maximumFractionDigits:d});
  const percent = p => p>0&&p<.0001?'<0,01 %':fmt(p*100,p>0&&p<.01?2:1)+' %';
  const tokenKey = t => t.id == null ? JSON.stringify([t.token,t.bytes]) : 'id:'+t.id;
  const chosenT = () => temperatures[Number($('temperature-slider').value)];
  const source = () => $('source').value;
  const currentStoryText = () => story.seed + story.actions.map(a=>a.text).join('');

  function announce(message, error=false) {
    $('status').textContent=message; $('status').className='status'+(error?' error':busy?' busy':'');
  }
  function setBusy(value) {
    busy=value;
    document.querySelectorAll('[data-query], [data-mode], #source, #model, #refresh, #temperature-slider, textarea, #prediction, #predict-example, #bet-token, #bet-space, #bet-temperature').forEach(n=>n.disabled=value);
    $('model').disabled=value||source()==='prepared';
    document.querySelectorAll('.token-option').forEach(n=>n.disabled=value || n.dataset.available==='false');
    if(!value)$('status').classList.remove('busy');
    renderBetControls();
  }
  async function request(path, payload, signal) {
    const options={signal};
    if(payload!==undefined){options.method='POST';options.headers={'Content-Type':'application/json'};options.body=JSON.stringify(payload);}
    let response;
    try{response=await fetch(path,options);}catch(e){
      if(signal?.aborted)throw e;
      throw new Error('Se perdió la conexión con el servidor local. Revisa que la ventana de arranque siga abierta.');
    }
    let data;
    try{data=await response.json();}catch{throw new Error('El servidor no entregó una respuesta válida. Revisa que siga abierto.');}
    if(!response.ok)throw new Error(data.error || 'No se pudo completar la consulta.');
    return data;
  }
  function payload(prompt,t=1,seed=42,count) {return {prompt,temperature:t,seed,count,source:source(),model:$('model').value};}

  async function operation(work, message='Consultando la IA…') {
    if(busy)return;
    setBusy(true); const epoch=++generation;
    activeController=new AbortController();
    const controller=activeController;
    const timeout=setTimeout(()=>controller.abort('timeout'),115000);
    announce(message);
    try{
      await work(controller.signal,epoch);
      if(epoch===generation)announce(source()==='prepared'?'Resultado preparado disponible · consulta original guardada.':'Resultado disponible · calculado por la IA incluida.');
    }catch(e){
      if(epoch===generation)announce(e.name==='AbortError' || controller.signal.aborted?'Tiempo agotado o consulta cancelada. No se han sustituido los datos. Puedes reintentar.':e.message,true);
    }finally{
      clearTimeout(timeout);
      if(epoch===generation){activeController=null;setBusy(false);renderStoryControls();
        if(mode==='story'&&story.started&&story.result)$('story-result').querySelector('.token-option:not(:disabled)')?.focus({preventScroll:true});
      }
    }
  }
  function remember(type,result) {ledger.push({experience:mode,operation:type,data:result});}
  function empty(target,title='Las posibilidades están por descubrir',text='Primero haz una predicción. Luego consulta el modelo.') {
    const box=node('div','empty');box.append(node('div','empty-icon','✳'),node('strong','',title),node('p','',text));target.replaceChildren(box);
  }

  function chart(target,result,{interactive=false,other=null,prediction=''}={}) {
    target.replaceChildren();
    if(!result){empty(target,interactive?'Tu historia empieza con una decisión':'Las posibilidades están por descubrir',interactive?'Escribe un inicio y abre las posibilidades.':'Primero haz una predicción. Luego consulta el modelo.');return;}
    const d=result.distribution, t=result.request.options.temperature;
    const paired=target.id==='temperature-result'&&result.adjusted_distribution;
    if(paired)target.append(node('p','probability-legend','Barras superiores: original (T=1) · inferiores: después de temperatura '+fmt(t))); 
    const meta=node('div','chart-meta');
    meta.append(node('span','source-tag'+(result.source==='prepared'?' saved':''),result.source==='prepared'?'PREPARADO · REAL':'EN VIVO · LOCAL'),node('span','',result.source==='prepared'?'medido: '+fmt(result.elapsed_s,2)+' s':'consulta: '+fmt(result.elapsed_s,2)+' s'));
    target.append(meta);
    const probabilityLabel=result.semantics_verified?'base':'informada';
    const selection=node('div','selection');selection.append(node('span','',(result.source==='prepared'?'La grabación muestra':'La IA seleccionó')),node('strong','',d.selected.display),node('span','prob','T '+fmt(t)+' · '+probabilityLabel+' '+percent(d.selected.probability)));if(result.adjusted_distribution)selection.append(node('span','effective-selection','Con T '+fmt(t)+': '+percent(result.adjusted_distribution.selected.probability)));target.append(selection);
    if(!result.semantics_verified)target.append(node('p','science-note','Versión o modelo sin verificar en este proyecto: son probabilidades informadas por Ollama; su posición respecto a temperatura requiere la prueba previa.'));
    if(interactive&&result.source==='prepared')target.append(node('p','recorded-choice','Recorrido preparado: solo puedes seguir el token con un siguiente contexto guardado.'));
    const axis=node('div','axis');axis.append(node('span','','0 %'),node('span','','50 %'),node('span','','100 %'));target.append(axis);
    const tokens=d.alternatives.slice(0,topCount);
    const others=other?new Set(other.distribution.alternatives.map(tokenKey)):null;
    for(const [i,token] of tokens.entries()){
      const row=node('div','bar-row'+(tokenKey(token)===tokenKey(d.selected)?' picked':'')+(others&&!others.has(tokenKey(token))?' novel':''));
      row.dataset.probability=String(token.probability);row.dataset.token=token.token;
      row.title='Original: '+JSON.stringify(token.token)+' · '+percent(token.probability)+(others&&!others.has(tokenKey(token))?' · fuera del top 10 del otro contexto':'');
      row.append(node('span','token-label',token.display));
      const track=node('div','bar-track'),bar=node('div','bar-fill');
      bar.style.width=(token.probability*100)+'%';bar.style.background=colors[i%colors.length];track.append(bar);row.append(track,node('span','bar-value',percent(token.probability)));
      if(paired){const adjusted=node('div','bar-track adjusted-track'),fill=node('div','bar-fill adjusted-fill');const p=token.adjusted_probability;fill.style.width=(100*p)+'%';adjusted.append(fill);row.append(node('span','adjusted-label','Con T '+fmt(t)),adjusted,node('span','bar-value adjusted-value',percent(p)));row.dataset.adjustedProbability=String(p);}
      if(interactive){
        const button=node('button','token-option');button.type='button';
        const available=token.appendable&&(result.source!=='prepared'||token.prepared_next);
        button.disabled=busy||!available;button.dataset.available=String(available);
        button.setAttribute('aria-label','Elegir token '+token.display+', probabilidad base '+percent(token.probability));
        if(!token.appendable)button.title='Token especial o bytes no representables con fidelidad: se conserva para auditoría, no se añade como texto.';
        else if(!available)button.title='Este siguiente contexto no está guardado. En vivo puedes elegir cualquier token representable.';
        button.append(row);button.addEventListener('click',()=>chooseToken(token,result));target.append(button);
      }else{row.setAttribute('role','img');row.setAttribute('aria-label','Token '+token.display+': '+percent(token.probability));target.append(row);}
    }
    const residual=Math.max(0,1-tokens.reduce((s,x)=>s+x.probability,0));
    const rest=node('div','residual');rest.dataset.residual=String(residual);rest.append(node('span','','Otras posibilidades · fuera de estas '+tokens.length),node('strong','',percent(residual)));target.append(rest);
    if(paired){const effectiveRest=Math.max(0,1-tokens.reduce((sum,x)=>sum+x.adjusted_probability,0));const er=node('div','residual adjusted-residual');er.dataset.residual=String(effectiveRest);er.append(node('span','','Otras posibilidades después de temperatura'),node('strong','',percent(effectiveRest)));target.append(er);}
    if(target.id==='temperature-result'&&!paired)target.append(node('p','science-note','Este respaldo de Ollama conserva probabilidades base. No incluye la distribución posterior a temperatura; no la calculamos a partir de un top 10 incompleto.'));
    target.append(node('p','chart-explainer','Probabilidades '+(result.semantics_verified?'base':'informadas')+' del siguiente token · escala absoluta · · espacio · ↵ salto · ✓ selección real del motor'));
    if(!tokens.some(x=>tokenKey(x)===tokenKey(d.selected)))target.append(node('p','chart-explainer','El token seleccionado está fuera de las barras visibles. Su probabilidad ya forma parte de «otras posibilidades».'));
    if(prediction)target.append(node('p','prediction-note','Tu apuesta: «'+prediction+'». Compara el texto y sus fragmentos: una palabra puede necesitar varios tokens.'));
    const details=node('details','token-audit');details.append(node('summary','','Ver el texto exacto y sus bytes'));
    details.append(node('pre','',JSON.stringify({model:result.request.model,temperature:t,seed:result.request.options.seed,probability_kind:d.probability_kind,selected:d.selected,shown:tokens.map(x=>({token:x.token,bytes:x.bytes,logprob:x.logprob,probability:x.probability})),source:result.source,original_created_at:result.recorded_at,sha256:result.raw_sha256,engine:result.engine,adjusted:result.adjusted_distribution,full_vocabulary_check:result.audit?.full_vocabulary},null,2)));target.append(details);
  }

  function renderContext(message){
    const pair=results.context;
    const valid=!!(pair?.a?.distribution?.alternatives?.length&&pair?.b?.distribution?.alternatives?.length
      &&pair.a.request.prompt===$('context-a').value&&pair.b.request.prompt===$('context-b').value);
    $('context-results').hidden=!valid;
    for(const key of ['a','b']){
      $('context-phrase-'+key).textContent='«'+$('context-'+key).value+'»';
      const target=$('context-result-'+key);
      if(valid)chart(target,pair[key],{other:pair[key==='a'?'b':'a']});
      else target.replaceChildren();
    }
    if(message)$('context-observation').textContent=message;
  }

  function renderResults(){
    chart($('predict-result'),results.predict,{prediction:results.prediction});
    renderContext();
    chart($('temperature-result'),results.temperatures?.[chosenT()]);
    chart($('story-result'),story.result,{interactive:true});
  }
  function setMode(next){
    mode=next;
    document.querySelectorAll('[data-mode]').forEach(n=>{n.classList.toggle('active',n.dataset.mode===mode);if(n.dataset.mode===mode)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current');});
    document.querySelectorAll('.mode-panel').forEach(n=>n.hidden=n.id!==mode+'-panel');
    const [number,title,subtitle]=titles[mode];$('mode-kicker').textContent='ABRE LA CAJA · EXPERIMENTO '+number;$('mode-title').textContent=title;$('mode-subtitle').textContent=subtitle;
    announce(mode==='bet'?'Escribe un token y confirma tu apuesta antes de generar.':source()==='prepared'?'Modo preparado: elige un contexto guardado.':'Haz una predicción antes de consultar.');
  }

  const betToken = () => ($('bet-space').checked ? ' ' : '') + $('bet-token').value;
  const visibleBet = text => Array.from(text, c => c===' ' ? '·' : c==='·' ? '\\u00b7' : c==='\n' ? '↵' : c==='\t' ? '⇥' : c).join('');
  function renderBetControls(){
    const finished=betting.current?.phase==='settled';
    $('bet-go').disabled=busy||source()!=='live'||finished;
    $('bet-next').disabled=busy;
    $('bet-source-note').textContent=source()==='prepared'?'La apuesta necesita En vivo · IA incluida. Las grabaciones no participan en el marcador.':'Se compara el texto exacto de un token, incluidos sus espacios. Cada acierto suma 1 punto; un fallo suma 0.';
  }
  function renderBet(){
    const points=betting.rounds.filter(r=>r.hit).length;
    $('bet-score').textContent=points+' '+(points===1?'punto':'puntos')+' · '+betting.rounds.length+' '+(betting.rounds.length===1?'ronda':'rondas');
    $('bet-preview').textContent=$('bet-token').value ? 'Tu token exacto: '+visibleBet(betToken()) : 'Escribe un token para ver tu apuesta exacta.';
    const current=betting.current, outcome=$('bet-outcome');
    outcome.className='bet-outcome';
    if(!current){outcome.textContent='Primero confirma tu apuesta. El resultado se genera después.';empty($('bet-result'),'El token aún no se ha generado','Tu apuesta quedará fijada antes de consultar el modelo.');}
    else if(current.phase==='pending'){outcome.textContent='Apuesta confirmada: «'+visibleBet(current.token)+'». Generando un token…';$('bet-result').replaceChildren();}
    else if(current.phase==='failed'){outcome.textContent='La ronda no se pudo completar. No suma puntos ni cuenta como fallo. Puedes volver a intentarlo.';$('bet-result').replaceChildren();}
    else{
      outcome.classList.add(current.hit?'hit':'miss');
      outcome.textContent=(current.hit?'¡Acertaste! +1 punto. ':'Esta vez no coincidió. +0 puntos. ')+'Apostaste «'+visibleBet(current.token)+'»; la IA generó «'+current.selected.display+'».';
      chart($('bet-result'),current.result);
    }
    const history=$('bet-history');history.replaceChildren();
    for(const round of betting.rounds.slice(-10).reverse())history.append(node('li',round.hit?'hit':'miss','Ronda '+round.number+' · '+(round.hit?'+1':'0')+' · apuesta «'+visibleBet(round.token)+'» → IA «'+round.selected.display+'» · T '+fmt(round.temperature)));
    renderBetControls();
  }
  function newBetRound(){
    if(busy)return;
    betting.current=null;renderBet();$('bet-token').focus();
  }
  async function placeBet(){
    if(busy||betting.current?.phase==='settled')return;
    if(source()!=='live'){announce('Selecciona En vivo · IA incluida para jugar una ronda auténtica.',true);return;}
    if(!$('bet-token').value || $('bet-token').value.length>80){announce('Escribe el token por el que quieres apostar (máximo 80 caracteres).',true);$('bet-token').focus();return;}
    const choice=betToken(),prompt=$('bet-prompt').value,temperature=Number($('bet-temperature').value);
    await operation(async(signal,epoch)=>{
      // Commit a frozen choice BEFORE native inference. New seed, never the fixed preview seed.
      const seed=crypto.getRandomValues(new Uint32Array(1))[0]&0x7fffffff;
      const round={id:'ronda-'+epoch,number:betting.rounds.length+1,phase:'pending',token:choice,prompt,temperature,seed,confirmed_at:new Date().toISOString()};
      betting.current=round;events.push({type:'bet_committed',id:round.id,token:choice,prompt,temperature,seed,confirmed_at:round.confirmed_at});renderBet();
      try{
        const data=await request('/api/generate',payload(prompt,temperature,seed,1),signal);
        if(epoch!==generation)return;
        if(data.source!=='live'||data.engine!=='llama.cpp'||!data.semantics_verified||data.request.options.num_predict!==1||data.request.prompt!==prompt||data.request.options.temperature!==temperature||data.request.options.seed!==seed)
          throw new Error('La respuesta no corresponde a esta ronda en vivo. La apuesta no se puntúa.');
        const selected=data.distribution.selected;
        if(!Array.isArray(selected.bytes)||!Array.isArray(data.original.tokens)||data.original.tokens.length!==1||data.original.tokens[0]!==selected.id)throw new Error('No se recibió un único token con sus bytes. La apuesta no se puntúa.');
        const bytes=Array.from(new TextEncoder().encode(choice));
        round.hit=selected.token===choice&&JSON.stringify(bytes)===JSON.stringify(selected.bytes);
        round.selected=selected;round.result=data;round.phase='settled';round.resolved_at=new Date().toISOString();
        betting.rounds.push(round);remember('bet_one_token',data);events.push({type:'bet_resolved',id:round.id,hit:round.hit,points:round.hit?1:0,sha256:data.raw_sha256,resolved_at:round.resolved_at});renderBet();
      }catch(error){if(epoch===generation){round.phase='failed';events.push({type:'bet_failed',id:round.id});renderBet();}throw error;}
    },'Apuesta confirmada. El modelo local está generando un token…');
  }

  async function predict(){await operation(async(signal,epoch)=>{
    const p=$('predict-prompt').value,prediction=$('prediction').value;
    results.predict=null;chart($('predict-result'),null);
    const data=await request('/api/distribution',payload(p),signal);if(epoch!==generation)return;
    results.predict=data;results.prediction=prediction;remember('distribution',data);chart($('predict-result'),data,{prediction});
  });}
  async function compare(){await operation(async(signal,epoch)=>{
    const body={...payload($('context-a').value),prompt_b:$('context-b').value};
    results.context=null;renderContext('La IA está leyendo las dos frases…');
    let data;
    try{data=await request('/api/compare',body,signal);}catch(error){
      if(epoch===generation)renderContext('No se pudo comparar. Reintenta o elige Datos preparados y usa las frases guardadas.');
      throw error;
    }
    if(epoch!==generation)return;
    if(body.prompt!==$('context-a').value||body.prompt_b!==$('context-b').value)return;
    if(!data?.a?.distribution?.alternatives?.length||!data?.b?.distribution?.alternatives?.length
      ||data.a.request?.prompt!==body.prompt||data.b.request?.prompt!==body.prompt_b)throw new Error('No se recibieron resultados válidos para ambas frases. Vuelve a comparar.');
    results.context=data;remember('compare',data);renderResults();
    const a=data.a.distribution.alternatives,b=data.b.distribution.alternatives;
    const shared=a.map(x=>({a:x,b:b.find(y=>tokenKey(x)===tokenKey(y))})).filter(x=>x.b).sort((x,y)=>Math.abs(y.b.probability-y.a.probability)-Math.abs(x.b.probability-x.a.probability));
    const newA=a.filter(x=>!b.some(y=>tokenKey(x)===tokenKey(y))).length,newB=b.filter(x=>!a.some(y=>tokenKey(x)===tokenKey(y))).length;
    let text='• marca tokens fuera del top 10 del otro contexto. A tiene '+newA+' y B tiene '+newB+' alternativas de ese tipo.';
    if(shared.length){const x=shared[0],delta=(x.b.probability-x.a.probability)*100;text+=' Para «'+x.a.display+'», B cambia '+(delta>=0?'+':'')+fmt(delta)+' puntos porcentuales respecto de A.';}
    $('context-observation').textContent=text;
  },'Consultando los dos contextos, uno después del otro…');}
  function updateTemperature(){
    const t=chosenT();$('temperature-value').textContent=fmt(t);$('temperature-slider').setAttribute('aria-valuetext',fmt(t));
    $('temperature-description').textContent=['Selección del token de mayor puntuación. No es un muestreo aleatorio.','Menor temperatura que la referencia. Observa qué selecciones aparecen.','Valor de referencia para comparar.','Mayor temperatura que la referencia. Observa las diferencias, sin suponer que serán mejores.'][Number($('temperature-slider').value)];
    chart($('temperature-result'),results.temperatures?.[t]);
  }
  async function queryTemperature(){await operation(async(signal,epoch)=>{
    const t=chosenT();results.temperatures??={};delete results.temperatures[t];chart($('temperature-result'),null);
    const data=await request('/api/distribution',payload($('temperature-prompt').value,t),signal);if(epoch!==generation)return;
    results.temperatures??={};results.temperatures[t]=data;remember('temperature_distribution',data);chart($('temperature-result'),data);
  });}
  async function querySamples(){await operation(async(signal,epoch)=>{
    const t=chosenT(),prompt=$('temperature-prompt').value;
    samples[t]=[];renderSamples();
    for(const [i,seed] of [42,43,44].entries()){
      announce((source()==='prepared'?'Leyendo resultado preparado':'Generando continuación')+' '+(i+1)+' de 3 · temperatura '+fmt(t)+'…');
      const data=await request('/api/generate',payload(prompt,t,seed,10),signal);if(epoch!==generation)return;
      samples[t].push(data);remember('short_generation',data);renderSamples();
    }
  },'Generando tres continuaciones breves…');}
  function renderSamples(){
    const target=$('samples');target.replaceChildren();
    for(const t of temperatures){if(!samples[t])continue;
      const box=node('section','sample-group');box.append(node('h3','','Temperatura '+fmt(t)));
      for(const [i,r] of samples[t].entries()){
        const p=node('p','');p.append(node('span','sample-label',(r.source==='prepared'?'PREPARADO':'EN VIVO')+' · variante '+(i+1)+' · semilla '+r.request.options.seed));p.append(document.createTextNode(r.request.prompt+r.text));box.append(p);
      }
      target.append(box);
    }
  }

  function renderStoryControls(){
    $('story-undo').disabled=busy||story.actions.length===0;
    $('story-auto').disabled=busy||!story.started;
    $('story-go').disabled=busy;
    $('story-retry').hidden=!story.started||!!story.result;
    $('story-retry').disabled=busy;
  }
  function renderStory(){
    $('story-start-area').hidden=story.started;$('story-text').hidden=!story.started;
    const target=$('story-text');target.replaceChildren(node('span','',story.seed));
    $('story-history').replaceChildren();
    for(const [i,a] of story.actions.entries()){
      target.append(node('span',a.kind==='human'?'human-text':'ai-text',a.text));
      const li=node('li',a.kind==='ai'?'ai':'');
      li.append(node('span','',a.kind==='human'?a.display:'IA: '+a.count+' tokens'),node('small','',a.kind==='human'?' · '+percent(a.probability):' · automática'));
      li.title='Paso '+(i+1)+' · '+(a.source==='prepared'?'resultado preparado':'consulta local');$('story-history').append(li);
    }
    const n=story.actions.filter(a=>a.kind==='human').length;
    $('story-progress').textContent=n+' de 8 decisiones'+(n>=8?' · ¡reto completado!':'');
    $('story-mission').textContent=n>=8?'Ya construyeron ocho pasos. Ahora la IA puede completar la historia. ¿Seguirá el camino que imaginaban?':'Elijan entre cinco y diez tokens. Después de ocho decisiones, prueben la continuación automática.';
    chart($('story-result'),story.result,{interactive:true});renderStoryControls();
  }
  async function beginStory(){await operation(async(signal,epoch)=>{
    const seed=$('story-start').value;
    const data=await request('/api/distribution',payload(seed),signal);if(epoch!==generation)return;
    story={seed,actions:[],result:data,started:true};remember('story_start',data);renderStory();
  });}
  async function retryStory(){await operation(async(signal,epoch)=>{
    story.result=null;renderStory();
    const data=await request('/api/distribution',payload(currentStoryText()),signal);if(epoch!==generation)return;
    story.result=data;remember('story_retry',data);renderStory();
  });}
  async function chooseToken(token,previous){
    if(busy||!token.appendable)return;
    await operation(async(signal,epoch)=>{
      const action={kind:'human',id:token.id,adjusted_probability:token.adjusted_probability,text:token.token,display:token.display,probability:token.probability,logprob:token.logprob,bytes:token.bytes,source:previous.source,request:previous.request,sha256:previous.raw_sha256,prior:previous};
      story.actions.push(action);story.result=null;events.push({type:'human_choice',token:token.token,source:previous.source});renderStory();
      const data=await request('/api/distribution',payload(currentStoryText()),signal);if(epoch!==generation)return;
      story.result=data;remember('manual_next_context',data);renderStory();
    },'Tu elección cambia el texto. Consultando el nuevo contexto…');
  }
  async function autoStory(){await operation(async(signal,epoch)=>{
    const prior=story.result;
    const data=await request('/api/generate',payload(currentStoryText(),1,42,24),signal);if(epoch!==generation)return;
    story.actions.push({kind:'ai',text:data.text,count:data.original.eval_count||data.original.logprobs?.length||0,source:data.source,request:data.request,sha256:data.raw_sha256,prior});
    story.result=null;remember('automatic_story',data);events.push({type:'automatic_continuation',source:data.source});renderStory();
    empty($('story-result'),'La IA añadió una continuación','Puedes guardar la historia, deshacer o continuar automáticamente. Para nuevas elecciones manuales, deshaz este tramo.');
  },'La IA está continuando la historia · hasta 24 tokens…');}
  function undoStory(){
    if(busy)return;const action=story.actions.pop();if(!action)return;
    story.result=action.prior;events.push({type:'undo',kind:action.kind});renderStory();announce('Elección deshecha. Volviste al contexto anterior.');
  }
  function restartStory(){
    if(busy)return;story={seed:$('story-start').value,actions:[],result:null,started:false};events.push({type:'restart_story'});renderStory();announce('Historia reiniciada. Puedes cambiar su comienzo.');
  }

  function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=node('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
  function exportSession(){
    const cleanActions=story.actions.map(({prior,...a})=>a);
    const data={schema_version:4,application:'IA_en_tus_manos_autonoma',application_version:'4.0.0-rc2',exported_at:new Date().toISOString(),environment:statusData,source_at_export:source(),active_experience:mode,
      note:'Cada resultado conserva su fuente. Prepared = consulta original guardada, nunca inferencia actual. Las probabilidades base y ajustadas proceden del muestreador nativo. El cuerpo base de todo el vocabulario se conserva sin pérdidas como gzip/base64 en audit.base; su SHA-256 es el del cuerpo descomprimido. El respaldo de Ollama solo conserva probabilidades base. Nunca se renormaliza top-N.',
      story:{seed:story.seed,text:currentStoryText(),actions:cleanActions},betting:{rule:'Exact token text and UTF-8 bytes; 1 point per hit, 0 per miss; live native one-token inference only.',points:betting.rounds.filter(r=>r.hit).length,rounds:betting.rounds.map(({result,phase,...round})=>({...round,raw_sha256:result.raw_sha256}))},experiments:ledger,events};
    download('IA_en_tus_manos_experimento.json',JSON.stringify(data,null,2),'application/json;charset=utf-8');announce('Experimento guardado: incluye fuentes, respuestas originales, bytes y decisiones.');
  }
  function saveStory(){
    const text='IA EN TUS MANOS — HISTORIA COLECTIVA\n\n'+currentStoryText()+'\n\n'+story.actions.map((a,i)=>(i+1)+'. '+(a.kind==='human'?'Elección humana: '+JSON.stringify(a.text)+' | probabilidad base '+percent(a.probability):'Continuación de IA: '+JSON.stringify(a.text))+' | '+(a.source==='prepared'?'RESULTADO PREPARADO':'IA incluida en vivo')).join('\n')+'\n\nLa continuación manual concatena el texto exacto y vuelve a tokenizar; los IDs elegidos se conservan en el JSON. Probable no equivale a verdadero. Para auditoría completa usa Guardar experimento.\n';
    download('IA_en_tus_manos_historia.txt',text,'text/plain;charset=utf-8');announce('Historia guardada en la carpeta de descargas del navegador.');
  }

  function resetAll({preserveMode=true}={}){
    generation++;if(activeController)activeController.abort('reset');activeController=null;setBusy(false);
    results={};samples={};ledger=[];events=[];
    betting={rounds:[],current:null};$('bet-prompt').value=examples[2];$('bet-token').value='';$('bet-space').checked=true;$('bet-temperature').value='1';renderBet();
    $('predict-prompt').value=examples[2];$('predict-example').value=examples[2];$('prediction').value='';
    $('context-a').value='El científico descubrió una';$('context-b').value='El pirata descubrió una';
    $('context-observation').textContent='Escribe las dos frases, haz tus predicciones y pulsa «Comparar las dos frases».';
    $('temperature-prompt').value=examples[2];$('temperature-slider').value='2';
    $('story-start').value=examples[4];story={seed:examples[4],actions:[],result:null,started:false};
    renderResults();renderSamples();renderStory();updateTemperature();if(!preserveMode)setMode('predict');
    announce('Todo listo para comenzar de nuevo. Se conservan la experiencia y la fuente elegidas.');
  }
  function applySource(){
    const saved=source()==='prepared';$('prepared-banner').hidden=!saved;
    if(saved)$('model').value=modelDefault;
    $('model').disabled=busy||saved;
    resetAll();$('model').disabled=saved;
    announce(saved?'Resultados preparados: elige los ejemplos guardados. No hay inferencia en vivo.':'En vivo: las consultas usarán el modelo incluido en este computador.');
    updateEnvironmentBanner();
  }
  function updateEnvironmentBanner(){
    const banner=$('environment-banner');
    if(source()==='prepared'){banner.hidden=true;return;}
    const installed=statusData?.models?.some(m=>m.name===$('model').value);
    let message='';
    if(statusData&&!statusData.connected)message=statusData.message+' Puedes elegir Preparados.';
    else if(statusData&&!installed)message='No se encuentra el modelo incluido. Extrae nuevamente el paquete completo.';
    $('retry-engine').hidden=statusData?.connected||statusData?.phase!=='failed';
    banner.textContent=message;banner.hidden=!message;
  }
  async function refreshStatus(){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
    try{
      statusData=await request('/api/status',undefined,controller.signal);
      $('connection').textContent=statusData.connected?'IA incluida · '+statusData.version+' · CPU':'IA preparando o desconectada · respaldo disponible';
      $('connection').className='connection'+(statusData.connected?'':' off');
      for(const [name,label] of [[modelDefault,'Qwen 3.5 · 2B Q4_K_M (incluido)']]){
        let option=[...$('model').options].find(o=>o.value===name);if(!option){option=node('option');option.value=name;$('model').append(option);}
        option.textContent=label+(statusData.models.some(m=>m.name===name)?'':' · preparando');
      }
    }catch{ $('connection').textContent='Servidor no disponible · revisa la ventana de arranque';$('connection').className='connection off'; }
    finally{clearTimeout(timer);updateEnvironmentBanner();}
  }

  for(const prompt of examples){const option=node('option','',prompt);option.value=prompt;$('predict-example').append(option);}
  $('predict-example').value=examples[2];
  document.querySelectorAll('[data-mode]').forEach(n=>n.addEventListener('click',()=>setMode(n.dataset.mode)));
  $('predict-example').addEventListener('change',()=>{$('predict-prompt').value=$('predict-example').value;results.predict=null;results.prediction='';chart($('predict-result'),null);});
  $('predict-go').addEventListener('click',predict);$('prediction').addEventListener('keydown',e=>{if(e.key==='Enter')predict();});
  $('context-go').addEventListener('click',compare);
  $('top-count').addEventListener('change',()=>{topCount=Number($('top-count').value);renderResults();});
  $('temperature-slider').addEventListener('input',updateTemperature);
  $('temperature-prompt').addEventListener('input',()=>{results.temperatures={};samples={};renderSamples();chart($('temperature-result'),null);});
  $('temperature-go').addEventListener('click',queryTemperature);$('temperature-samples').addEventListener('click',querySamples);
  $('story-go').addEventListener('click',beginStory);$('story-retry').addEventListener('click',retryStory);$('story-undo').addEventListener('click',undoStory);$('story-restart').addEventListener('click',restartStory);$('story-auto').addEventListener('click',autoStory);$('story-save').addEventListener('click',saveStory);
  $('bet-go').addEventListener('click',placeBet);$('bet-next').addEventListener('click',newBetRound);
  $('bet-token').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();void placeBet();}});
  for(const id of ['bet-prompt','bet-token','bet-space','bet-temperature'])$(id).addEventListener(id==='bet-space'||id==='bet-temperature'?'change':'input',()=>{if(!busy){betting.current=null;renderBet();}});
  $('source').addEventListener('change',applySource);$('model').addEventListener('change',()=>{resetAll();updateEnvironmentBanner();});
  $('reset').addEventListener('click',()=>resetAll());$('refresh').addEventListener('click',refreshStatus);$('export').addEventListener('click',exportSession);
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();({predict,context:compare,temperature:queryTemperature,story:story.started?retryStory:beginStory,bet:placeBet})[mode]();}});
  // Editing a prompt invalidates its old chart; percentages never accompany a different visible context.
  $('predict-prompt').addEventListener('input',()=>{results.predict=null;chart($('predict-result'),null);});
  for(const id of ['context-a','context-b'])$(id).addEventListener('input',()=>{results.context=null;renderContext('Cambiaste una frase. Haz nuevas predicciones y vuelve a comparar.');});
  $('retry-engine').addEventListener('click',async()=>{await request('/api/retry',{});announce('Preparando el motor de nuevo…');await refreshStatus();});
  if(new URLSearchParams(location.search).get('source')==='prepared'){$('source').value='prepared';applySource();}
  renderResults();renderStory();renderBet();refreshStatus();
  setInterval(()=>{if(!busy)refreshStatus();},5000);
})();
