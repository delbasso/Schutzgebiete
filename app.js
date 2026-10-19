'use strict';
let D=window.ATLAS;
const BW_DATA=D;
D.root='BW';D.rootName='Baden-Württemberg';D.states=[];D.rasterSize=50;D.defaultDefinition='fiona';
D.boundary='VG250-2026-GF4-BW';D.protection='LUBW-2026-10-19-verordnet-festgesetzt';
const $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
const layerIds=['stateLines','nsg','wsg','overlap','agriculture','arable','county','labels','cities'];
const state={definition:'fiona',region:'BW',view:[...D.bounds],drag:null};
const colors={NSG:'#d34b45',WSG:'#3684c4',BOTH:'#8051aa',AGRICULTURE:'#74a180',ARABLE:'#d8ad51'};
const titles={NSG:'Naturschutzgebiete',WSG:'Wasserschutzgebiete',BOTH:'Beide zugleich',EITHER:'Mindestens eines'};
const format=(v,d=0)=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:d,minimumFractionDigits:d}).format(v);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
let sources=[
 ['Naturschutzgebiete · LUBW','Verordnete NSG; vollständig abgerufen am 19.10.2026. Datenlizenz Deutschland Zero 2.0.','https://rips-metadaten.lubw.de/trefferanzeige?docuuid=1a6a350d-97b6-4c73-8558-704d9fe8a29e','Metadaten & amtlicher Zugang'],
 ['Wasserschutzgebiete · LUBW','Festgesetzte WSG; geplante und aufgehobene Gebiete ausgeschlossen. Grundlage: Daten aus dem Umweltinformationssystem (UIS) der LUBW Landesanstalt für Umwelt Baden-Württemberg.','https://rips-metadaten.lubw.de/trefferanzeige?docuuid=ec2d7bcc-1f56-4596-bbc0-459ddb6a1a82','Metadaten & amtlicher Zugang'],
 ['Antragsflächen 2022 · FIONA','Landwirtschaft = AL + GL + DK, Ackerland = AL. Datengrundlage: MLR (2026), dl-de/by-2-0. Nur veröffentlichte, räumlich auswertbare Antragsflächen.','https://owsproxy.lgl-bw.de/owsproxy/wfs/WFS_LW-BW_FIONA_Flaecheninformation?REQUEST=GetCapabilities&SERVICE=WFS','Amtlicher Geodatendienst'],
 ['Nutzcodeliste 2022 · MLR','Förderrechtliche Definitionen einschließlich zugeordneter Brachen und Landschaftselemente.','https://foerderung.landwirtschaft-bw.de/site/pbs-bw-rebrush2024/get/documents_E-178798993/MLR.LEL/PB5Documents/mlr/GA/GA_022_intern/fiona-archiv/2022/Merkblaetter/GA%20-%20Nutzcodeliste%202022.pdf','Nutzcodeliste (PDF)'],
 ['Landbedeckungsmodell 2021 · BKG','Landwirtschaft = N211 + N214; Ackerland = B211 innerhalb dieser Fläche. Geografische Näherung; keine statistische LF. © BKG (2026), CC BY 4.0.','https://sgx.geodatenzentrum.de/web_public/gdz/dokumentation/deu/lbm-de2021.pdf','Dokumentation (PDF)'],
 ['Verwaltungsgebiete VG250 · BKG','Land- und Stadtkreise sowie Landesfläche: Stand 01.01.2026, GF=4, ohne Bodensee. © BKG (2026), dl-de/by-2-0.','https://gdz.bkg.bund.de/index.php/default/verwaltungsgebiete-1-250-000-stand-01-01-vg250-01-01.html','Amtliche Verwaltungsgrenzen']
];
const BW_SOURCES=sources;
function definition(){return D.definitions[state.definition]}
function regionName(id=state.region){if(id===D.root)return D.rootName;const c=[...(D.states||[]),...D.counties].find(c=>c.id===id);return c?`${c.name} (${c.kind})`:id}
function row(cat,p){return definition().records[state.region]?.find(r=>r.land_category===cat&&r.protection===p)}
function currentProtection(){return $('nsg').checked?($('wsg').checked?'EITHER':'NSG'):($('wsg').checked?'WSG':null)}
function percentage(cat,p){const r=row(cat,p);return r&&r.denominator_ha>0?100*r.protected_ha/r.denominator_ha:null}
function pct(v){return v===null?'–':format(v,2)+' %'}
function toast(s){$('toast').textContent=s;$('toast').hidden=false;clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('toast').hidden=true,4500)}
function svgEl(tag,attrs={}){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e}
function drawCities(){window.PlaceLabels.draw($('map'),{data:D.root==='DE'?window.ATLAS_PLACES_DE:window.ATLAS_PLACES_BW,transform:{origin:D.root==='DE'?[4031.3,3551.5]:[4134.15,2964.4]},view:state.view,enabled:$('cities').checked})}
function setView(v){state.view=v;$('map').setAttribute('viewBox',v.join(' '));drawCities()}
function padded(b,p=.07){return [b[0]-b[2]*p,b[1]-b[3]*p,b[2]*(1+2*p),b[3]*(1+2*p)]}
function drawMap(){
 const svg=$('map');svg.replaceChildren();
 svg.append(svgEl('path',{d:D.layers[D.root],fill:'#fafbf7',stroke:'#87988b','stroke-width':.22,'fill-rule':'evenodd'}));
 const rasters=definition().rasters;
 for(const [id,key] of [['agriculture','AGRICULTURE'],['arable','ARABLE']])if($(id).checked&&rasters?.[key])svg.append(svgEl('image',{href:rasters[key],x:0,y:0,width:D.bounds[2],height:D.bounds[3],opacity:.82,'data-layer':id}));
 const opacity=Number($('opacity').value)/100;
 for(const [id,key] of [['wsg','WSG'],['nsg','NSG'],['overlap','BOTH']])if($(id).checked&&(key!=='BOTH'||($('wsg').checked&&$('nsg').checked)))svg.append(svgEl('path',{d:D.layers[key],fill:colors[key],opacity,'fill-rule':'evenodd','data-layer':id}));
 for(const c of D.counties){const selected=state.region===c.id;const path=svgEl('path',{d:c.path,fill:selected?'#fff1a323':'transparent',stroke:selected?'#203e32':($('county').checked?'#465d50':'none'),'stroke-width':selected?.75:.2,'fill-rule':'evenodd','data-county':c.id,class:'county-hit','vector-effect':'non-scaling-stroke'});if($('county').checked||selected)path.setAttribute('stroke-width',selected?'2.2':'0.7');svg.append(path)}
 if($('stateLines').checked)for(const s of D.states||[])svg.append(svgEl('path',{d:s.path,fill:'none',stroke:'#213e32','stroke-width':1.5,'vector-effect':'non-scaling-stroke','pointer-events':'none'}));
 if(state.region.startsWith('state:')){const s=D.states.find(s=>s.id===state.region);svg.append(svgEl('path',{d:s.path,fill:'none',stroke:'#132e24','stroke-width':2.8,'vector-effect':'non-scaling-stroke','pointer-events':'none'}))}
 if($('labels').checked)for(const c of D.counties){const t=svgEl('text',{x:c.anchor[0],y:c.anchor[1],'font-size':2.5,'text-anchor':'middle',class:'county-label'});t.textContent=c.name+(c.kind==='Stadtkreis'?' (Stadt)':'');svg.append(t)}
 setView(state.view);
}
function updateStats(){
 const def=definition(),p=currentProtection();$('regionTitle').textContent=regionName();$('definitionNote').textContent=def.note;
 $('agLabel').textContent=state.definition==='fiona'?'Beantragte Landwirtschaft':'Landwirtschaftsfläche';$('arableLabel').textContent=state.definition==='fiona'?'Beantragtes Ackerland':'Ackerland';
 for(const [cat,id] of [['TOTAL','total'],['AGRICULTURE','ag'],['ARABLE','arable']]){
  const r=row(cat,p||'EITHER');$(id+'Metric').textContent=r?pct(p?percentage(cat,p):0):'–';$(id+'Area').textContent=r?`${format(p?r.protected_ha:0)} von ${format(r.denominator_ha)} ha`:'Für dieses Gebiet keine Daten';
 }
 $('metricNote').textContent=(p?`Anteile in ${titles[p]} · `:'Keine Schutzgebietsebene aktiviert · ')+def.title+(def.custom?' · Eigene Daten, nicht amtlich geprüft':'');
 $('resultsBody').replaceChildren();for(const p of ['NSG','WSG','BOTH','EITHER']){const tr=document.createElement('tr');for(const s of [titles[p],...['TOTAL','AGRICULTURE','ARABLE'].map(c=>pct(percentage(c,p)))]){const td=document.createElement('td');td.textContent=s;tr.append(td)}$('resultsBody').append(tr)}
 $('scopeNote').textContent=def.custom?`${def.note} Eigene Ergebnisdaten, hier nicht unabhängig geprüft. Keine Geometrie für diese Definition geladen.`:state.definition==='fiona'?'FIONA bildet veröffentlichte Antragsflächen ab. Die räumliche Summe liegt rund 4,24 % unter der amtlichen Antragsübersicht. Keine Hochrechnung auf die gesamte Landwirtschaftsfläche.':(D.root==='DE'?'Deutschland: '+def.note+' Die Länderwerte werden aus ihren Kreisen aggregiert. Baden-Württemberg ist hier mit der Bundeskulisse enthalten; die bisherige LUBW-/FIONA-Auswertung findest du in der BW-Detailansicht.':'Das Landbedeckungsmodell enthält auch extensive Nutzungen und landwirtschaftliche Betriebsbestandteile. Seine Landwirtschaftsfläche ist eine geografische Näherung.');
 $('agriculture').disabled=$('arable').disabled=!def.rasters;
 $('opacityValue').textContent=$('opacity').value+' %';
 const legend=document.querySelector('.map-legend');legend.replaceChildren();for(const [id,key,label]of [['agriculture','AGRICULTURE','Landwirtschaft'],['arable','ARABLE','Ackerland'],['nsg','NSG','NSG'],['wsg','WSG','WSG'],['overlap','BOTH','Beide']]){if(!$(id).checked||(key==='BOTH'&&(!$('nsg').checked||!$('wsg').checked))||(['AGRICULTURE','ARABLE'].includes(key)&&!def.rasters))continue;const span=document.createElement('span'),i=document.createElement('i');i.style.setProperty('--swatch',colors[key]);span.append(i,document.createTextNode(label));legend.append(span)}
}
function render(){drawMap();updateStats();drawCities()}
function fillRegions(filter='all'){
 $('region').replaceChildren();const add=(id,name)=>{const o=document.createElement('option');o.value=id;o.textContent=name;$('region').append(o)};
 add(D.root,'Ganz '+D.rootName);
 for(const c of [...D.counties].filter(c=>filter==='all'||'state:'+c.state_id===filter).sort((a,b)=>a.name.localeCompare(b.name,'de')))add(c.id,c.name+' · '+c.kind);
}
function chooseRegion(id,zoom=true){
 state.region=id;
 $('region').value=id;if(zoom)setView(padded(id===D.root?D.bounds:[...(D.states||[]),...D.counties].find(c=>c.id===id).bounds,.12));render()
}
function configureData(){
 $('scopeHelp').textContent=D.root==='DE'?'Deutschlandweite Übersicht mit einheitlicher Bundeskulisse.':'Detailansicht mit landesspezifischen Daten (LUBW / FIONA). Werte können von der Deutschlandübersicht abweichen.';
 $('definition').replaceChildren();for(const d of Object.values(D.definitions)){const o=document.createElement('option');o.value=d.id;o.textContent=d.title;if(d.custom)o.id='customOption';$('definition').append(o)}
 state.definition=D.defaultDefinition;$('definition').value=state.definition;state.region=D.root;state.view=padded(D.bounds);
 $('stateLayer').hidden=D.root!=='DE';
 fillRegions();$('region').value=D.root;$('removeCustom').hidden=!D.definitions.custom;$('importMessage').textContent='';
 $('rasterNote').textContent=`Ackerland ist Teil der Landwirtschaftsfläche. Kartendarstellung: ${D.rasterSize}-m-Raster; Kennzahlen aus Originalgeometrien.`;
 $('protectionNote').textContent=D.root==='DE'?'Bundeskulisse: BfN-NSG 2024, Auswahl STATUS=1 (32 Einträge mit STATUS=2 ausgeschlossen), und festgesetzte Trinkwasserschutzgebiete von WasserBLIcK/BfG. WSG-Länderlieferungen mit unterschiedlichen Datenständen (2017–2026), Abruf 19.10.2026. Kein einheitlicher Rechtsstand.':'LUBW-Schutzkulisse: Abruf 19.10.2026. Kein einheitlicher historischer Datenstand. Ein Gebietsstatus bedeutet keine überall gleichen Bewirtschaftungsauflagen.';
 document.querySelectorAll('a.method-link').forEach(a=>a.href=D.root==='DE'?'Methodik_de.txt':'Methodik_bw.txt');
 document.querySelector('.brand small').textContent=D.rootName;
 $('map').setAttribute('aria-label','Interaktive Karte der Schutzgebiete und Flächennutzung: '+D.rootName);
 $('footerText').textContent=D.root==='DE'?'WasserBLIcK/BfG und zuständige Behörden der Länder, 19.10.2026 · BfN nach Angaben der Länder · © BKG (2026) · Eigene Auswertung. Bezugsfläche: VG250 GF4 ohne Meer und Bodensee.':'Grundlage: UIS der LUBW · MLR · © BKG (2026) · Eigene Auswertung. Landesfläche ohne Bodensee.';
 render();
}
const scriptLoads=new Map();
function loadDataScript(src){if(!scriptLoads.has(src))scriptLoads.set(src,new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>{s.remove();scriptLoads.delete(src);reject(Error('Kartendaten konnten nicht geladen werden.'))};document.head.append(s)}));return scriptLoads.get(src)}
async function ensureRasters(data,key){const def=data.definitions[key];if(!def.rasters&&def.rasterSource){if(!window.ATLAS_DE_RASTERS?.[key])await loadDataScript(def.rasterSource);def.rasters=window.ATLAS_DE_RASTERS?.[key];if(!def.rasters)throw Error('Landwirtschaftsdarstellung nicht verfügbar.')}}
async function ensureVectors(data){if(data.vectorSources&&!data.vectorsLoaded){await Promise.all(data.vectorSources.map(loadDataScript));data.vectorsLoaded=true}}
async function switchScope(scope){
 const select=$('scope');select.disabled=true;$('definition').disabled=true;$('loadStatus').hidden=false;$('loadStatus').textContent='Kartenansicht wird geladen …';
 try{if(scope==='DE'&&!window.ATLAS_DE)await loadDataScript('data-de.js');
 const target=scope==='DE'?window.ATLAS_DE:BW_DATA;await Promise.all([ensureRasters(target,target.defaultDefinition),ensureVectors(target),target.root==='DE'&&!window.ATLAS_PLACES_DE?loadDataScript('places-de.js'):Promise.resolve()]);
 D=target;sources=[...(D.sources||BW_SOURCES),['Städte und Orte · GeoNames','Ortspunkte aus cities500, Abruf 19.10.2026; CC BY 4.0. Einwohnerzahlen dienen nur der Beschriftungspriorität. Keine Stadtgrenzen oder vollständige Ortsliste.','https://www.geonames.org/export/','Quelle und Download']];configureData();$('loadStatus').hidden=true;
 }catch(e){select.value=D.root;$('loadStatus').textContent=e.message+' Die bisherige Ansicht bleibt verfügbar.';}finally{document.body.classList.remove('initial-loading');select.disabled=false;$('definition').disabled=false}
}
$('scope').onchange=e=>switchScope(e.target.value);
fillRegions();
$('definition').addEventListener('change',async e=>{const data=D,key=e.target.value;$('definition').disabled=true;try{await ensureRasters(data,key);if(data===D){state.definition=key;render()}}catch(err){$('definition').value=state.definition;toast(err.message)}finally{$('definition').disabled=false}});$('region').addEventListener('change',e=>chooseRegion(e.target.value));
for(const id of layerIds)$(id).addEventListener('change',render);$('opacity').addEventListener('input',render);
$('defaults').onclick=()=>{for(const id of layerIds)$(id).checked=id!=='labels';$('opacity').value=80;render()};
function zoom(factor,point){const [x,y,w,h]=state.view;const nw=Math.max(2,Math.min(D.bounds[2]*1.6,w*factor)),k=nw/w;const p=point||{x:x+w/2,y:y+h/2};setView([p.x+(x-p.x)*k,p.y+(y-p.y)*k,nw,h*k])}
$('zoomIn').onclick=()=>zoom(.75);$('zoomOut').onclick=()=>zoom(1.3);$('resetView').onclick=()=>chooseRegion(D.root);
function point(e){return new DOMPoint(e.clientX,e.clientY).matrixTransform($('map').getScreenCTM().inverse())}
$('map').addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.12:.89,point(e))},{passive:false});
$('map').addEventListener('pointerdown',e=>{if(e.button!==0)return;state.drag={start:point(e),view:[...state.view],client:[e.clientX,e.clientY],county:e.target.dataset.county};$('map').setPointerCapture(e.pointerId)});
$('map').addEventListener('pointermove',e=>{if(state.drag){const p=point(e),d=state.drag;setView([state.view[0]+d.start.x-p.x,state.view[1]+d.start.y-p.y,state.view[2],state.view[3]])}else{const c=D.counties.find(c=>c.id===e.target.dataset.county);$('hoverLabel').hidden=!c;if(c)$('hoverLabel').textContent=c.name+' · '+c.kind}});
$('map').addEventListener('pointerup',e=>{const d=state.drag;state.drag=null;if(d&&Math.hypot(e.clientX-d.client[0],e.clientY-d.client[1])<5&&d.county)chooseRegion(d.county);if($('map').hasPointerCapture(e.pointerId))$('map').releasePointerCapture(e.pointerId)});
$('map').addEventListener('pointercancel',()=>state.drag=null);$('map').addEventListener('pointerleave',()=>$('hoverLabel').hidden=true);
$('map').addEventListener('keydown',e=>{if(e.key==='+'||e.key==='='){e.preventDefault();zoom(.75)}if(e.key==='-'){e.preventDefault();zoom(1.3)}if(e.key==='Home'){e.preventDefault();chooseRegion(D.root)}});
function openSources(){const extra=definition().sources||[];$('sourcesContent').innerHTML=sources.concat(extra.map(s=>[s.title,'Quelle der importierten Definition',s.url,'Quelle öffnen'])).map(([title,note,url,label])=>`<article class="source"><h3>${esc(title)}</h3><p>${esc(note)}</p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a></article>`).join('');$('sourcesDialog').showModal()}
$('sourcesBtn').onclick=$('methodBtn').onclick=openSources;$('dataBtn').onclick=()=>$('dataDialog').showModal();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000)}
function exportSvg(){
 const clone=$('map').cloneNode(true);clone.removeAttribute('id');clone.removeAttribute('tabindex');clone.removeAttribute('role');clone.setAttribute('x','30');clone.setAttribute('y','150');clone.setAttribute('width','1020');clone.setAttribute('height','930');
 clone.querySelectorAll('.county-hit').forEach(e=>{e.removeAttribute('class');e.removeAttribute('data-county')});clone.querySelectorAll('.county-label').forEach(e=>{e.setAttribute('font-family','Arial, sans-serif');e.setAttribute('fill','#233c36');e.setAttribute('stroke','#fff');e.setAttribute('stroke-width','.6');e.setAttribute('paint-order','stroke')});
 window.PlaceLabels.draw(clone,{data:D.root==='DE'?window.ATLAS_PLACES_DE:window.ATLAS_PLACES_BW,transform:{origin:D.root==='DE'?[4031.3,3551.5]:[4134.15,2964.4]},view:state.view,enabled:$('cities').checked,exportSize:[1020,930],visibleIds:new Set([...$('map').querySelectorAll('[data-place]')].map(e=>e.getAttribute('data-place')))});
 const p=currentProtection(),def=definition();const text=(x,y,s,size=18,weight=400)=>`<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}">${esc(s)}</text>`;
 const scale=Math.min(1020/state.view[2],930/state.view[3]);const distance=[.5,1,2,5,10,20,50,100].filter(d=>d*scale<=180).pop()||.5;
 const scaleBar=`<rect x="55" y="1015" width="${distance*scale+25}" height="51" fill="white" opacity=".9"/><path d="M65 1046h${distance*scale}M65 1041v10M${65+distance*scale} 1041v10" fill="none" stroke="#233c36" stroke-width="2"/>${text(65,1035,format(distance, distance<1?1:0)+' km',14)}`;
 let side=text(1100,185,'Sichtbare Schutzkulisse',22,700)+text(1100,218,p?titles[p]:'Keine Schutzgebiete',18);
 let y=270;for(const [cat,label] of [['TOTAL','Gesamtfläche'],['AGRICULTURE','Landwirtschaft'],['ARABLE','Ackerland']]){const r=row(cat,p||'EITHER');side+=text(1100,y,label,18)+text(1100,y+44,r?pct(p?percentage(cat,p):0):'Keine Daten',34,600)+text(1100,y+73,r?`${format(p?r.protected_ha:0)} / ${format(r.denominator_ha)} ha`:'',15);y+=125}
 side+=text(1100,695,'Sichtbare Ebenen',20,700);y=730;for(const [id,key,label] of [['agriculture','AGRICULTURE',`Landwirtschaft (${D.rasterSize} m)`],['arable','ARABLE',`Ackerland (${D.rasterSize} m)`],['nsg','NSG','Naturschutzgebiete'],['wsg','WSG','Wasserschutzgebiete'],['overlap','BOTH','Überschneidung']]){if($(id).checked&&(key!=='BOTH'||($('nsg').checked&&$('wsg').checked))&&(!['AGRICULTURE','ARABLE'].includes(key)||def.rasters)){side+=`<rect x="1100" y="${y-13}" width="16" height="16" fill="${colors[key]}"/>`+text(1127,y,label,16);y+=30}}
 if($('cities').checked)side+=text(1100,900,'● Städtenamen · GeoNames',16);
 side+=text(1100,920,'Definition: '+def.title,14)+text(1100,950,'Keine Gleichsetzung mit statistischer LF.',15)+text(1100,980,'Schutzgebiete: Abruf 19.10.2026',15);
 const meta=JSON.stringify({definition:def.title,region:regionName(),sources:[...sources.map(s=>({title:s[0],url:s[2]})),...(def.sources||[])],scope:def.note,cityLabels:$('cities').checked?{source:'GeoNames',license:'CC BY 4.0',ids:[...clone.querySelectorAll('[data-place]')].map(e=>e.getAttribute('data-place'))}:null});
 return `<svg xmlns="${NS}" width="1600" height="1200" viewBox="0 0 1600 1200"><metadata>${esc(meta)}</metadata><rect width="1600" height="1200" fill="white"/><g font-family="Arial, sans-serif" fill="#233c36">${text(40,55,'Wasser- und Naturschutzgebiete',34,700)}${text(40,96,regionName(),22)}${new XMLSerializer().serializeToString(clone)}${scaleBar}${side}${text(40,1120,(D.root==='DE'?'WasserBLIcK/BfG & Länder, 19.10.2026 · BfN nach Angaben der Länder · © BKG (2026) · CC BY 4.0 / dl-de/by-2-0 · Eigene Auswertung':'Grundlage: UIS der LUBW · MLR (2026), dl-de/by-2-0 · © BKG (2026), dl-de/by-2-0 / LBM: CC BY 4.0 · Eigene Auswertung'),14)}${text(40,1148,`Landwirtschaftsdarstellung: ${D.rasterSize}-m-Raster. Grenzen zur Anzeige vereinfacht; Flächenwerte aus unvereinfachten Geometrien.`,14)}${text(40,1176,'Ortsnamen: GeoNames (CC BY 4.0), geonames.org · VG250 GF4 ohne Meer/Bodensee. Quellenlinks in SVG-Metadaten.',14)}</g></svg>`;
}
$('svgExport').onclick=()=>{download(new Blob([exportSvg()],{type:'image/svg+xml;charset=utf-8'}),`Schutzgebiete_${state.region}_${state.definition}.svg`);toast('SVG mit aktuellem Ausschnitt, Ebenen und Quellen exportiert.')};
$('pngExport').onclick=async()=>{const btn=$('pngExport'),filename='Schutzgebiete_'+state.region+'_'+state.definition+'.png';btn.disabled=true;try{const url=URL.createObjectURL(new Blob([exportSvg()],{type:'image/svg+xml;charset=utf-8'}));const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url});const c=document.createElement('canvas');c.width=3200;c.height=2400;c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG konnte nicht erzeugt werden');download(blob,filename);toast('PNG (3200 × 2400 Pixel) exportiert.')}catch(e){toast('PNG-Export fehlgeschlagen. Bitte SVG-Export verwenden.')}finally{btn.disabled=false}};
$('printBtn').onclick=()=>{let container=$('printOutput');if(!container){container=document.createElement('div');container.id='printOutput';document.body.append(container)}container.innerHTML=exportSvg();setTimeout(()=>window.print(),200)};
$('csvExport').onclick=()=>{const lines=[['Gebiet','Definition','Bezugsfläche','Schutztyp','Bezugsfläche ha','geschützt ha','Anteil Prozent']];for(const [id,rows]of Object.entries(definition().records)){const name=regionName(id);for(const r of rows)lines.push([name,definition().title,r.land_category,r.protection,r.denominator_ha,r.protected_ha,r.denominator_ha?100*r.protected_ha/r.denominator_ha:''])}const csv=lines.map(l=>l.map(v=>'"'+String(typeof v==='number'?String(v).replace('.',','):v).replaceAll('"','""')+'"').join(';')).join('\r\n');download(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),`Kreise_${state.definition}.csv`)};
function packageDefinition(){return {schema:D.root==='BW'?'schutzgebiete-bw-definition-v1':'schutzgebiete-de-definition-v1',boundary:D.boundary,protection:D.protection,title:definition().title,note:definition().note,year:definition().year,sources:definition().sources||sources.map(s=>({title:s[0],url:s[2]})),records:definition().records}}
$('templateBtn').onclick=()=>download(new Blob([JSON.stringify(packageDefinition(),null,2)],{type:'application/json'}),'Flaechendefinition_Vorlage.json');
function validateDefinition(x){
 if(x?.schema!==(D.root==='BW'?'schutzgebiete-bw-definition-v1':'schutzgebiete-de-definition-v1')||x.boundary!==D.boundary||x.protection!==D.protection)throw Error('Schema, Gebietsgrenzen oder Schutzkulisse passen nicht. Bitte die JSON-Vorlage verwenden.');
 if(typeof x.title!=='string'||x.title.length<3||x.title.length>80||typeof x.note!=='string'||x.note.length>1500||!Number.isInteger(x.year)||x.year<1900||x.year>2100)throw Error('Titel, Beschreibung oder Jahr ist ungültig.');
 if(!Array.isArray(x.sources)||!x.sources.length||x.sources.length>20||x.sources.some(s=>typeof s.title!=='string'||s.title.length>150||typeof s.url!=='string'||!/^https:\/\//i.test(s.url)))throw Error('Mindestens eine Quelle mit HTTPS-Link ist erforderlich.');
 if(!x.records||!x.records[D.root]||Object.keys(x.records).some(k=>k!==D.root&&![...(D.states||[]),...D.counties].some(c=>c.id===k)))throw Error('Gebietskennungen sind ungültig oder das Gesamtgebiet fehlt.');
 const required=['NSG','WSG','BOTH','EITHER','NSG_ONLY','WSG_ONLY'];
 for(const [id,rows]of Object.entries(x.records)){
  if(!Array.isArray(rows)||rows.length!==18)throw Error('Je Gebiet werden 18 Zeilen benötigt: drei Bezugsflächen × sechs Schutztypen.');
  for(const cat of ['TOTAL','AGRICULTURE','ARABLE']){const subset=rows.filter(r=>r.land_category===cat);if(subset.length!==6||required.some(p=>subset.filter(r=>r.protection===p).length!==1))throw Error('Doppelte oder fehlende Kennzahl.');const t=Object.fromEntries(subset.map(r=>[r.protection,r]));for(const r of subset){if(!Number.isFinite(r.denominator_ha)||!Number.isFinite(r.protected_ha)||r.denominator_ha<=0||r.protected_ha<0||r.protected_ha>r.denominator_ha||Math.abs(r.denominator_ha-t.NSG.denominator_ha)>.001)throw Error('Ungültige Flächenwerte.')}if(Math.abs(t.NSG.protected_ha+t.WSG.protected_ha-t.BOTH.protected_ha-t.EITHER.protected_ha)>.02||Math.abs(t.NSG_ONLY.protected_ha+t.BOTH.protected_ha-t.NSG.protected_ha)>.02||Math.abs(t.WSG_ONLY.protected_ha+t.BOTH.protected_ha-t.WSG.protected_ha)>.02)throw Error('Flächenidentitäten stimmen nicht.');if(cat==='TOTAL'){const ref=D.definitions[D.defaultDefinition].records[id];if(!ref||subset.some(r=>{const s=ref.find(s=>s.land_category===cat&&s.protection===r.protection);return Math.abs(s.denominator_ha-r.denominator_ha)>.1||Math.abs(s.protected_ha-r.protected_ha)>.1}))throw Error('Die Gesamtfläche/Schutzkulisse weicht von diesem Atlas ab.')}}
  const den=cat=>rows.find(r=>r.land_category===cat).denominator_ha;if(den('ARABLE')>den('AGRICULTURE')||den('AGRICULTURE')>den('TOTAL'))throw Error('Ackerland muss Teil der Landwirtschaftsfläche sein.');
  for(const p of required){const a=cat=>rows.find(r=>r.land_category===cat&&r.protection===p).protected_ha;if(a('ARABLE')>a('AGRICULTURE')+.001||a('AGRICULTURE')>a('TOTAL')+.001)throw Error('Geschütztes Ackerland muss innerhalb der geschützten Landwirtschaftsfläche liegen; diese innerhalb der gesamten Schutzfläche.');}
 }
 return {id:'custom',title:x.title,note:x.note,year:x.year,sources:x.sources,records:x.records,custom:true};
}
$('dataUpload').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>12000000)throw Error('Datei ist größer als 12 MB.');const def=validateDefinition(JSON.parse(await f.text()));D.definitions.custom=def;let o=$('customOption');if(!o){o=document.createElement('option');o.id='customOption';o.value='custom';$('definition').append(o)}o.textContent='Eigene Daten · '+def.title;state.definition='custom';$('definition').value='custom';if(!def.records[state.region])state.region=D.root;$('region').value=state.region;$('removeCustom').hidden=false;$('importMessage').textContent='Definition geladen. Formale Prüfungen bestanden; keine amtliche Validierung.';render();toast('Eigene Definition geladen. Landwirtschaftsgeometrien sind für diesen Import nicht verfügbar.')}catch(err){$('importMessage').textContent=err.message}finally{e.target.value=''}};
$('removeCustom').onclick=()=>{delete D.definitions.custom;$('customOption')?.remove();state.definition=D.defaultDefinition;$('definition').value=state.definition;$('removeCustom').hidden=true;$('importMessage').textContent='Eigene Definition entfernt.';render()};
new ResizeObserver(()=>drawCities()).observe($('map'));
function fitMapToViewport(){
 const header=document.querySelector('body>header'),top=document.querySelector('.workspace-top');
 // Document layout is independent of scroll position, so scrolling never resizes the map.
 const available=window.innerHeight-header.offsetHeight-18;
 document.documentElement.style.setProperty('--map-panel-height',Math.max(120,available)+'px');
}
new ResizeObserver(fitMapToViewport).observe(document.querySelector('body>header'));
new ResizeObserver(fitMapToViewport).observe(document.querySelector('.workspace-top'));
window.addEventListener('resize',fitMapToViewport);fitMapToViewport();
configureData();document.body.classList.add('initial-loading');$('regionTitle').textContent='Deutschland';$('scope').value='DE';switchScope('DE');
