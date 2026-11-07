/* Motor local, sin dependencias. Cada estado se deriva del número de paso. */
(() => {
 'use strict';
 const data=Slides.slides, stage=document.getElementById('stage');
 const pad=n=>String(n).padStart(2,'0');
 stage.innerHTML=data.map((s,i)=>`<section class="slide s${i+1}" data-slide="${i+1}" data-step="0" aria-label="${i+1}. ${s.title}" aria-hidden="true"><div class="slide-meta"><span class="chapter">${s.chapter}</span><span class="brand">LA IA EN TUS MANOS</span></div>${s.render()}<footer class="slide-footer"><span>DENTRO DE LA CAJA NEGRA</span><span class="rule"></span><b>${pad(i+1)}</b><span>/ 18</span></footer></section>`).join('');
 const sections=[...stage.querySelectorAll('.slide')];
 const dialogs=[...document.querySelectorAll('dialog')];
 let index=0,step=0;
 let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let temperatures={0:1,1:.2,2:1.6,3:1.6};
 let toastTimer, idleTimer, embeddingTimer;
 let lastSlide=-1, embeddingTarget=false;
 document.body.classList.toggle('reduced',reduced);
 function fit(){const scale=Math.min(innerWidth/1920,innerHeight/1080);stage.style.transform=`scale(${scale})`;stage.style.left=`${(innerWidth-1920*scale)/2}px`;stage.style.top=`${(innerHeight-1080*scale)/2}px`;}
 addEventListener('resize',fit);fit();
 function distribution(base,t){
   if(!Number.isFinite(t)||t<0||base.length===0||base.some(p=>!Number.isFinite(p)||p<0)||!base.some(p=>p>0))throw new RangeError('Distribución o temperatura inválida');
   const top=Math.max(...base);
   if(t===0){const count=base.filter(p=>p===top).length;return base.map(p=>p===top?1/count:0);}
   // Restar el máximo ANTES de dividir evita desbordamiento incluso con T muy baja.
   const logTop=Math.log(top), weights=base.map(p=>p===0?0:Math.exp((Math.log(p)-logTop)/t));
   const sum=weights.reduce((a,b)=>a+b,0);return weights.map(v=>v/sum);
 }
 function roundedPercents(p){const raw=p.map(v=>v*1000),out=raw.map(Math.floor);let rest=1000-out.reduce((a,b)=>a+b,0);const order=raw.map((v,i)=>({i,f:v-out[i]})).sort((a,b)=>b.f-a.f);for(let j=0;j<rest;j++)out[order[j].i]++;return out.map(v=>v/10);}
 function setTemperature(value,remember=true){
   const t=Math.max(0,Math.min(2,Number(value)));if(!Number.isFinite(t))return;
   const p=distribution([.56,.27,.11,.06],t), rounded=roundedPercents(p);
   document.getElementById('temperature').value=String(t);
   document.getElementById('temperature-value').textContent=t.toLocaleString('es-CL',{minimumFractionDigits:2,maximumFractionDigits:2});
   document.getElementById('temperature-caption').textContent=t===0?'Siempre la mayor':t<.6?'Una opción domina':t>1.2?'Más alternativas':t===1?'Distribución base':'Distribución intermedia';
   document.getElementById('distribution-label').textContent=t===0?'T = 0: selección de la opción máxima':'Así se reparten las posibilidades';
   document.querySelector('.thermo-fill').style.height=`${8+t*44}%`;
   document.querySelectorAll('.temperature-bars .bar-row').forEach((row,i)=>{row.querySelector('.bar-fill').style.setProperty('--p',`${p[i]*100}%`);row.querySelector('.bar-value').innerHTML=`${rounded[i].toLocaleString('es-CL',{maximumFractionDigits:1})}<small>%</small>`;row.dataset.probability=String(p[i]);});
   if(remember)temperatures[step]=t;
 }
 document.getElementById('temperature').addEventListener('input',e=>setTemperature(e.target.value));
 function update(){
   const embedding=sections[3], target=step>=3;
   if(index===3 && lastSlide===3 && target!==embeddingTarget && !document.body.classList.contains('reduced')){
     clearTimeout(embeddingTimer);embedding.classList.add('points-moving');
     embeddingTimer=setTimeout(()=>embedding.classList.remove('points-moving'),1900);
   } else if(index!==3 || lastSlide!==3 || document.body.classList.contains('reduced')){
     clearTimeout(embeddingTimer);embedding.classList.remove('points-moving');
   }
   if(index===3)embeddingTarget=target;
   lastSlide=index;
   sections.forEach((el,i)=>{el.classList.toggle('active',i===index);el.setAttribute('aria-hidden',i===index?'false':'true');el.inert=i!==index;});
   const el=sections[index];el.querySelector('.slide-footer').append(document.getElementById('toast'));el.dataset.step=String(step);
   for(let n=1;n<=data[index].steps;n++)el.classList.toggle(`b${n}`,step>=n);
   el.querySelectorAll('[data-reveal]').forEach(e=>{const shown=step>=Number(e.dataset.reveal);e.classList.toggle('is-visible',shown);e.setAttribute('aria-hidden',shown?'false':'true');});
   if(index===6){el.querySelector('.context-value').textContent=step>=6?'El gato duerme sobre la cama.':step>=5?'El gato duerme sobre':step>=4?'El gato duerme':'El gato';el.querySelector('.selected-value').textContent=step>=6?'la cama.':step>=5?'sobre':'duerme';}
   if(index===9)el.querySelector('.slide-head h1').innerHTML=step>=6?'Del espacio a esta sala.':'¡Una inteligencia artificial<br>a bordo de un satélite!';
   if(index===7)setTemperature(temperatures[step],false);
   document.getElementById('position').textContent=`${pad(index+1)} / 18`;
   document.getElementById('steps').innerHTML=Array.from({length:data[index].steps+1},(_,i)=>`<i class="${i<=step?'on':''}"></i>`).join('');
   document.getElementById('steps').setAttribute('aria-label',`Paso ${step} de ${data[index].steps}`);
   document.getElementById('prev').disabled=index===0&&step===0;
   document.getElementById('next').disabled=index===data.length-1&&step===data[index].steps;
   document.getElementById('live').textContent=`Lámina ${index+1} de 18. ${data[index].title}. Paso ${step} de ${data[index].steps}.`;
   document.title=`${pad(index+1)} · ${data[index].title} | La IA en tus manos`;
   try{history.replaceState(null,'',`#${index+1}/${step}`);}catch(_){/* file:// puede restringir history en algunos navegadores. */}
   fillNotes();
 }
 function go(n,s=0){index=Math.max(0,Math.min(17,Math.floor(n)-1));step=Math.max(0,Math.min(data[index].steps,Math.floor(s)));update();}
 function next(){if(step<data[index].steps){if(index===7&&step===2)temperatures[3]=temperatures[2];step++;}else if(index<17){index++;step=0;}update();}
 function prev(){if(step>0)step--;else if(index>0){index--;step=data[index].steps;}update();}
 function restart(){if(index===7)temperatures={0:1,1:.2,2:1.6,3:1.6};step=0;update();toast('Lámina reiniciada · → para avanzar');}
 function toast(message){document.getElementById('toast').textContent=message;document.getElementById('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>document.getElementById('toast').classList.remove('visible'),2300);}
 function fillNotes(){const s=data[index];document.getElementById('notes-title').textContent=`${pad(index+1)} · ${s.title}`;document.getElementById('note-content').innerHTML=`<p class="muted">${s.time} · Paso ${step} / ${s.steps}</p><h3>Guion oral</h3><p>${s.note}</p><h3>Interacción</h3><p>${s.interaction}</p><h3>Rigor</h3><p>${s.science}</p>`;}
 function toggleDialog(id){const d=document.getElementById(id),wasOpen=d.open;dialogs.forEach(e=>e.close());if(!wasOpen){if(id==='overview')document.querySelectorAll('#slide-map button').forEach((b,i)=>b.classList.toggle('current',i===index));d.showModal();}}
 function toggleMotion(){reduced=!reduced;document.body.classList.toggle('reduced',reduced);if(reduced){clearTimeout(embeddingTimer);sections[3].classList.remove('points-moving');}toast(reduced?'Movimiento reducido':'Movimiento restaurado');}
 async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else if(document.documentElement.webkitRequestFullscreen)document.documentElement.webkitRequestFullscreen();else toast('Usa la opción de pantalla completa del navegador.');}catch(_){toast('Usa la opción de pantalla completa del navegador.');}}
 function controls(){document.body.classList.remove('idle');document.body.classList.add('controls-visible');clearTimeout(idleTimer);idleTimer=setTimeout(()=>{if(!dialogs.some(d=>d.open)){document.body.classList.remove('controls-visible');if(!document.activeElement.matches('input,button'))document.body.classList.add('idle');}},2500);}
 document.getElementById('slide-map').innerHTML=data.map((s,i)=>`<button type="button" data-target="${i+1}"><span>${pad(i+1)}</span>${s.title}</button>`).join('');
 document.getElementById('slide-map').addEventListener('click',e=>{const b=e.target.closest('button');if(b){dialogs.forEach(d=>d.close());go(Number(b.dataset.target));}});
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
 dialogs.forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
 document.getElementById('prev').onclick=prev;document.getElementById('next').onclick=next;
 document.getElementById('overview-button').onclick=()=>toggleDialog('overview');document.getElementById('help-button').onclick=()=>toggleDialog('help');
 document.addEventListener('keydown',e=>{
   const key=e.key.toLowerCase();
   if(key==='escape'){dialogs.forEach(d=>d.close());return;}
   if(dialogs.some(d=>d.open)){if(['n','g','h','?'].includes(key)){e.preventDefault();toggleDialog(key==='n'?'notes':key==='g'?'overview':'help');}return;}
   if(e.target.matches('input,textarea,select')||e.target.isContentEditable){const range=e.target.matches('input[type=range]');if(!range||['arrowleft','arrowright','arrowup','arrowdown','home','end','pageup','pagedown',' '].includes(key))return;}
   if(e.repeat)return;
   if(e.target.closest('button')&&[' ','enter'].includes(key))return;
   if(['arrowright','arrowdown',' ','pagedown'].includes(key)){e.preventDefault();next();}
   else if(['arrowleft','arrowup','pageup'].includes(key)){e.preventDefault();prev();}
   else if(key==='r'){e.preventDefault();restart();}
   else if(key==='f'){e.preventDefault();fullscreen();}
   else if(key==='m'){e.preventDefault();toggleMotion();}
   else if(key==='g')toggleDialog('overview');
   else if(key==='n')toggleDialog('notes');
   else if(key==='h'||key==='?')toggleDialog('help');
   else if(key==='home'){e.preventDefault();go(1);}
   else if(key==='end'){e.preventDefault();go(18);}
 });
 document.addEventListener('mousemove',controls);document.addEventListener('pointerdown',controls);
 const m=location.hash.match(/^#(\d+)(?:\/(\d+))?$/);if(m)go(Number(m[1]),Number(m[2]||0));else update();
 function preparePrint(){
 clearTimeout(embeddingTimer);sections[3].classList.remove("points-moving");
 sections[9].querySelector(".slide-head h1").innerHTML="¡Una inteligencia artificial<br>a bordo de un satélite!";
 const names=['cama','mesa','luna','pizza'];
 document.querySelector('.print-temperature-compare').innerHTML=[.2,1.6].map((t,i)=>{const p=distribution([.56,.27,.11,.06],t),r=roundedPercents(p);return `<section><h3>${i?'Alta':'Baja'} · T = ${t.toLocaleString('es-CL',{minimumFractionDigits:2})}</h3><div class="bars">${names.map((w,j)=>`<div class="bar-row"><span class="candidate">${w}</span><div class="bar-track"><div class="bar-fill" style="--p:${p[j]*100}%"></div></div><span class="bar-value">${r[j].toLocaleString('es-CL')}<small>%</small></span></div>`).join('')}</div></section>`;}).join('');
 sections.forEach((el,i)=>{el.setAttribute('aria-hidden','false');el.querySelectorAll('[data-reveal]').forEach(e=>e.setAttribute('aria-hidden','false'));el.dataset.step=data[i].steps;for(let n=1;n<=data[i].steps;n++)el.classList.add(`b${n}`);el.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('is-visible'));el.inert=false;});setTemperature(1,false);sections[6].querySelector('.context-value').textContent='El gato duerme sobre la cama.';sections[6].querySelector('.selected-value').textContent='la cama.';}
 addEventListener('beforeprint',preparePrint);addEventListener('afterprint',update);
 window.Deck={go,next,prev,restart,setTemperature,temperatureDistribution:distribution,preparePrint,toggleMotion,getState:()=>({slide:index+1,step,temperature:Number(document.getElementById('temperature').value),reduced,steps:data[index].steps})};
 if(new URLSearchParams(location.search).get('print')==='deck'){document.body.classList.add('reduced');preparePrint();}
 controls();
})();
