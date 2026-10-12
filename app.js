/* OTTO 3D v2.0.0: procedural brick planning with verified partial set inventory.
   The geometry renderer is educational; neither physical connectivity nor stability is certified. */
const TOTAL=790, STORE="otto3d:v1";
const el=id=>document.getElementById(id);
const colors={
 "Black":"#252733","Bright Blue":"#2071e4","Blue":"#2071e4","Bright Green":"#28bd64",
 "Green":"#198943","Dark Pink":"#d7449e","Dark Purple":"#6946a9","Dark Red":"#8e253a",
 "Dark Tan":"#9e8269","Brick Yellow":"#d6b77d","Yellow":"#f5c929","White":"#f5f5f5",
 "Light Bluish Gray":"#9dabb9","Red":"#dc343a","Reddish Brown":"#70412e"
};
function normalizeColor(c){
 const x=String(c||"").trim().toLowerCase();
 const aliases={"preto":"Black","black":"Black","azul":"Bright Blue","blue":"Bright Blue","bright blue":"Bright Blue","bright green":"Bright Green","verde vivo":"Bright Green","verde":"Green","green":"Green","pink":"Dark Pink","rosa escuro":"Dark Pink","dark pink":"Dark Pink","roxo escuro":"Dark Purple","dark purple":"Dark Purple","vermelho escuro":"Dark Red","dark red":"Dark Red","dark tan":"Dark Tan","tan":"Brick Yellow","brick yellow":"Brick Yellow","bege":"Brick Yellow","amarelo":"Yellow","yellow":"Yellow","red":"Red","vermelho":"Red","white":"White","branco":"White"};
 return aliases[x]||Object.keys(colors).find(k=>k.toLowerCase()===x)||String(c||"").trim();
}
function item(part,color,quantity,name){return {part:String(part),color:normalizeColor(color),quantity:Number(quantity),name:String(name)};}
/* Deliberately limited to rows individually cross-checked in BrickLink and Brickset.
   The remaining 790 pieces are NOT silently assigned imaginary shapes/colors. */
const STARTER=[
 ["3004","Black",4,"Brick 1 x 2"],["3002","Black",8,"Brick 2 x 3"],
 ["2456","Black",2,"Brick 2 x 6"],["47905","Black",4,"Brick modified 1 x 1 (2 lateral studs)"],
 ["30136","Black",4,"Brick 1 x 2 log profile"],["87081","Black",1,"Brick round 4 x 4 with hole"],
 ["60596","Black",1,"Door frame 1 x 4 x 6"],["60471","Black",2,"Hinge 1 x 2"],
 ["92582","Black",2,"Hinge plate 2 x 2"],["30046","Black",2,"Window pane 1 x 2"],
 ["2926","Black",2,"Plate 1 x 4 wheel holder"],["85984","Black",2,"Slope 30 1 x 2"],
 ["3040","Black",4,"Slope 45 1 x 2"],
 ["33291","Dark Pink",3,"Plate round flower 1 x 1"],["54200","Dark Pink",3,"Slope 30 1 x 1"],
 ["3003","Dark Purple",4,"Brick 2 x 2"],["3001","Dark Purple",4,"Brick 2 x 4"],
 ["3941","Dark Purple",4,"Brick round 2 x 2 axle"],["4073","Dark Purple",3,"Plate round 1 x 1"],
 ["85984","Dark Purple",4,"Slope 30 1 x 2"],["60481","Dark Purple",4,"Slope 65 2 x 1"],
 ["3005","Dark Red",4,"Brick 1 x 1"],["3004","Dark Red",4,"Brick 1 x 2"],
 ["3003","Dark Red",4,"Brick 2 x 2"],["2456","Dark Red",2,"Brick 2 x 6"],
 ["3003","Dark Tan",4,"Brick 2 x 2"],["3001","Dark Tan",4,"Brick 2 x 4"],
 ["3068","Dark Tan",4,"Tile 2 x 2"],
 ["3003","Green",4,"Brick 2 x 2"],["3001","Green",4,"Brick 2 x 4"],
 ["3001","Bright Blue",6,"Brick 2 x 4"],["3002","Bright Blue",4,"Brick 2 x 3"],
 ["3003","Bright Blue",4,"Brick 2 x 2"],
 ["3004","Brick Yellow",4,"Brick 1 x 2"],["3001","Brick Yellow",2,"Brick 2 x 4"],
 ["3023","Brick Yellow",4,"Plate 1 x 2"],["3022","Brick Yellow",2,"Plate 2 x 2"],
 ["3020","Brick Yellow",2,"Plate 2 x 4"],["3710","Brick Yellow",2,"Plate 1 x 4"]
].map(a=>item(...a));

const key=p=>String(p.part)+"|"+normalizeColor(p.color).toLowerCase();
const clone=o=>JSON.parse(JSON.stringify(o));
const qs=s=>document.querySelector(s), qsa=s=>[...document.querySelectorAll(s)];
function load(){
 try{
  const o=JSON.parse(localStorage.getItem(STORE)||"null");
  if(!o||o.version!==1||!Array.isArray(o.catalog)||!Array.isArray(o.projects))return {version:1,catalog:clone(STARTER),projects:[]};
  return o;
 }catch{return {version:1,catalog:clone(STARTER),projects:[]};}
}
let state=load(),preview=null,previewSaved=false,step=0,scene3d=null,viewLib=null,toastTimer,oracleResult=null;
let detailMode=false,detailSerial=0,detailModule=null;
function persist(){try{localStorage.setItem(STORE,JSON.stringify(state));return true;}catch{notify("Sem espaço para salvar. Exporte um backup.",true);return false;}}
function notify(msg,bad=false){const a=el("toast");a.textContent=msg;a.style.borderColor=bad?"#db748a":"#6075a7";a.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>a.classList.remove("show"),3900);}
function cleanHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
const sum=a=>a.reduce((t,x)=>t+Number(x.quantity||0),0);
const catalogMap=()=>new Map(state.catalog.map(p=>[key(p),p]));
const projectKey=p=>String(p.part)+"|"+normalizeColor(p.color).toLowerCase();
function requirements(project){const m=new Map();for(const p of project.pieces||[]){const k=projectKey(p);let v=m.get(k);if(!v){v={part:p.part,color:p.color,quantity:0,name:p.name};m.set(k,v);}v.quantity++;}return [...m.values()];}
function used(excludeId=null){
 const m=new Map();
 for(const project of state.projects){
  if(project.status==="desmontado"||project.id===excludeId)continue;
  for(const p of requirements(project)){const k=key(p);m.set(k,(m.get(k)||0)+p.quantity);}
 }return m;
}
function shortage(pieces,excludeId=null){
 const req=Array.isArray(pieces)?pieces:requirements(pieces);
 const busy=used(excludeId),cat=catalogMap();
 return req.flatMap(p=>{const v=(cat.get(key(p))?.quantity||0)-(busy.get(key(p))||0);return p.quantity>v?[{...p,missing:p.quantity-v,free:Math.max(0,v)}]:[];});
}
function stockNumbers(){
 const known=sum(state.catalog),reserved=[...used().values()].reduce((a,b)=>a+b,0);
 const mounted=state.projects.filter(p=>p.status==="montado").reduce((a,p)=>a+p.pieces.length,0);
 el("total").textContent=TOTAL;el("identified").textContent=known;el("unmapped").textContent=(TOTAL-known)+" sem classificação";
 el("committed").textContent=reserved;el("committed-detail").textContent=mounted+" montadas; "+(reserved-mounted)+" reservadas";
 el("available").textContent=Math.max(0,known-reserved);
 el("catalogStatus").textContent=known===TOTAL&&state.catalog.length===225?"Catálogo completo • conferir fisicamente":"Catálogo parcial • requer conferência";
 el("projectCount").textContent=state.projects.length;
 el("inventoryProgress").textContent=state.catalog.length+" tipos";
 el("progressBar").style.width=Math.min(100,(known/TOTAL)*100)+"%";
 el("cityTotal").textContent=state.projects.length+" projetos";
}
function renderInventory(){
 const filter=el("inventoryFilter").value.trim().toLowerCase(),busy=used();
 const matches=state.catalog.filter(p=>(p.part+" "+p.color+" "+p.name).toLowerCase().includes(filter));
 el("inventoryList").innerHTML='<div class="inventory-head"><span>Modelo</span><span>Cor</span><span>Total</span><span>Livre</span></div>'+
 matches.map(p=>'<div class="inventory-row"><div class="part-name">'+cleanHTML(p.name)+'<small>Peça #'+cleanHTML(p.part)+'</small></div><span class="color-name"><i class="swatch" style="background:'+cleanHTML(colors[p.color]||"#aaa")+'"></i>'+cleanHTML(p.color)+'</span><span class="num">'+p.quantity+'</span><span class="num free">'+(p.quantity-(busy.get(key(p))||0))+'</span></div>').join("");
 if(!matches.length)el("inventoryList").innerHTML+='<div class="empty-small">Nenhuma peça encontrada.</div>';
}
function renderProjects(){
 const root=el("projectGrid");
 if(!state.projects.length){root.innerHTML='<div class="empty-small">A cidade ainda não tem construções. Comece em “Projetar”.</div>';return;}
 root.innerHTML=state.projects.map(p=>{
  const ico={torre:"♜",casinha:"⌂",muro:"▥",escada:"▤",plataforma:"▦",praca:"✿"}[p.kind]||"▣";
  const badge={planejado:"Reservado",montado:"Montado",desmontado:"Desmontado"}[p.status]||p.status;
  return '<article class="project-card"><div class="emblem">'+ico+'</div><h3>'+cleanHTML(p.name)+'</h3><p>'+cleanHTML(p.idea)+'</p><div class="tags"><span>'+p.pieces.length+' peças</span><span>'+badge+'</span></div>'+
   '<div class="project-buttons"><button class="btn btn-ghost" data-project="'+cleanHTML(p.id)+'" data-action="view">Ver 3D</button>'+
   '<button class="btn btn-primary" data-project="'+cleanHTML(p.id)+'" data-action="toggle">'+(p.status==="montado"?"Desmontar":p.status==="desmontado"?"Reservar":"Marcar montado")+'</button>'+
   '<button class="btn btn-ghost" data-project="'+cleanHTML(p.id)+'" data-action="delete" title="Excluir projeto">✕</button></div></article>';
 }).join("");
}
function renderAll(){stockNumbers();renderInventory();renderProjects();if(preview)renderBOM();}

function getOracleResult(idea,name){
 const oracle=window.OTTOOracle,engine=window.OTTOGenerator;
 if(!oracle||!engine)return {status:"MOTOR_INDISPONIVEL",message:"O ORÁCULO ou o motor geométrico não foram carregados."};
 return oracle.analyze(idea,state.catalog,used(),engine,{name,maxNodes:35000});
}
function makePlan(){
 const idea=el("ideaText").value.trim();
 if(!idea){plannerMessage("Otto precisa descrever primeiro o brinquedo.","error");return;}
 const result=getOracleResult(idea,el("nameText").value.trim()||undefined);
 if(result.status!=="PROJETO_VALIDO_NA_GRADE"){
  const extras=(result.unverified||[]).map(p=>p.label).join(", ");
  plannerMessage(result.message+(extras?" Requisitos ainda não suportados: "+extras+".":""),"error");
  el("oracleInput").value=idea;
  oracleResult=result;displayOracle(result);return;
 }
 showPreview(result.project,false);
 const m=result.project.generator;
 plannerMessage("ORÁCULO: projeto calculado com "+result.project.pieces.length+" peças catalogadas, base "+m.width+"×"+m.depth+" pinos e "+m.height+" camadas. Estoque, colisões, suporte por etapa e conectividade verificados. Encaixes físicos e estabilidade ainda não certificados.","success");
 oracleResult=result;
 displayOracle(result);
}
function displayOracle(result){
 const verdict=el("oracleVerdict"),evidence=el("oracleEvidence"),open=el("oracleOpenPlan");
 const status=result?.status||"DESCONHECIDO",success=status==="PROJETO_VALIDO_NA_GRADE";
 verdict.className="oracle-verdict "+(success?"ok":"blocked");
 verdict.innerHTML="<strong>"+cleanHTML(success?"GRADE DE MONTAGEM CONFERIDA":"PROJETO NÃO LIBERADO")+"</strong><p>"+cleanHTML(result?.message||"Nenhum diagnóstico")+"</p>"+
  (result?.unverified?.length?"<ul>"+result.unverified.map(x=>"<li>"+cleanHTML(x.label)+": "+cleanHTML(x.details)+"</li>").join("")+"</ul>":"")+
  (result?.certificate?.errors?.length?"<ul>"+result.certificate.errors.map(x=>"<li>"+cleanHTML(x)+"</li>").join("")+"</ul>":"");
 open.classList.toggle("hidden",!success);
 el("oracleExport").disabled=false;
 const inv=result.inventory||window.OTTOOracle?.inventoryAudit(state.catalog,used());
 const cert=result.certificate;
 evidence.innerHTML="<div class='oracle-evidence-grid'>"+
  "<div><strong>"+(inv?.known??"?")+" / 790</strong><small>Peças catalogadas</small></div>"+
  "<div><strong>"+(inv?.lots??"?")+" / 225</strong><small>Combinações código/cor</small></div>"+
  "<div><strong>"+(cert?.pieces??0)+"</strong><small>Peças deste projeto</small></div>"+
  "<div><strong>"+cleanHTML(status)+"</strong><small>Resultado da auditoria</small></div></div>"+
  "<div class='oracle-checks'>"+
  "<p>"+(cert?.geometry?.pass?"✓":"—")+" Colisões e encaixes na grade retangular</p>"+
  "<p>"+(cert?.assembly?.pass?"✓":"—")+" Apoio sequencial por etapa</p>"+
  "<p>"+(cert?.supply?.ok?"✓":"—")+" Estoque suficiente por código e cor</p>"+
  "<p>— Resistência, equilíbrio e movimentos físicos: sem certificação</p>"+
  "<p>— Geometria detalhada LDraw no visualizador: sem confirmação automática</p></div>";
}
function analyzeWithOracle(){
 oracleResult=getOracleResult(el("oracleInput").value.trim(),el("nameText").value.trim()||undefined);
 displayOracle(oracleResult);
}
function renderOracleCapabilities(){
 const oracle=window.OTTOOracle;if(!oracle)return;
 el("oracleCapabilities").innerHTML=oracle.families.map(group=>
  "<div class='oracle-family'><b>"+cleanHTML(group.title)+"</b><small>"+cleanHTML(group.level==="grade-implementada"?"Cálculo geométrico implementado":"Aguardando desenvolvimento e validação")+"</small><p>"+group.items.map(i=>cleanHTML(i)).join(" · ")+"</p></div>"
 ).join("");
}
function showPreview(p,isSaved){
 detailMode=false;detailSerial++;
 el("realGeometry").textContent="◈ Ver detalhes reais (LDraw)";
 preview=clone(p);previewSaved=isSaved;step=preview.pieces.length;
 el("modelTitle").textContent=preview.name;el("modelStatus").textContent=isSaved?"Da minha cidade":preview.generator?"Grade validada":"Prévia ilustrativa";
 el("scenePlaceholder").classList.add("hidden");
 el("projectActions").classList.remove("hidden");
 el("saveProject").classList.toggle("hidden",isSaved);
 el("stepRange").disabled=false;el("prevStep").disabled=false;el("nextStep").disabled=false;
 renderStep();renderBOM();
 if(viewLib)update3D();else load3D();
}
function renderStep(){
 const n=preview?.pieces.length||0;
 el("stepRange").max=String(n);el("stepRange").value=String(step);el("stepCounter").textContent=step+" / "+n;
 el("prevStep").disabled=!preview||step<=0;el("nextStep").disabled=!preview||step>=n;
 if(!preview){el("stepDetail").textContent="Assim que Otto criar um projeto, cada etapa aparecerá aqui.";el("stepTitle").textContent="Etapas da montagem";return;}
 el("stepTitle").textContent="Montagem em "+n+" etapas";
 if(step===0){el("stepDetail").innerHTML="<b>Começo da montagem.</b> Separe as peças listadas e toque em Próxima para posicionar a primeira.";return;}
 const p=preview.pieces[step-1];
 el("stepDetail").innerHTML="<b>Passo "+step+":</b> encaixar <b>1 × "+cleanHTML(p.name)+"</b>, cor <b>"+cleanHTML(p.color)+"</b> (código "+cleanHTML(p.part)+"). Posição visual: coluna "+(p.x+1)+", fila "+(p.z+1)+", camada "+(p.y+1)+".";
}
function renderBOM(){
 if(!preview){el("bom").innerHTML='<div class="empty-small">Crie um projeto para consultar quantidades por formato e cor.</div>';el("bomTotal").textContent="0 peças";return;}
 const req=requirements(preview),cat=catalogMap(),busy=used(previewSaved?preview.id:null);
 el("bomTotal").textContent=preview.pieces.length+" peças";
 el("bom").innerHTML=req.map(p=>{
  const free=(cat.get(key(p))?.quantity||0)-(busy.get(key(p))||0);
  const ok=free>=p.quantity;
  return '<div class="bom-row"><i class="swatch" style="background:'+cleanHTML(colors[p.color]||"#aaa")+'"></i><div><b>'+cleanHTML(p.name)+'</b><small>'+cleanHTML(p.color)+' • #'+cleanHTML(p.part)+' • '+free+' livres antes da reserva</small></div><div class="'+(ok?"good":"bad")+'">'+p.quantity+' '+(ok?"✓":"✕")+'</div></div>';
 }).join("");
}
function clearPreview(){
 detailMode=false;detailSerial++;
 el("realGeometry").textContent="◈ Ver detalhes reais (LDraw)";
 preview=null;previewSaved=false;step=0;el("modelTitle").textContent="Sua criação aparece aqui";el("modelStatus").textContent="Sem projeto";
 el("scenePlaceholder").classList.remove("hidden");el("projectActions").classList.add("hidden");
 if(scene3d){scene3d.group.clear();scene3d.renderer.domElement.style.display="none";}
 renderStep();renderBOM();
}
function savePreview(){
 if(!preview||previewSaved)return;
 if(state.catalog.length===0){notify("Importe um catálogo antes de reservar.",true);return;}
 const missing=shortage(preview);
 if(missing.length){notify("Estoque insuficiente para reservar este projeto.",true);return;}
 const audit=window.OTTOOracle?.certificate(preview,state.catalog,used(),window.OTTOGenerator);
 if(!audit?.valid){notify("ORÁCULO bloqueou reserva: projeto sem laudo geométrico válido.",true);return;}
 const project=clone(preview);project.id="otto-"+Date.now()+"-"+Math.random().toString(36).slice(2,7);
 project.status="planejado";project.createdAt=new Date().toISOString();
 state.projects.push(project);persist();previewSaved=true;preview.id=project.id;
 el("saveProject").classList.add("hidden");el("modelStatus").textContent="Reservado na cidade";
 renderAll();notify("Projeto salvo. As peças já estão reservadas para a cidade!");
}
function onProjectAction(id,action){
 const project=state.projects.find(p=>p.id===id);if(!project)return;
 if(action==="view"){
  showPreview(project,true);showTab("criar");return;
 }
 if(action==="delete"){
  if(!confirm("Excluir "+project.name+"? As peças reservadas ou montadas serão devolvidas ao estoque."))return;
  state.projects=state.projects.filter(p=>p.id!==id);if(preview?.id===id)clearPreview();
 }else if(action==="toggle"){
  if(project.status==="montado"){if(!confirm("Otto desmontou "+project.name+" e devolveu todas as peças à caixa?"))return;project.status="desmontado";}
  else if(project.status==="desmontado"){if(shortage(project,project.id).length){notify("Não há peças livres suficientes para reservar novamente.",true);return;}project.status="planejado";}
  else project.status="montado";
 }
 persist();renderAll();
renderOracleCapabilities();
 if(preview?.id===id)showPreview(project,true);
}
function showTab(tab){
 qsa(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 qsa(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+tab));
 if(tab==="criar"&&preview)requestAnimationFrame(()=>{resize3D();});
}
function validateCatalog(rows){
 if(!Array.isArray(rows))throw Error("O arquivo precisa conter uma lista de peças.");
 if(rows.length>2500)throw Error("Inventário maior que o limite seguro.");
 const map=new Map();
 for(const r of rows){
  const part=String(r.part??r.design??r.codigo??r.id??"").trim();
  const color=normalizeColor(r.color??r.cor??"");
  const quantity=Number(r.quantity??r.qty??r.quantidade);
  const name=String(r.name??r.nome??r.description??part).trim();
  if(!/^[A-Za-z0-9_-]{2,32}$/.test(part)||!color||color.length>80||name.length>160||!Number.isSafeInteger(quantity)||quantity<1||quantity>790)throw Error("Registro inválido: "+part+" / "+color);
  const p={part,color,quantity,name};
  if(map.has(key(p)))throw Error("Peça duplicada no arquivo: "+part+" / "+color);
  map.set(key(p),p);
 }
 const result=[...map.values()];
 if(!result.length||sum(result)>TOTAL)throw Error("Soma inválida: inventário vazio ou acima de 790.");
 return result;
}
function parseCSV(text){
 const lines=text.replace(/^\uFEFF/,"").replace(/\r/g,"").trim().split("\n");
 if(lines.length>2501)throw Error("CSV muito grande.");
 function fields(line){const out=[];let q=false,s="";for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){s+='"';i++;}else q=!q;}else if(c===","&&!q){out.push(s.trim());s="";}else s+=c;}out.push(s.trim());if(q)throw Error("Aspas CSV não fechadas.");return out;}
 const h=fields(lines.shift()).map(s=>s.toLowerCase().trim());
 const position=(a)=>h.findIndex(x=>a.includes(x));
 const ip=position(["part","design","codigo","código","id"]),ic=position(["color","cor"]),iq=position(["quantity","qty","quantidade"]),inm=position(["name","nome","description","descrição"]);
 if([ip,ic,iq].includes(-1))throw Error("CSV deve conter part,color,quantity (ou codigo,cor,quantidade).");
 return lines.filter(x=>x.trim()).map(line=>{const a=fields(line);return {part:a[ip],color:a[ic],quantity:a[iq],name:inm<0?a[ip]:a[inm]};});
}
function readAsText(file){return file.text();}
async function importCatalog(file){
 try{
  if(!file||file.size>1024*1024)throw Error("Selecione um arquivo de até 1 MB.");
  const raw=await readAsText(file);
  const json=file.name.toLowerCase().endsWith(".json");
  const data=json?JSON.parse(raw):parseCSV(raw);
  const rows=validateCatalog(Array.isArray(data)?data:data.catalog);
  const n=sum(rows),complete=n===TOTAL&&rows.length===225;
  if(!confirm("Importar "+rows.length+" tipos e "+n+" peças? "+(complete?"Quantidade e tipos compatíveis com o inventário 10698.":"ATENÇÃO: catálogo ainda não está completo (225 tipos / 790 peças).")+" Os projetos salvos serão preservados somente se as peças reservadas ainda existirem."))return;
  const saved=state.catalog;state.catalog=rows;
  if(state.projects.some(p=>p.status!=="desmontado"&&shortage(requirements(p),p.id).length)){state.catalog=saved;throw Error("Importação bloqueada: o novo catálogo não comporta alguns projetos já reservados.");}
  persist();renderAll();
  el("importMessage").className="notice "+(complete?"success":"");
  el("importMessage").textContent="Importadas "+n+" peças e "+rows.length+" tipos. "+(complete?"Contagem conferida; ainda é necessário checar variantes e caixa física.":"Inventário parcial: faltam "+(TOTAL-n)+" peças para fechar o conjunto.");
  notify("Catálogo importado.");
 }catch(e){el("importMessage").className="notice error";el("importMessage").textContent=String(e.message||e);notify("Falha ao importar catálogo.",true);}
}
function fileSave(name,text,type){
 const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function backup(){fileSave("OTTO-3D-backup.json",JSON.stringify({app:"OTTO3D",exported:new Date().toISOString(),data:state},null,2),"application/json");}
async function restoreBackup(file){
 try{
  if(!file||file.size>2*1024*1024)throw Error("Backup inválido ou muito grande.");
  const o=JSON.parse(await file.text()),b=o.data;
  if(o.app!=="OTTO3D"||b?.version!==1||!Array.isArray(b.projects))throw Error("Este não é um backup OTTO 3D.");
  const catalog=validateCatalog(b.catalog);
  const projects=b.projects.map(p=>{
   if(!p||!["planejado","montado","desmontado"].includes(p.status)||typeof p.name!=="string"||typeof p.id!=="string"||!Array.isArray(p.pieces)||p.pieces.length>790)throw Error("Projeto inválido no backup.");
   for(const piece of p.pieces){if(!/^[A-Za-z0-9_-]{2,32}$/.test(String(piece.part||""))||!Number.isInteger(piece.x)||!Number.isInteger(piece.y)||!Number.isInteger(piece.z)||Math.abs(piece.x)>200||Math.abs(piece.z)>200||piece.y<0||piece.y>100||!Number.isInteger(piece.w)||!Number.isInteger(piece.d)||piece.w<1||piece.d<1||piece.w>32||piece.d>32)throw Error("Geometria inválida no backup.");}
   return p;
  });
  if(!confirm("Substituir dados locais pelo backup selecionado?"))return;
  const old=state;state={version:1,catalog,projects};
  if(projects.some(p=>p.status!=="desmontado"&&shortage(requirements(p),p.id).length)){state=old;throw Error("Backup possui reservas incompatíveis com o inventário.");}
  persist();clearPreview();renderAll();el("backupMessage").textContent="Backup restaurado.";notify("Backup restaurado com sucesso.");
 }catch(e){el("backupMessage").textContent=e.message;notify(e.message,true);}
}
function exportCSV(){
 const csv=['part,color,quantity,name',...state.catalog.map(p=>[p.part,p.color,p.quantity,p.name].map(x=>'"'+String(x).replaceAll('"','""')+'"').join(","))].join("\n");
 fileSave("OTTO-10698-inventario.csv",csv,"text/csv;charset=utf-8");
}
async function load3D(){
 if(viewLib)return;
 try{const [three,orbit]=await Promise.all([import("three"),import("three/addons/controls/OrbitControls.js")]);viewLib={THREE:three,OrbitControls:orbit.OrbitControls};update3D();}
 catch{el("scenePlaceholder").classList.remove("hidden");el("scenePlaceholder").innerHTML="<span>▧</span><strong>Visualizador 3D indisponível</strong><small>Verifique sua conexão. A lista de etapas continua funcionando.</small>";}
}
function setup3D(){
 if(scene3d)return;
 const THREE=viewLib.THREE,container=el("scene");
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(46,1,0.1,1200);
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.domElement.style.display="block";container.appendChild(renderer.domElement);
 const controls=new viewLib.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.maxPolarAngle=Math.PI*.86;
 scene.add(new THREE.HemisphereLight(0xffffff,0x38517b,2.1));
 const sun=new THREE.DirectionalLight(0xffffff,2.35);sun.position.set(40,110,55);scene.add(sun);
 const grid=new THREE.GridHelper(200,20,0x5e7499,0x324363);grid.position.y=-1.8;scene.add(grid);
 const group=new THREE.Group();scene.add(group);
 scene3d={scene,camera,renderer,controls,group,grid};
 const onresize=()=>resize3D();window.addEventListener("resize",onresize);
 (function animate(){requestAnimationFrame(animate);if(!scene3d)return;controls.update();renderer.render(scene,camera);})();
 resize3D();
}
function resize3D(){
 if(!scene3d)return;
 const c=el("scene");if(c.clientWidth<=0||c.clientHeight<=0)return;
 scene3d.camera.aspect=c.clientWidth/c.clientHeight;scene3d.camera.updateProjectionMatrix();scene3d.renderer.setSize(c.clientWidth,c.clientHeight);
}
function addBrick(p,index){
 const THREE=viewLib.THREE;const g=new THREE.Group(),w=p.w*8-.22,d=p.d*8-.22,h=(p.h||1)*9.6-.12;
 const mat=new THREE.MeshStandardMaterial({color:colors[p.color]||"#adb8c9",roughness:.5,metalness:.05});
 const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);body.position.set(w/2, h/2, d/2);g.add(body);
 const studGeo=new THREE.CylinderGeometry(2.4,2.4,1.8,24);
 for(let a=0;a<p.w;a++)for(let b=0;b<p.d;b++){
  const stud=new THREE.Mesh(studGeo,mat);stud.position.set(a*8+4, h+0.85,b*8+4);g.add(stud);
 }
 if(index===step-1){
  const outline=new THREE.BoxHelper(body,0xffe9ae);g.add(outline);
 }
 g.position.set(p.x*8,p.y*9.6,p.z*8);return g;
}

async function renderDetailedLDraw(){
 if(!detailMode||!preview)return;
 const token=++detailSerial,button=el("realGeometry");
 button.disabled=true;
 button.textContent="◈ Carregando malhas LDraw…";
 try{
  if(!viewLib){await load3D();}
  if(!viewLib||!scene3d)throw new Error("Visualizador Three.js indisponível");
  if(!detailModule)detailModule=await import("./ldraw-view.js?v=3.0.0");
  if(token!==detailSerial||!detailMode)return;
  const geometry=await detailModule.loadDetail(preview,step,window.OTTOGenerator);
  if(token!==detailSerial||!detailMode)return;
  detailModule.installDetail(scene3d,geometry);
  scene3d.renderer.domElement.style.display="block";
  el("modelStatus").textContent=step===0?"Início · LDraw":"Malhas LDraw carregadas • grade não certificada";
  button.textContent="◈ Voltar ao 3D esquemático";
 }catch(error){
  if(token===detailSerial){
   detailMode=false;
   el("modelStatus").textContent="LDraw indisponível — prévia esquemática";
   button.textContent="◈ Ver detalhes reais (LDraw)";
   update3D();
   notify("Malhas LDraw indisponíveis: "+String(error?.message||error).slice(0,130),true);
  }
 }finally{
  if(token===detailSerial)button.disabled=false;
 }
}
function update3D(){
 if(!preview||!viewLib)return;
 try{
  setup3D();scene3d.group.clear();scene3d.renderer.domElement.style.display="block";
  preview.pieces.slice(0,step).forEach((p,i)=>scene3d.group.add(addBrick(p,i)));
  if(preview.pieces.length){
   const THREE=viewLib.THREE;
   const full=new THREE.Group();preview.pieces.forEach((p,i)=>full.add(addBrick(p,i)));
   const box=new THREE.Box3().setFromObject(full);const center=box.getCenter(new THREE.Vector3());const dims=box.getSize(new THREE.Vector3());
   scene3d.group.position.set(-center.x,0,-center.z);
   scene3d.controls.target.set(0,Math.max(3,dims.y/2),0);
   const dist=Math.max(65,Math.max(dims.x,dims.y,dims.z)*2.35);
   scene3d.camera.position.set(dist*.85,dist*.73,dist*.95);
   scene3d.controls.update();
  }
  resize3D();
  if(detailMode)void renderDetailedLDraw();
 }catch(e){console.error("Falha na geometria 3D",e);notify("Não foi possível desenhar esta prévia.",true);}
}
qsa(".tab").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
qsa(".chips button").forEach(b=>b.addEventListener("click",()=>{el("ideaText").value=b.dataset.idea;el("ideaText").focus();}));
el("generate").addEventListener("click",makePlan);
el("oracleAnalyze").addEventListener("click",analyzeWithOracle);
el("oracleInput").addEventListener("keydown",event=>{
 if((event.ctrlKey||event.metaKey)&&event.key==="Enter")analyzeWithOracle();
});
qsa("[data-oracle-example]").forEach(button=>button.addEventListener("click",()=>{
 el("oracleInput").value=button.dataset.oracleExample;analyzeWithOracle();
}));
el("oracleOpenPlan").addEventListener("click",()=>{
 if(oracleResult?.status!=="PROJETO_VALIDO_NA_GRADE")return;
 const updated=getOracleResult(oracleResult.project.idea,oracleResult.project.name);
 oracleResult=updated;displayOracle(updated);
 if(updated.status!=="PROJETO_VALIDO_NA_GRADE"){notify("Estoque ou validação mudou. Atualize o plano.",true);return;}
 showPreview(updated.project,false);showTab("criar");
});
el("oracleExport").addEventListener("click",()=>{
 if(!oracleResult||!window.OTTOOracle)return;
 fileSave("ORACULO-3D-laudo.json",window.OTTOOracle.projectReport(oracleResult),"application/json");
});

el("prevStep").addEventListener("click",()=>{step=Math.max(0,step-1);renderStep();if(viewLib)update3D();});
el("nextStep").addEventListener("click",()=>{step=Math.min(preview?.pieces.length||0,step+1);renderStep();if(viewLib)update3D();});
el("stepRange").addEventListener("input",e=>{step=Number(e.target.value);renderStep();if(viewLib)update3D();});
el("saveProject").addEventListener("click",savePreview);
el("exportLDraw").addEventListener("click",()=>{
 if(!preview)return;
 try{
  const content=window.OTTOGenerator.exportLDraw(preview);
  const safe=preview.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Za-z0-9_-]+/g,"-").slice(0,45);
  fileSave("OTTO-"+safe+".ldr",content,"text/plain;charset=utf-8");
  notify("Projeto LDraw exportado com etapas e códigos de peças.");
 }catch(e){notify("Não foi possível exportar: "+e.message,true);}
});
el("clearPreview").addEventListener("click",clearPreview);
el("projectGrid").addEventListener("click",e=>{const b=e.target.closest("button[data-project]");if(b)onProjectAction(b.dataset.project,b.dataset.action);});
el("inventoryFilter").addEventListener("input",renderInventory);
el("importFile").addEventListener("change",e=>{importCatalog(e.target.files[0]);e.target.value="";});
el("downloadCSV").addEventListener("click",exportCSV);
el("export").addEventListener("click",backup);
el("restoreBackup").addEventListener("click",()=>el("backupFile").click());
el("backupFile").addEventListener("change",e=>{restoreBackup(e.target.files[0]);e.target.value="";});
el("resetCatalog").addEventListener("click",()=>{
 if(!confirm("Restaurar amostra verificada? Os projetos existentes devem continuar atendidos pela amostra; caso contrário, a operação será bloqueada."))return;
 const old=state.catalog;state.catalog=clone(STARTER);
 if(state.projects.some(p=>p.status!=="desmontado"&&shortage(requirements(p),p.id).length)){state.catalog=old;notify("Restaurar amostra invalidaria reservas existentes.",true);return;}
 persist();renderAll();notify("Amostra conferida restaurada.");
});
el("voice").addEventListener("click",()=>{
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){el("voiceState").textContent="Voz indisponível neste navegador. Digite sua ideia.";return;}
 const rec=new SR();rec.lang="pt-BR";rec.interimResults=false;
 el("voiceState").textContent="Ouvindo...";el("voice").disabled=true;
 rec.onresult=e=>{el("ideaText").value=(el("ideaText").value+" "+e.results[0][0].transcript).trim();};
 rec.onerror=e=>{el("voiceState").textContent="Microfone: "+e.error;};
 rec.onend=()=>{el("voice").disabled=false;if(el("voiceState").textContent==="Ouvindo...")el("voiceState").textContent="Fala registrada.";};
 try{rec.start();}catch{el("voice").disabled=false;el("voiceState").textContent="Não foi possível iniciar microfone.";}
});
el("rotate").addEventListener("click",()=>{if(scene3d){scene3d.controls.autoRotate=!scene3d.controls.autoRotate;el("rotate").textContent=scene3d.controls.autoRotate?"⏸ Parar giro":"⟳ Girar";}});
el("fit").addEventListener("click",()=>{if(viewLib&&preview)update3D();});
el("realGeometry").addEventListener("click",async()=>{
 if(!preview){notify("Crie ou abra um projeto antes de carregar malhas LDraw.",true);return;}
 if(detailMode){
  detailMode=false;detailSerial++;
  el("realGeometry").textContent="◈ Ver detalhes reais (LDraw)";
  el("modelStatus").textContent="Prévia esquemática";
  if(viewLib)update3D();
  return;
 }
 if(!viewLib)await load3D();
 if(!viewLib){notify("Não foi possível iniciar o 3D.",true);return;}
 detailMode=true;
 renderDetailedLDraw();
});

renderAll();
