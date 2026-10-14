/* Tela de modelos 3D: somente modelos LDraw identificados/importados.
 * Os manuais PDF continuam disponíveis e não são convertidos por aproximação.
 */
(()=>{"use strict";
 const catalog=Array.isArray(window.OTTO_CATALOGO_REAL)?window.OTTO_CATALOGO_REAL:[];
 const engine=window.OTTOModelos3D;
 const fidelity=window.OTTO_FIDELIDADE;
 const $=id=>document.getElementById(id);
 const MODAL=$("model3dDetail");
 let active=null,viewer=null,modelData=null,token=0;
 const sourceId=id=>catalog.find(x=>x.id===id);
 const isOpen=()=>MODAL.classList.contains("open");
 function report(text,warning=false){
  const e=$("model3dStatus");e.textContent=text;e.className="model3d-status"+(warning?" warning":"");
 }

 function referenceForStep(){
  const group=$("model3dCompare"),frame=$("model3dManualFrame"),anchor=$("model3dManualStep");
  const project=active;
  if(!project||project.tipoManual!=="pdf"){group.classList.add("hidden");frame.removeAttribute("src");return;}
  group.classList.remove("hidden");
  const page=fidelity?.manualPage(project.id,Math.max(1,viewer?.currentManualStage?.()||1));
  const href=project.manual+(page?"#page="+page+"&view=FitH":"#page=1");
  anchor.href=href;
  anchor.textContent=page?"Ver original — página "+page+" ↗":"Abrir manual original ↗";
  if(group.classList.contains("is-visible")&&group.dataset.noIframe!=="true"&&frame.dataset.current!==href){frame.src=href;frame.dataset.current=href;}
 }
 function checkFidelity(record,project){
  const panel=$("model3dAudit"),audit=fidelity?.audit(project.id,record?.text||null);
  if(!audit){panel.textContent="Fidelidade não auditada: compare manual, códigos e posições.";return;}
  const counts=audit.criteria||{};
  const goodCounts=counts.stepCountsMatch&&counts.pieceTotalMatches;
  const shortAudit=audit.partialAudit;
  const firstStages=shortAudit?.matching===true;
  panel.className="model3d-status "+(audit.certified100?"":"warning");
  panel.textContent=(audit.certified100?"PROJETO CONFERIDO: ":"FIDELIDADE AINDA NÃO CERTIFICADA: ")+
   (goodCounts?"As 11 etapas e as quantidades de peças correspondem ao PDF. ":"")+
   (firstStages?"Os formatos, cores e quantidades das duas primeiras etapas correspondem à transcrição do manual. ":"")+
   "Posições exatas, encaixes e montagem física ainda pendentes de conferência."+
   (audit.failures?.length?" Falhas: "+audit.failures.join("; "):"");
 }
 function setSteps(n=0){
  const step=viewer?.step||0,max=viewer?.steps||0;
  $("model3dStep").textContent="Peça "+step+" de "+max;
  const piece=viewer?.currentPiece?.();
  const full=viewer?.manualSteps||0;
  $("model3dPartInfo").textContent=piece
    ?"Peça "+step+"/"+max+" • "+(fidelity?.describePiece?.(piece)||piece.id)+" • Manual etapa "+piece.manualStage+"/"+full
    :max?"Início: toque em Próxima para colocar a primeira peça.":"Aguardando modelo 3D";
  $("model3dPrev").disabled=!max||step<=0;
  $("model3dNext").disabled=!max||step>=max;
  $("model3dRange").max=String(max);$("model3dRange").value=String(step);$("model3dRange").disabled=!max;
  const enabled=!!max;
  for(const id of ["model3dRotate","model3dZoomIn","model3dZoomOut","model3dReset"])$(id).disabled=!enabled;
  $("model3dExport").disabled=!modelData;
  referenceForStep();
 }
 function details(record,project){
  let msg="";
  if(record.source==="Arquivo LDraw importado"){
   msg="3D LDraw importado: geometria das peças carregada, mas ainda não conferida com o manual deste projeto.";
  }else if(record.quality==="reconstrucao-parcial"){
   msg="MODELO 3D PARCIAL: "+Number(record.stepsDigitized||2)+" etapas digitalizadas de "+Number(record.stepsDeclared||0)+" previstas no manual. "+record.review;
  }else if(record.quality==="reconstrucao-preliminar"){
   msg="Reconstrução 3D preliminar baseada no manual oficial. "+record.review;
  }else{
   msg="O modelo tridimensional tem origem declarada. A montagem física e a equivalência com o PDF ainda precisam ser conferidas.";
  }
  $("model3dNote").textContent=msg+
   " Fonte do manual: "+project.origem+" • "+project.autor+
   ". O contador do estoque não será alterado sem a lista de peças conferida.";
 }
 async function renderRecord(record,project,requestId){
  modelData=record;details(record,project);
  if(viewer){viewer.dispose();viewer=null;}
  viewer=new engine.CADViewer($("model3dCanvas"),t=>report(t,false));
  report("Reconstruindo o modelo 3D com peças LDraw. Aguarde a geometria real…");
  try{
   const value=await viewer.loadModel(record.text);
   if(requestId!==token||!isOpen())return;
   if(!value)throw Error("Modelo cancelado");
   setSteps(value.steps);
   checkFidelity(record,project);
   const partial=record.quality==="reconstrucao-parcial";
   const q=record.quality==="reconstrucao-preliminar"||partial;
   const scope=partial?"MODELO PARCIAL: "+(record.stepsDigitized||value.manualSteps)+" de "+(record.stepsDeclared||"?")+" etapas do manual.":q?"RECONSTRUÇÃO PRELIMINAR; conferir PDF.":"Modelo importado, não auditado.";
   report("3D: "+value.steps+" peças navegáveis uma a uma • "+(value.manualSteps||"?")+" etapas modeladas. "+scope,q);
  }catch(error){
   if(requestId!==token||!isOpen())return;
   setSteps();
   report("Não foi possível mostrar as peças 3D reais. "+String(error.message||error)+
    ". O manual original continua disponível; nenhum desenho será inventado.",true);
  }
 }
 async function open(id){
  const project=sourceId(id);if(!project||!engine)return;
  token++;const my=token;active=project;modelData=null;
  $("model3dTitle").textContent=project.titulo+" — modelo 3D";
  $("model3dOrigin").textContent=project.origem+" • "+project.autor;
  $("model3dManual").href=project.manual;
  $("model3dCanvas").textContent="";
  checkFidelity(null,project);
  report("Procurando modelo digital deste projeto…");
  $("model3dNote").textContent="A visualização 3D exige posições digitais das peças. PDF sozinho não fornece essas coordenadas.";
  MODAL.classList.add("open");MODAL.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
  setSteps();$("model3dClose").focus();
  try{
   const record=await engine.projectSource(project.id);
   if(my!==token||!isOpen())return;
   if(!record){
    $("model3dCanvas").innerHTML='<p class="empty">O arquivo CAD deste projeto ainda não foi reconstruído. O manual real continua disponível.</p>';
    $("model3dNote").textContent="O arquivo fonte deste manual é PDF. Para girar o projeto em 3D, precisamos reproduzir as posições das peças em LDraw (.ldr ou .mpd). Você também pode importar um modelo digital com origem conhecida. Não serão exibidas peças aleatórias.";
    checkFidelity(null,project);
    report("3D deste exemplo ainda não digitalizado e auditado.",true);
   }else await renderRecord(record,project,my);
  }catch(err){
   if(my!==token)return;
   report("Arquivo 3D indisponível: "+String(err.message||err),true);
  }
 }
 function close(){
  token++;MODAL.classList.remove("open");MODAL.setAttribute("aria-hidden","true");
  document.body.style.overflow="";active=null;modelData=null;
  if(viewer){viewer.dispose();viewer=null;}
  $("model3dCanvas").replaceChildren();setSteps();
 }
 async function importFile(file){
  if(!active||!file)return;
  if(!/\.(ldr|mpd)$/i.test(file.name)){report("Apenas arquivos de modelo LEGO .ldr e .mpd são aceitos.",true);return;}
  if(file.size>1500000){report("Arquivo acima de 1,5 MB; exporte um modelo LDraw menor.",true);return;}
  const my=++token,project=active;
  try{
   const text=await file.text();
   engine.inspect(text);
   const record=await engine.put(project.id,text,file.name);
   if(my!==token||!isOpen())return;
   await renderRecord(record,project,my);
  }catch(err){
   if(my!==token)return;
   report("Não foi possível importar: "+String(err.message||err),true);
  }
 }
 function download(){
  if(!modelData)return;
  const file=new Blob([modelData.text],{type:"text/plain;charset=utf-8"});
  const url=URL.createObjectURL(file),link=document.createElement("a");
  link.href=url;link.download=(active?.id||"OTTO-modelo")+".ldr";
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
 }
 document.addEventListener("click",e=>{
  const button=e.target.closest("[data-view3d]");
  if(button){e.preventDefault();open(button.dataset.view3d);}
 });
 $("model3dClose").addEventListener("click",close);
 MODAL.addEventListener("click",e=>{if(e.target===MODAL)close();});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&isOpen()){e.stopImmediatePropagation();close();}});
 $("model3dRotate").addEventListener("click",()=>viewer?.turn());
 $("model3dZoomIn").addEventListener("click",()=>viewer?.zoom(1.2));
 $("model3dZoomOut").addEventListener("click",()=>viewer?.zoom(1/1.2));
 $("model3dReset").addEventListener("click",()=>viewer?.fit());
 $("model3dPrev").addEventListener("click",()=>{if(!viewer)return;viewer.setStep(viewer.step-1);setSteps();});
 $("model3dNext").addEventListener("click",()=>{if(!viewer)return;viewer.setStep(viewer.step+1);setSteps();});
 $("model3dRange").addEventListener("input",e=>{viewer?.setStep(Number(e.target.value));setSteps();});
 $("model3dImport").addEventListener("click",()=>$("model3dFile").click());
 $("model3dFile").addEventListener("change",e=>{importFile(e.target.files?.[0]);e.target.value="";});
 $("model3dExport").addEventListener("click",download);
})();
