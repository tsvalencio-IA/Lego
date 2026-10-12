/* OTTO LEGO v5: 3D com controle livre, fallback local e preservação de otto3d:v1. */
(()=>{"use strict";
const el=id=>document.getElementById(id), TOTAL=790, KEY="otto3d:v1", G=window.OTTOGenerator;
const seed=Array.isArray(window.OTTO_SEED)?window.OTTO_SEED:[];
const colors={Black:"#252933","Bright Blue":"#2876e0",Blue:"#2876e0",Green:"#259b55","Dark Purple":"#744ba0","Dark Red":"#962b40",Red:"#db4646","Brick Yellow":"#d7b77b","Dark Tan":"#a28c77","Dark Pink":"#df5d9e",Yellow:"#eccc35",White:"#eeeefa"};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const key=p=>String(p.part)+"|"+String(p.color).toLowerCase();
const count=a=>a.reduce((n,p)=>n+Number(p.quantity||0),0);
const copy=o=>JSON.parse(JSON.stringify(o));
function read(){try{const a=JSON.parse(localStorage.getItem(KEY));if(a&&a.version===1&&Array.isArray(a.projects)&&Array.isArray(a.catalog))return a;}catch{}return {version:1,catalog:copy(seed),projects:[]};}
let data=read(),draft=null,index=0,angle=0,inCity=false,viewer=null;
function alertText(msg,bad=false){el("notice").textContent=msg;el("notice").className="notice "+(bad?"error":"ok");}
function saveData(){try{localStorage.setItem(KEY,JSON.stringify(data));return true;}catch{alertText("Não foi possível gravar. Faça um backup.",true);return false;}}
function reserved(skip=null){const b=new Map();for(const p of data.projects){if(p.status==="desmontado"||p.id===skip)continue;for(const part of p.pieces||[]){const k=key(part);b.set(k,(b.get(k)||0)+1);}}return b;}
function missing(pieces,except=null,catalog=data.catalog){const existing=new Map(catalog.map(x=>[key(x),Number(x.quantity)])),busy=reserved(except),need=new Map();for(const p of pieces||[]){let k=key(p);need.set(k,(need.get(k)||0)+1);}return [...need].flatMap(([k,n])=>{const free=(existing.get(k)||0)-(busy.get(k)||0);return n>free?[k+": faltam "+(n-Math.max(0,free))]:[];});}
function unsupported(text){const q=String(text).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(),rx=/\b(carro|caminhao|caminhoes|robo|animal|gato|cachorro|sapo|dinossauro|foguete|helicoptero|aviao|barco|trem|trator|moto|escavadeira|guindaste|pontes?|rodas?|pneus?|eixos?|motor|engrenagens?|articulad[oa]|dobradicas?|janela|janelas|portas?|mecanismo|eletrico|movel|moveis|levantar|levanta|girar|gira|piscina|garagem|cidade|bairro)\b/;return q.match(rx)?.[0]||null;}
function metrics(){const total=count(data.catalog),used=[...reserved().values()].reduce((a,b)=>a+b,0);el("known").textContent=total;el("busy").textContent=used;el("free").textContent=Math.max(0,total-used);el("inventoryInfo").textContent=data.catalog.length+" códigos/cores registrados";el("cityCount").textContent=data.projects.length+" projetos";el("progress").style.width=Math.min(100,total/TOTAL*100)+"%";}
function parts(){if(!draft){el("materials").textContent="Nenhum projeto calculado.";return;}const need=new Map(),busy=reserved(inCity?draft.id:null),stock=new Map(data.catalog.map(p=>[key(p),p.quantity]));for(const p of draft.pieces){const k=key(p);if(!need.has(k))need.set(k,{...p,n:0});need.get(k).n++;}el("materials").innerHTML=[...need.values()].map(p=>'<div class="listrow"><div><b>'+esc(p.name||p.part)+'</b><small>'+esc(p.color)+' · #'+esc(p.part)+' · '+((stock.get(key(p))||0)-(busy.get(key(p))||0))+' livre(s)</small></div><strong>'+p.n+'×</strong></div>').join("");}
function isoView(){
 if(window.OTTO3D&&el("sketch")?.replaceChildren){
  try{
   if(!viewer)viewer=window.OTTO3D.create(el("sketch"),{onStatus:message=>{const status=el("renderMode");if(status)status.textContent=message;}});
   viewer.setModel(draft?.pieces||[],index);
   return;
  }catch(e){viewer=null;console.warn("3D indisponível, usando esquema:",e);}
 }
 if(!draft){el("sketch").innerHTML='<div class="blank">Aqui aparecerá o desenho do projeto.</div>';return;}if(index===0){el("sketch").innerHTML='<div class="blank">Separe as peças e pressione Próximo.</div>';return;}const pList=draft.pieces.slice(0,index),total=draft.pieces,mx=Math.max(1,...total.map(p=>p.x+p.w)),mz=Math.max(1,...total.map(p=>p.z+p.d));
const xy=(x,z,y)=>{let a=x,b=z;if(angle===1){a=mz-z;b=x;}if(angle===2){a=mx-x;b=mz-z;}if(angle===3){a=z;b=mx-x;}return [(a-b)*12,(a+b)*5.5-y*14];};
const poly=pts=>pts.map(p=>p.map(n=>n.toFixed(1)).join(",")).join(" ");
const shade=(hex,f)=>"#"+[1,3,5].map(i=>Math.min(255,Math.max(0,Math.round(parseInt(hex.slice(i,i+2),16)*f))).toString(16).padStart(2,"0")).join("");
let paths=[],points=[];
for(const p of pList){const y=p.y+1,c=colors[p.color]||"#97acc5",a=xy(p.x,p.z,y),b=xy(p.x+p.w,p.z,y),d=xy(p.x,p.z+p.d,y),cc=xy(p.x+p.w,p.z+p.d,y),b0=xy(p.x+p.w,p.z,p.y),c0=xy(p.x+p.w,p.z+p.d,p.y),d0=xy(p.x,p.z+p.d,p.y);points.push(a,b,d,cc,b0,c0,d0);
let path='<polygon points="'+poly([b,cc,c0,b0])+'" fill="'+shade(c,.76)+'" stroke="#35455e" stroke-width=".5"/>'+
'<polygon points="'+poly([cc,d,d0,c0])+'" fill="'+shade(c,.87)+'" stroke="#35455e" stroke-width=".5"/>'+
'<polygon points="'+poly([a,b,cc,d])+'" fill="'+shade(c,1.12)+'" stroke="#35455e" stroke-width=".5"/>';
for(let x=0;x<p.w;x++)for(let z=0;z<p.d;z++){const v=xy(p.x+x+.5,p.z+z+.5,y);path+='<ellipse cx="'+v[0]+'" cy="'+v[1]+'" rx="3.3" ry="1.7" fill="'+shade(c,1.25)+'" stroke="'+shade(c,.8)+'" stroke-width=".5"/>';}
paths.push({order:p.x+p.z+p.y*5,path});}
const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);if(!xs.length){el("sketch").textContent="Sem geometria.";return;}
let x1=Math.min(...xs)-24,x2=Math.max(...xs)+24,y1=Math.min(...ys)-24,y2=Math.max(...ys)+24;
paths.sort((a,b)=>a.order-b.order);
el("sketch").innerHTML='<svg viewBox="'+[x1,y1,Math.max(80,x2-x1),Math.max(80,y2-y1)].join(" ")+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vista isométrica esquemática"><g>'+paths.map(p=>p.path).join("")+'</g></svg>';}
function screen(){const n=draft?.pieces?.length||0;el("stepCount").textContent=index+" / "+n;el("next").disabled=!n||index>=n;el("previous").disabled=!n||index<=0;el("turn").disabled=!n;el("zoomIn").disabled=!n;el("zoomOut").disabled=!n;el("resetView").disabled=!n;el("save").disabled=!n||inCity;el("download").disabled=!n;
if(!n){el("instruction").textContent="Calcule um projeto para acompanhar as etapas.";isoView();return;}
if(index===0){el("instruction").textContent="Separe "+n+" peça(s). Avance uma de cada vez.";}else{const p=draft.pieces[index-1];el("instruction").textContent="Passo "+index+": encaixe 1 peça "+(p.name||p.part)+", cor "+p.color+", código "+p.part+". Coluna "+(p.x+1)+", fila "+(p.z+1)+", camada "+(p.y+1)+".";}
isoView();}
function reset(){draft=null;index=0;angle=0;inCity=false;el("previewLabel").textContent="Sem projeto";parts();screen();}
function generate(){reset();const prompt=el("prompt").value.trim();if(!prompt){alertText("Primeiro descreva o que quer construir.",true);return;}const unsupportedTerm=unsupported(prompt);if(unsupportedTerm){alertText("Este gerador ainda não constrói '"+unsupportedTerm+"' fielmente. Não vou inventar peças ou movimentos.",true);return;}if(!G?.generate){alertText("Gerador ausente. Verifique se generator.js está no GitHub.",true);return;}
let result;try{result=G.generate(prompt,data.catalog,reserved(),{name:el("projectName").value.trim()||undefined,maxNodes:14000});}catch(e){alertText("Não foi possível calcular: "+e.message,true);return;}if(!result.ok){alertText(result.error||"Sem montagem possível com as peças disponíveis.",true);return;}
const no=missing(result.project.pieces);if(no.length){alertText("Peças insuficientes: "+no.join("; "),true);return;}
draft=result.project;index=0;angle=0;inCity=false;el("previewLabel").textContent=draft.name||"Projeto";
parts();screen();alertText("Projeto calculado: "+draft.pieces.length+" peças catalogadas. Colisões e encaixes de grade conferidos. Estabilidade real não testada.");}
function save(){if(!draft||inCity)return;const no=missing(draft.pieces);if(no.length)return alertText("Peças insuficientes: "+no.join("; "),true);if(!G?.validate(draft)?.ok)return alertText("O projeto não passou na verificação geométrica.",true);let item=copy(draft);item.id="otto-"+Date.now()+"-"+Math.random().toString(36).slice(2,8);item.status="planejado";item.createdAt=new Date().toISOString();data.projects.push(item);if(!saveData()){data.projects.pop();return;}draft=item;inCity=true;render();alertText("Projeto salvo. Peças reservadas.");}
function projects(){const container=el("city");if(!data.projects.length){container.innerHTML='<p class="mini">Nenhum projeto salvo.</p>';return;}container.innerHTML=data.projects.map(p=>'<div class="project"><div class="line"><div><b>'+esc(p.name||"Projeto")+'</b><small>'+(p.pieces||[]).length+' peças · '+(p.status==="montado"?"Montado":p.status==="desmontado"?"Desmontado":"Reservado")+'</small></div><div class="wrap"><button class="minor" data-id="'+esc(p.id)+'" data-action="open">Ver</button><button class="minor" data-id="'+esc(p.id)+'" data-action="switch">'+(p.status==="desmontado"?"Reservar":p.status==="montado"?"Desmontar":"Marcar montado")+'</button><button class="minor" data-id="'+esc(p.id)+'" data-action="delete">Excluir</button></div></div></div>').join("");}
function onCity(e){const b=e.target.closest("button[data-action]");if(!b)return;const p=data.projects.find(x=>x.id===b.dataset.id);if(!p)return;switch(b.dataset.action){
case"open":draft=copy(p);index=0;angle=0;inCity=true;el("previewLabel").textContent=p.name||"Projeto";render();window.scrollTo({top:0,behavior:"smooth"});break;
case"switch":if(p.status==="montado"){if(!confirm("Otto desmontou esse projeto e devolveu as peças?"))return;p.status="desmontado";}else if(p.status==="desmontado"){const missingParts=missing(p.pieces,p.id);if(missingParts.length)return alertText(missingParts.join("; "),true);p.status="planejado";}else p.status="montado";if(inCity&&draft?.id===p.id)draft=copy(p);saveData();render();break;
case"delete":if(!confirm("Excluir projeto e devolver as peças reservadas?"))return;data.projects=data.projects.filter(x=>x.id!==p.id);if(draft?.id===p.id)reset();saveData();render();break;}}
function stock(){const query=el("search").value.toLowerCase().trim(),busy=reserved();const rows=data.catalog.filter(p=>(p.part+" "+p.name+" "+p.color).toLowerCase().includes(query));el("stock").innerHTML='<table><thead><tr><th>Peça</th><th>Cor</th><th>Total</th><th>Livre</th></tr></thead><tbody>'+rows.map(p=>'<tr><td>'+esc(p.name||p.part)+'<small style="display:block">#'+esc(p.part)+'</small></td><td>'+esc(p.color)+'</td><td>'+p.quantity+'</td><td>'+((p.quantity||0)-(busy.get(key(p))||0))+'</td></tr>').join("")+'</tbody></table>';}
function render(){metrics();projects();stock();parts();screen();}
function download(name,content,mime){const blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),4000);}
function csv(){return "part,color,quantity,name\n"+data.catalog.map(p=>[p.part,p.color,p.quantity,p.name].map(t=>'"'+String(t).replaceAll('"','""')+'"').join(",")).join("\n");}
function parseCSV(s){const lines=s.replace(/^\uFEFF/,"").replace(/\r/g,"").split("\n").filter(x=>x.trim());const f=line=>{let r=[],v="",q=false;for(let i=0;i<line.length;i++){if(line[i]==='"'){if(q&&line[i+1]==='"'){v+='"';i++;}else q=!q;}else if(line[i]===","&&!q){r.push(v.trim());v="";}else v+=line[i];}if(q)throw Error("Aspas CSV inválidas");r.push(v.trim());return r;};
const h=f(lines.shift()||"").map(x=>x.toLowerCase()),col=keys=>h.findIndex(x=>keys.includes(x)),i=col(["part","codigo","código"]),j=col(["color","cor"]),k=col(["quantity","quantidade","qty"]),m=col(["name","nome"]);if([i,j,k].includes(-1))throw Error("CSV precisa das colunas part,color,quantity");return lines.map(x=>{const row=f(x);return{part:row[i],color:row[j],quantity:Number(row[k]),name:m<0?row[i]:row[m]};});}
function checkedCatalog(raw){const arr=Array.isArray(raw)?raw:raw?.catalog;if(!Array.isArray(arr)||arr.length<1||arr.length>790)throw Error("Catálogo vazio ou excessivo");const out=[],keys=new Set();for(const r of arr){const p={part:String(r.part??r.codigo??""),color:String(r.color??r.cor??""),quantity:Number(r.quantity??r.quantidade),name:String(r.name??r.nome??r.part??"")},k=key(p);if(!/^[A-Za-z0-9_-]{2,32}$/.test(p.part)||!p.color||!Number.isSafeInteger(p.quantity)||p.quantity<1||p.quantity>790||keys.has(k))throw Error("Peça inválida ou duplicada: "+k);keys.add(k);out.push(p);}if(count(out)>790)throw Error("Total maior que 790");return out;}
async function importStock(file){if(!file||file.size>1000000)return alertText("Arquivo ausente ou acima de 1 MB.",true);try{const content=await file.text(),next=checkedCatalog(file.name.endsWith(".csv")?parseCSV(content):JSON.parse(content));for(const p of data.projects)if(p.status!=="desmontado"){const no=missing(p.pieces,p.id,next);if(no.length)throw Error("Novo estoque não comporta projetos: "+no.join("; "));}if(!confirm("Importar "+next.length+" tipos e "+count(next)+" peças?"))return;data.catalog=next;saveData();render();alertText("Estoque importado. Confira fisicamente os itens da caixa.");}catch(e){alertText("Erro no arquivo: "+e.message,true);}}
async function restore(file){if(!file||file.size>2000000)return alertText("Backup inválido.",true);try{const raw=JSON.parse(await file.text()),v=raw?.app==="OTTO3D"?raw.data:raw,cat=checkedCatalog(v);if(v.version!==1||!Array.isArray(v.projects))throw Error("Backup incompatível.");const busy=new Map();for(const p of v.projects){if(!Array.isArray(p.pieces)||p.pieces.length>790||!["planejado","montado","desmontado"].includes(p.status))throw Error("Projeto inválido.");if(p.status!=="desmontado")for(const piece of p.pieces)busy.set(key(piece),(busy.get(key(piece))||0)+1);}for(const [k,n] of busy){if((cat.find(p=>key(p)===k)?.quantity||0)<n)throw Error("Backup possui reservas superiores ao estoque: "+k);}if(!confirm("Substituir dados locais pelo backup selecionado?"))return;data={version:1,catalog:cat,projects:v.projects};reset();saveData();render();alertText("Backup restaurado.");}catch(e){alertText("Falha no backup: "+e.message,true);}}
el("create").onclick=generate;
document.querySelectorAll("[data-example]").forEach(b=>b.onclick=()=>{el("prompt").value=b.dataset.example;generate();});
el("previous").onclick=()=>{index=Math.max(0,index-1);screen();};el("next").onclick=()=>{index=Math.min(draft.pieces.length,index+1);screen();};el("turn").onclick=()=>{if(viewer)viewer.rotate();else{angle=(angle+1)%4;isoView();}};
el("zoomIn").onclick=()=>{if(viewer)viewer.zoomBy(1.22);};
el("zoomOut").onclick=()=>{if(viewer)viewer.zoomBy(1/1.22);};
el("resetView").onclick=()=>{if(viewer)viewer.resetView();};
el("save").onclick=save;
el("city").addEventListener("click",onCity);el("search").oninput=stock;
el("backup").onclick=()=>download("OTTO-backup.json",JSON.stringify(data,null,2),"application/json");
el("exportCsv").onclick=()=>download("OTTO-estoque.csv",csv(),"text/csv;charset=utf-8");
el("download").onclick=()=>{if(!draft)return;try{download("OTTO-projeto.ldr",G.exportLDraw(draft),"text/plain;charset=utf-8");}catch(e){alertText("Erro no LDraw: "+e.message,true);}};
el("importButton").onclick=()=>el("inventoryFile").click();el("inventoryFile").onchange=e=>{importStock(e.target.files[0]);e.target.value="";};
el("restoreButton").onclick=()=>el("backupFile").click();el("backupFile").onchange=e=>{restore(e.target.files[0]);e.target.value="";};
el("dictate").onclick=()=>{const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R)return alertText("Ditado não disponível no navegador. Digite o pedido.",true);const recognition=new R();recognition.lang="pt-BR";recognition.onresult=e=>{el("prompt").value=e.results[0][0].transcript;};recognition.onerror=()=>alertText("Microfone indisponível. Digite o pedido.",true);try{recognition.start();alertText("Ouvindo Otto...");}catch{alertText("Não foi possível iniciar o microfone.",true);}};
render();
})();