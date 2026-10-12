/* OTTO LEGO v6: projetos reais publicados. NUNCA gera ou altera desenhos.
   Duas chaves distintas preservam dados históricos sem fingir reserva de peças. */
(()=>{"use strict";
 const DATA=Array.isArray(window.OTTO_CATALOGO_REAL)?window.OTTO_CATALOGO_REAL:[];
 const BY=new Map(DATA.map(x=>[x.id,x])),KEY="otto-lego-reais:v1",LEGACY="otto3d:v1";
 const $=id=>document.getElementById(id);
 const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const statuses=["quero","montando","concluido","desmontado"];
 const label={quero:"Quero montar",montando:"Montando",concluido:"Concluído",desmontado:"Desmontado"};
 const read=k=>{try{return JSON.parse(localStorage.getItem(k)||"null");}catch{return null;}};
 const clean=v=>{
  const out={version:1,entries:[]},used=new Set();
  if(v?.version!==1||!Array.isArray(v.entries))return out;
  for(const e of v.entries)if(BY.has(e?.id)&&!used.has(e.id)){
   out.entries.push({id:e.id,status:statuses.includes(e.status)?e.status:"quero",updatedAt:String(e.updatedAt||"").slice(0,40)});used.add(e.id);
  }
  return out;
 };
 let state=clean(read(KEY)),mode="todos",selected=null,oldShown=false,oldViewer=null,oldProject=null,oldStep=0,timeout=null;
 const item=id=>state.entries.find(x=>x.id===id);
 const alertText=(text,bad=false)=>{const box=$("toast");box.textContent=text;box.style.background=bad?"#893440":"#203b6e";box.classList.add("show");clearTimeout(timeout);timeout=setTimeout(()=>box.classList.remove("show"),3200);};
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch{alertText("Sem espaço para salvar no celular.",true);return false;}};
 const safe=url=>{try{const u=new URL(url);return u.protocol==="https:"&&["www.lego.com","rebrickable.com","www.rebrickable.com"].includes(u.hostname);}catch{return false;}};
 const source=(anchor,url)=>{if(!safe(url))return;anchor.href=url;anchor.target="_blank";anchor.rel="noopener noreferrer";};
 function catalog(){
  const q=$("search").value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const matches=DATA.filter(p=>(mode==="todos"||(mode==="lego"?p.origem==="LEGO oficial":p.origem!=="LEGO oficial"))&&
   [p.titulo,p.autor,p.categoria,p.origem].join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(q));
  $("catalogNumber").textContent=DATA.length;$("foundCount").textContent=matches.length+" projeto(s) com fontes reais.";
  $("catalogGrid").innerHTML=matches.map(p=>'<article class="build"><div class="build-top"><span class="build-icon" aria-hidden="true">'+esc(p.icone)+'</span><span class="kind">'+esc(p.categoria)+'</span></div><div class="build-body"><div class="by">'+esc(p.origem)+'</div><h3>'+esc(p.titulo)+'</h3><p>'+esc(p.detalhe)+'</p><p class="mini">'+(p.totalPecas==null?"Peças detalhadas: ainda não auditadas":p.totalPecas+" peças segundo o autor")+'</p><div class="build-actions"><button class="main" data-open="'+esc(p.id)+'">Ver instruções</button><button data-view3d="'+esc(p.id)+'">◉ 3D</button><button data-add="'+esc(p.id)+'" '+(item(p.id)?"disabled":"")+'>'+(item(p.id)?"Na cidade ✓":"+ Cidade")+'</button></div></div></article>').join("")||
  '<div class="empty">Nenhum projeto desta fonte com esse nome. Tente outra busca.</div>';
 }
 function city(){
  $("cityNumber").textContent=state.entries.length;
  $("cityRows").innerHTML=state.entries.map(e=>{
   const p=BY.get(e.id);if(!p)return "";
   const action=e.status==="quero"?"Iniciar montagem":e.status==="montando"?"Marcar concluído":e.status==="concluido"?"Desmontar":"Montar novamente";
   return '<div class="city-row"><div><b>'+esc(p.titulo)+'</b><small>'+esc(p.origem)+" · "+esc(p.autor)+'</small></div><span class="status">'+label[e.status]+'</span><div class="actions"><button data-open="'+esc(p.id)+'">Manual</button><button data-view3d="'+esc(p.id)+'">◉ 3D</button><button class="main" data-next="'+esc(p.id)+'">'+action+'</button><button data-remove="'+esc(p.id)+'">Tirar</button></div></div>';
  }).join("")||'<div class="empty">A cidade está vazia. Adicione um projeto real do catálogo.</div>';
 }
 function oldState(){const x=read(LEGACY);return x?.version===1&&Array.isArray(x.projects)&&Array.isArray(x.catalog)?x:null;}
 function oldSummary(){
  const old=oldState(),lots=old?.catalog?.length||0,count=old?.catalog?.reduce((v,x)=>v+(Number.isSafeInteger(Number(x.quantity))?Number(x.quantity):0),0)||0,n=old?.projects?.length||0;
  $("stockStatus").textContent="Inventário antigo preservado: "+count+" peças em "+lots+" combinações de código e cor, mais "+n+" projetos antigos. Não descontamos peças dos novos manuais sem uma lista exata por código.";
  $("legacyCount").textContent=n+" projetos antigos preservados separadamente, sem fonte oficial comprovada.";
  if(oldShown)renderOld();
 }
 function render(){catalog();city();oldSummary();}
 function add(id){
  if(!BY.has(id)||item(id))return;
  const next={id,status:"quero",updatedAt:new Date().toISOString()};state.entries.push(next);
  if(!save()){state.entries.pop();return;}render();alertText("Projeto real adicionado à cidade.");
 }
 function next(id){
  const row=item(id);if(!row)return;
  if(row.status==="concluido"&&!confirm("Otto desmontou essa construção?"))return;
  const old=row.status;row.status={quero:"montando",montando:"concluido",concluido:"desmontado",desmontado:"montando"}[old];
  if(!save()){row.status=old;return;}render();
 }
 function remove(id){
  if(!item(id)||!confirm("Retirar da cidade? O manual original continuará disponível."))return;
  const old=state.entries;state.entries=old.filter(x=>x.id!==id);
  if(!save()){state.entries=old;return;}render();
 }
 function open(id){
  const p=BY.get(id);if(!p||!safe(p.manual))return;selected=p;
  $("detailTitle").textContent=p.titulo;$("detailAuthor").textContent=p.origem+" • "+p.autor;
  $("detailInfo").textContent=p.detalhe+". "+(p.totalPecas==null?"Lista individual de peças ainda não conferida.":p.totalPecas+" peças declaradas pelo autor; lista por código ainda não conferida.");
  source($("originalSource"),p.fonte);source($("openManual"),p.manual);
  const box=$("manualFrame");box.replaceChildren();
  if(p.tipoManual==="pdf"){
   const frame=document.createElement("iframe");frame.src=p.manual+"#page=1&view=FitH";frame.title="Manual LEGO original de "+p.titulo;frame.loading="lazy";
   box.append(frame);
  }else{
   const v=document.createElement("div");v.className="external";
   const title=document.createElement("h3");title.textContent=p.titulo+" — "+p.autor;
   const desc=document.createElement("p");desc.textContent="O manual real está na página do autor no Rebrickable. Abra o site para ver as instruções originais.";
   const a=document.createElement("a");a.className="buttonlink main";a.textContent="Ver manual do autor ↗";source(a,p.manual);
   v.append(title,desc,a);box.append(v);
  }
  $("addToCity").disabled=!!item(id);$("addToCity").textContent=item(id)?"Na cidade ✓":"+ Adicionar à cidade";
  $("projectDetail").classList.add("open");$("projectDetail").setAttribute("aria-hidden","false");document.body.style.overflow="hidden";
  $("closeDetail").focus();
 }
 function close(){
  $("projectDetail").classList.remove("open");$("projectDetail").setAttribute("aria-hidden","true");$("manualFrame").replaceChildren();
  document.body.style.overflow="";selected=null;
 }
 function renderOld(){
  const old=oldState();
  $("legacyRows").innerHTML=(old?.projects||[]).map((p,i)=>'<div class="legacy-item"><div><b>'+esc(p.name||"Projeto anterior")+'</b><div class="mini">'+(p.pieces?.length||0)+' peças • histórico não verificado</div></div><button data-legacy="'+i+'">3D antigo</button></div>').join("")||'<div class="empty">Nenhum projeto antigo encontrado.</div>';
 }
 function oldControls(){
  const len=oldProject?.pieces?.length||0;$("legacyStep").textContent=oldStep+" / "+len;
  ["legacyTurn","legacyZoomIn","legacyZoomOut","legacyReset"].forEach(k=>$(k).disabled=!len);
  $("legacyPrev").disabled=!len||oldStep<=0;$("legacyNext").disabled=!len||oldStep>=len;
 }
 function showOld(i){
  const p=oldState()?.projects?.[i];
  if(!Array.isArray(p?.pieces)||!p.pieces.length||!window.OTTO3D){alertText("Não há geometria antiga para exibir.",true);return;}
  oldProject=p;oldStep=p.pieces.length;
  if(!oldViewer)oldViewer=window.OTTO3D.create($("legacyView"),{onStatus:()=>{}});
  oldViewer.setModel(p.pieces,oldStep);oldControls();
 }
 function backup(){
  const file={format:"OTTO-CATALOGO-REAL-v1",exportedAt:new Date().toISOString(),library:state,previous:oldState()};
  const url=URL.createObjectURL(new Blob([JSON.stringify(file,null,2)],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download="OTTO-LEGO-backup-completo.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
 }
 async function restore(file){
  if(!file||file.size>2000000){alertText("Selecione backup JSON de até 2 MB.",true);return;}
  try{
   const raw=JSON.parse(await file.text());if(raw?.format!=="OTTO-CATALOGO-REAL-v1"||!Array.isArray(raw.library?.entries))throw Error("Formato incompatível");
   const lib=clean(raw.library),old=raw.previous;
   if(old!==null&&old!==undefined&&!(old.version===1&&Array.isArray(old.projects)&&Array.isArray(old.catalog)))throw Error("Histórico antigo inválido.");
   if(!confirm("Substituir a lista da cidade pelo backup selecionado?"))return;
   const a=localStorage.getItem(KEY),b=localStorage.getItem(LEGACY);
   try{localStorage.setItem(KEY,JSON.stringify(lib));if(old)localStorage.setItem(LEGACY,JSON.stringify(old));}
   catch(e){if(a!==null)localStorage.setItem(KEY,a);else localStorage.removeItem(KEY);if(b!==null)localStorage.setItem(LEGACY,b);else localStorage.removeItem(LEGACY);throw e;}
   state=lib;oldViewer=null;oldProject=null;$("legacyView").textContent="Abra um projeto antigo para visualizar em 3D.";oldControls();render();alertText("Backup restaurado.");
  }catch(e){alertText("Backup não restaurado: "+String(e.message||e),true);}
 }
 document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{
  mode=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(c=>c.classList.toggle("active",b===c));catalog();
 }));
 $("search").addEventListener("input",catalog);
 $("clearSearch").addEventListener("click",()=>{$("search").value="";catalog();});
 $("catalogGrid").addEventListener("click",e=>{
  const b=e.target.closest("[data-open],[data-add]");if(!b)return;
  if(b.dataset.open)open(b.dataset.open);else add(b.dataset.add);
 });
 $("cityRows").addEventListener("click",e=>{
  const b=e.target.closest("[data-open],[data-next],[data-remove]");if(!b)return;
  if(b.dataset.open)open(b.dataset.open);else if(b.dataset.next)next(b.dataset.next);else remove(b.dataset.remove);
 });
 $("closeDetail").addEventListener("click",close);$("projectDetail").addEventListener("click",e=>{if(e.target===$("projectDetail"))close();});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&selected)close();});
 $("addToCity").addEventListener("click",()=>{if(!selected)return;add(selected.id);$("addToCity").disabled=true;$("addToCity").textContent="Na cidade ✓";});
 $("toggleLegacy").addEventListener("click",()=>{oldShown=!oldShown;$("legacySection").classList.toggle("hidden",!oldShown);$("toggleLegacy").textContent=oldShown?"Ocultar projetos antigos":"Ver meus projetos antigos";oldSummary();});
 $("legacyRows").addEventListener("click",e=>{const b=e.target.closest("[data-legacy]");if(b)showOld(Number(b.dataset.legacy));});
 $("legacyTurn").addEventListener("click",()=>oldViewer?.rotate());
 $("legacyZoomIn").addEventListener("click",()=>oldViewer?.zoomBy(1.2));$("legacyZoomOut").addEventListener("click",()=>oldViewer?.zoomBy(1/1.2));$("legacyReset").addEventListener("click",()=>oldViewer?.resetView());
 $("legacyPrev").addEventListener("click",()=>{if(!oldProject||oldStep<=0)return;oldStep--;oldViewer?.setModel(oldProject.pieces,oldStep);oldControls();});
 $("legacyNext").addEventListener("click",()=>{if(!oldProject||oldStep>=oldProject.pieces.length)return;oldStep++;oldViewer?.setModel(oldProject.pieces,oldStep);oldControls();});
 $("downloadBackup").addEventListener("click",backup);$("restoreBackup").addEventListener("click",()=>$("backupFile").click());
 $("backupFile").addEventListener("change",e=>{restore(e.target.files?.[0]);e.target.value="";});
 render();
})();
