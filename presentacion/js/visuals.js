/* Ilustraciones vectoriales originales. Sin recursos ni llamadas de red. */
window.Art = (() => {
  const svg=(view,body,cls='')=>`<svg class="${cls}" viewBox="${view}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
  function icon(type) {
    const paths={
      eye:'<path d="M8 32S17 16 32 16s24 16 24 16-9 16-24 16S8 32 8 32Z"/><circle cx="32" cy="32" r="7"/>',
      flask:'<path d="M23 8h18M27 8v18L12 49q-4 7 5 7h30q9 0 5-7L37 26V8M21 38h22"/><circle cx="29" cy="44" r="2"/>',
      chat:'<path d="M12 11h40v32H31L17 55V43h-5Z"/><path d="M22 23h20M22 32h13"/>',
      computer:'<rect x="8" y="8" width="48" height="34" rx="4"/><path d="M32 42v11M20 55h24M16 32l9-8 8 5 14-13"/>',
      pencil:'<path d="m13 39 29-29 12 12-29 29-16 4ZM35 17l12 12M13 39l12 12M8 59h49"/>',
      human:'<circle cx="32" cy="18" r="10"/><path d="M11 56v-9c0-16 42-16 42 0v9"/>',
      chip:'<rect x="15" y="15" width="34" height="34" rx="6"/><path d="M24 4v11M40 4v11M24 49v11M40 49v11M4 24h11M4 40h11M49 24h11M49 40h11"/><path d="m24 33 6 6 12-14"/>',
      arrow:'<path d="M7 32h48M40 17l15 15-15 15"/>',
      token:'<rect x="8" y="18" width="48" height="30" rx="8"/><path d="M23 18v-6h17v6M23 48v6h17v-6"/>',
      phone:'<rect x="18" y="5" width="28" height="54" rx="5"/><path d="M27 12h10M28 51h8"/>',
      crown:'<path d="M10 44 6 17l15 12L32 10l11 19 15-12-4 27ZM10 53h44"/>',
      check:'<path d="m12 32 13 13 28-28"/>'
    };
    return svg('0 0 64 64',`<g stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${paths[type]||paths.chip}</g>`,'icon');
  }
  function box(id) {
    return svg('0 0 700 620',`<defs>
      <linearGradient id="${id}-front" x1="180" y1="190" x2="490" y2="550" gradientUnits="userSpaceOnUse"><stop stop-color="#182a40"/><stop offset="1" stop-color="#080f1c"/></linearGradient>
      <linearGradient id="${id}-side"><stop stop-color="#17263c"/><stop offset="1" stop-color="#0a1221"/></linearGradient>
      <radialGradient id="${id}-glow"><stop stop-color="#4aead9" stop-opacity=".35"/><stop offset="1" stop-color="#4aead9" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse class="box-halo" cx="350" cy="370" rx="325" ry="240" fill="url(#${id}-glow)"/>
    <ellipse cx="354" cy="551" rx="236" ry="27" fill="#02060c" opacity=".7"/>
    <g class="box-interior">
      <path d="m350 180 185 110-185 110-185-110Z" fill="#102d39"/>
      <path d="m215 338 120 70M366 397l111-70M350 245v103" stroke="#4aead9" stroke-width="3" stroke-dasharray="7 8"/>
      <rect x="245" y="265" width="210" height="130" rx="22" fill="#0b172b" stroke="#4aead9" stroke-width="2"/>
      <rect x="268" y="286" width="58" height="30" rx="6" fill="#4aead9"/><rect x="339" y="286" width="91" height="30" rx="6" fill="#ad99ff"/>
      <path d="M270 370v-22h31v22m17 0v-43h31v43m17 0v-32h31v32m17 0v-12h15v12" fill="#ffd079"/>
    </g>
    <g class="box-walls">
      <path d="m165 280 185 110v170L165 450Z" fill="url(#${id}-front)" stroke="#30465c" stroke-width="2"/>
      <path d="m350 390 185-110v170L350 560Z" fill="url(#${id}-side)" stroke="#30465c" stroke-width="2"/>
      <path d="m189 308 139 83v129L189 437Z" stroke="#ffffff" stroke-opacity=".04"/>
      <path d="m372 398 140-83v123l-140 84Z" stroke="#ffffff" stroke-opacity=".04"/>
      <path d="M350 390v170" stroke="#4aead9" stroke-opacity=".3"/>
      <text x="250" y="437" transform="rotate(30 250 437)" fill="#93a7bc" font-size="32" font-weight="700" text-anchor="middle">IA</text>
    </g>
    <g class="box-lid">
      <path d="m350 170 192 110-192 114-192-114Z" fill="#111d30" stroke="#486077" stroke-width="2"/>
      <path class="box-seam" d="m165 284 185 110 185-110" stroke="#4aead9" stroke-width="4"/>
      <path d="m350 196 147 84-147 86-147-86Z" stroke="#ffffff" stroke-opacity=".055"/>
      <path d="m318 279 32-19 32 19-32 20Z" fill="#4aead9" fill-opacity=".08" stroke="#4aead9" stroke-opacity=".5"/>
    </g>`,'black-box');
  }
  function earth(id) {
    return svg('0 0 640 640',`<defs>
      <radialGradient id="${id}-atm"><stop offset=".65" stop-color="#2d98b9" stop-opacity="0"/><stop offset=".77" stop-color="#4bc9f9" stop-opacity=".22"/><stop offset="1" stop-color="#4bc9f9" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-ocean" cx=".33" cy=".25" r=".85"><stop stop-color="#20597e"/><stop offset=".65" stop-color="#102d4f"/><stop offset="1" stop-color="#081020"/></radialGradient>
      <clipPath id="${id}-clip"><circle cx="320" cy="320" r="245"/></clipPath>
      <linearGradient id="${id}-shade"><stop stop-color="#040b1b" stop-opacity="0"/><stop offset=".7" stop-color="#020713" stop-opacity=".05"/><stop offset="1" stop-color="#020713" stop-opacity=".85"/></linearGradient>
    </defs>
    <circle cx="320" cy="320" r="315" fill="url(#${id}-atm)"/>
    <circle cx="320" cy="320" r="245" fill="url(#${id}-ocean)"/>
    <g clip-path="url(#${id}-clip)">
      <g stroke="#8fdae3" stroke-opacity=".15"><ellipse cx="320" cy="320" rx="150" ry="245"/><ellipse cx="320" cy="320" rx="65" ry="245"/><ellipse cx="320" cy="320" rx="245" ry="90"/><ellipse cx="320" cy="320" rx="245" ry="175"/><path d="M75 320h490M320 75v490"/></g>
      <g fill="#3c978c" stroke="#65bfad" stroke-width="2">
        <path d="m125 180 55-54 78-19 41 32-14 43-57 14-18 37 25 27-7 43-32 14-36-45-25-12-30-46Z"/>
        <path d="m228 301 44 11 36 46-8 47-29 37-11 63-30 20-8-65-29-62 10-57Z"/>
        <path d="m369 163 29-31 55 10 26-12 71 64-35 63-55-12-32 28-22-44-42-17Z"/>
        <path d="m370 270 66 12 21 45-27 57-24 13-20-49-26-34Z"/>
        <path d="m479 411 39-15 30 23-9 30-46-3Z"/>
      </g>
      <g stroke="#e5f9ff" stroke-opacity=".36" stroke-width="11" stroke-linecap="round"><path d="M162 198q77-56 135-24M365 128q75 7 120 45M134 355q48 30 90 6M349 444q67 24 116-13"/></g>
      <circle cx="320" cy="320" r="245" fill="url(#${id}-shade)"/>
    </g>
    <circle cx="320" cy="320" r="245" stroke="#6ab8d0" stroke-opacity=".5" stroke-width="2"/>`,'earth-svg');
  }
  function satellite() {
    let cells='';for(let x=25;x<210;x+=38) cells+=`<path d="M${x} 107v140M${x+340} 107v140"/>`;
    return svg('0 0 600 350',`<g transform="rotate(-13 300 175)">
      <g fill="#112d4f" stroke="#64bddb" stroke-width="2"><path d="M16 105h202v142H16ZM359 105h202v142H359Z"/><g stroke-opacity=".4">${cells}<path d="M16 152h202M16 200h202M359 152h202M359 200h202"/></g></g>
      <path d="M218 172h141" stroke="#95a5ba" stroke-width="12"/>
      <path d="m250 86 68-26 47 35v142l-68 27-47-34Z" fill="#a1b0c3" stroke="#dee7eb" stroke-width="2"/>
      <path d="m250 86 47 34 68-25M297 120v144" stroke="#42566e" stroke-width="3"/>
      <path d="m307 130 46-17v97l-46 17Z" fill="#25384d"/>
      <circle cx="275" cy="180" r="17" fill="#0b1728" stroke="#718fa6" stroke-width="4"/>
      <circle cx="273" cy="178" r="7" fill="#59e9df"/>
      <path d="m288 63 8-31 22-9" stroke="#b8d0d7" stroke-width="3"/>
      <circle cx="325" cy="106" r="4" fill="#ffd079"/>
    </g>`,'satellite-svg');
  }
  function pi() {
    let pins='';for(let i=0;i<20;i++)pins+=`<rect x="${122+i*14}" y="70" width="7" height="18" rx="2"/><rect x="${122+i*14}" y="94" width="7" height="18" rx="2"/>`;
    return svg('0 0 620 430',`<defs><linearGradient id="pi-board" x1="80" y1="50" x2="500" y2="390" gradientUnits="userSpaceOnUse"><stop stop-color="#215a51"/><stop offset="1" stop-color="#0b302e"/></linearGradient></defs>
      <rect x="76" y="57" width="465" height="310" rx="27" fill="#02090d" transform="translate(8 15)"/>
      <rect x="76" y="50" width="465" height="310" rx="27" fill="url(#pi-board)" stroke="#60b88c" stroke-width="3"/>
      <g fill="none" stroke="#62a58c" stroke-opacity=".4" stroke-width="2"><path d="M125 142h60v40h53M122 284h66v-59h43M319 150h76v60h58M305 282h57v35h89M170 330v-58h67M330 203h75v49h43"/></g>
      <g fill="#d8bc70">${pins}</g>
      <rect x="223" y="151" width="110" height="110" rx="6" fill="#101a22" stroke="#718080" stroke-width="2"/>
      <path d="M243 151v-9m18 9v-9m18 9v-9m18 9v-9m18 9v-9M243 261v9m18-9v9m18-9v9m18-9v9m18-9v9M223 173h-9m9 18h-9m9 18h-9m9 18h-9m9 18h-9M333 173h9m-9 18h9m-9 18h9m-9 18h9m-9 18h9" stroke="#acb7b7" stroke-width="5"/>
      <text x="278" y="217" text-anchor="middle" fill="#9ae1bd" font-size="30" font-weight="800">IA</text>
      <g fill="#a5b3bf" stroke="#d2dce4" stroke-width="2"><rect x="455" y="165" width="100" height="66" rx="5"/><rect x="455" y="244" width="100" height="66" rx="5"/><rect x="449" y="58" width="106" height="86" rx="5"/></g>
      <g fill="#263948"><rect x="480" y="179" width="75" height="14"/><rect x="480" y="203" width="75" height="14"/><rect x="480" y="258" width="75" height="14"/><rect x="480" y="282" width="75" height="14"/></g>
      <g fill="#c2cbd2"><rect x="130" y="341" width="48" height="25" rx="3"/><rect x="218" y="341" width="41" height="25" rx="3"/><rect x="281" y="341" width="41" height="25" rx="3"/></g>
      <g fill="#0c2326" stroke="#a8c98b" stroke-width="4"><circle cx="102" cy="76" r="9"/><circle cx="423" cy="76" r="9"/><circle cx="102" cy="334" r="9"/><circle cx="423" cy="334" r="9"/></g>
      <circle cx="116" cy="151" r="5" fill="#87ef9b"/>
      <text x="310" y="410" text-anchor="middle" fill="#a9d6bf" font-size="25" letter-spacing="2">Raspberry Pi</text>`,'pi-svg');
  }
  function cloud() {
    return svg('0 0 600 330',`<path d="M133 263C24 263 34 124 129 123c-4-115 192-145 236-42 96-42 183 49 151 118 76 27 47 96-28 96H133Z" fill="#16283e" stroke="#75bada" stroke-width="3"/>
      <g fill="#091727" stroke="#759bb1" stroke-width="2"><rect x="191" y="123" width="208" height="43" rx="5"/><rect x="191" y="176" width="208" height="43" rx="5"/><rect x="191" y="229" width="208" height="43" rx="5"/></g>
      <g fill="#4aead9"><circle cx="215" cy="145" r="5"/><circle cx="215" cy="198" r="5"/><circle cx="215" cy="251" r="5"/></g>
      <path d="M246 145h123M246 198h123M246 251h123" stroke="#3b5769" stroke-width="5"/>`,'cloud-svg');
  }
  function photo(cloudy=false) {
    return svg('0 0 260 180',`<rect width="260" height="180" fill="#173f62"/><path d="m0 20 85-20 68 41 22 48-31 63-80 28H0Z" fill="#418d79"/><path d="m260 61-57 21-25 48 82 35" fill="#80ad82"/><path d="m39 0 36 53-20 35 40 45-2 47" stroke="#94c7cb" stroke-width="7"/>${cloudy?'<g fill="#eef7ff" opacity=".94"><ellipse cx="80" cy="60" rx="90" ry="42"/><ellipse cx="170" cy="110" rx="100" ry="50"/><ellipse cx="190" cy="20" rx="90" ry="40"/></g>':'<path d="M180 22q35-17 60 5" stroke="#e9f5ff" stroke-width="12" stroke-linecap="round" opacity=".6"/>'}`,'photo-svg');
  }
  return {icon,box,earth,satellite,pi,cloud,photo};
})();
