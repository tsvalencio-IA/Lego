/* OTTO LEGO — Verificação de fidelidade contra fontes, v1
 * Quantidade de peças, posições e origem são condições independentes.
 * "100%" só pode constar quando existem provas para TODOS os critérios.
 */
(function(root,factory){
 const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;
 root.OTTO_FIDELIDADE=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const frog={
   id:"lego-sapo",status:"EM_CONFERENCIA",
   source:"https://www.lego.com/cdn/product-assets/product.bi.additional.extra.pdf/10698_X_Frog.pdf",
   reference:"Manual LEGO 10698_X_Frog, páginas 3–8",
   expectedCounts:[1,2,2,1,1,2,1,1,2,1,2],
   sourcePageByStep:[3,3,4,4,5,5,6,6,7,7,8],
   knownTotal:16,
   evidence:{
    instructionsVerified:true,stepCountsVerified:true,partIdsVerified:false,
    exactColorsVerified:false,allPositionsVerified:false,connectionVerified:false,
    movementVerified:null,realBuildVerified:false
   },
   pending:[
    "Conferir os IDs de peças e variantes nas 11 etapas com o PDF oficial.",
    "Conferir todas as cores e as 16 coordenadas/rotações em vista 3D.",
    "Verificar o encaixe dos olhos nas peças com pinos laterais.",
    "Montar fisicamente a construção final para testar os encaixes."
   ],
   notes:"Reconstrução MPD anterior produz uma prévia, mas não há evidência suficiente para declarar fidelidade ao manual."
 };
 const REQUIRED=["instructionsVerified","stepCountsVerified","partIdsVerified","exactColorsVerified",
  "allPositionsVerified","connectionVerified","realBuildVerified"];
 const MODELS={ "lego-sapo":frog };
 const get=id=>MODELS[id]||null;
 function rootSteps(text){
  if(typeof text!=="string")throw Error("Arquivo digital indisponível");
  const parts=text.replace(/\r/g,"").split("\n");
  const root=[],steps=[];
  let started=false,closed=false,segment=[];
  for(const line of parts){
   if(/^0\s+FILE\s/i.test(line)){
    if(started){closed=true;break;}
    started=true;continue;
   }
   if(closed)break;
   const clean=line.trim();
   if(/^0\s+STEP\b/i.test(clean)){steps.push(segment);segment=[];continue;}
   if(/^1\s+/.test(clean)){
    const cols=clean.split(/\s+/);
    if(cols.length<15)throw Error("Instância de peça LDraw inválida");
    const nums=cols.slice(1,14).map(Number);
    if(nums.some(n=>!Number.isFinite(n)))throw Error("Coordenada LDraw inválida");
    const name=cols.slice(14).join(" ");
    if(!/^[\w./\\ -]+\.(?:dat|ldr|mpd)$/i.test(name))throw Error("Referência de peça inválida");
    segment.push({color:nums[0],position:nums.slice(1,4),orientation:nums.slice(4,13),id:name});
    root.push(segment[segment.length-1]);
   }
  }
  if(segment.length)steps.push(segment);
  if(!root.length)throw Error("Modelo sem peças na raiz");
  return {steps,parts:root,counts:steps.map(x=>x.length),total:root.length,
    ids:root.map(x=>x.id),colors:root.map(x=>x.color)};
 }
 function audit(id,text){
  const record=get(id),report={
   id,reference:record?.reference||"Manual sem coordenadas 3D validadas",
   status:"PENDENTE",percentGuaranteed:null,requiredCriteria:[...REQUIRED],
   criteria:{},failures:[],pending:[],model3dPresent:!!text
  };
  if(!record){
   report.pending.push("Obter modelo digital com proveniência e lista real de peças e passos.");
   report.pending.push("Confrontar manual, geometria, ordem e encaixes reais antes de certificar.");
   return report;
  }
  if(!text){report.pending.push("Reconstrução CAD ainda não presente.");return report;}
  try{
   const details=rootSteps(text);
   report.steps=details.counts.length;report.counts=details.counts;
   report.totalPieces=details.total;
   report.criteria.stepCountsMatch=details.counts.length===record.expectedCounts.length&&
    details.counts.every((n,i)=>n===record.expectedCounts[i]);
   report.criteria.pieceTotalMatches=details.total===record.knownTotal;
   if(!report.criteria.stepCountsMatch)report.failures.push("Divergência na quantidade de peças por etapa.");
   if(!report.criteria.pieceTotalMatches)report.failures.push("Divergência na quantidade total.");
   report.criteria.modelIncludesRealPartCodes=details.parts.every(p=>/\.dat$/i.test(p.id));
   if(!report.criteria.modelIncludesRealPartCodes)report.failures.push("Uma ou mais referências CAD não são códigos de peça.");
  }catch(error){
   report.failures.push("Arquivo digital não pode ser auditado: "+String(error.message||error));
  }
  for(const criterion of REQUIRED){
   report.criteria[criterion]=record.evidence[criterion]===true;
   if(!report.criteria[criterion])report.pending.push(criterion);
  }
  report.pending.push(...record.pending);
  const passed=report.failures.length===0 &&
   report.criteria.stepCountsMatch===true &&report.criteria.pieceTotalMatches===true &&
   report.criteria.modelIncludesRealPartCodes===true &&REQUIRED.every(k=>report.criteria[k]===true);
  report.status=passed?"CONFERIDO_100":"EM_CONFERENCIA";
  report.certified100=passed;
  return report;
 }
 const PARTIAL_PAGE_MAP={
  "lego-camera":[3,3],
  "lego-castelo":[3,4],
  "lego-escavadeira":[3,3],
  "lego-apartamento":[3,4],
  "lego-palmeira":[3,3],
  "lego-ursinho":[3,3]
 };
 function manualPage(id,step){
  const row=get(id),pages=row?.sourcePageByStep||PARTIAL_PAGE_MAP[id],
   page=pages?.[Math.max(0,Number(step||1)-1)];
  return page||null;
 }
 function status(id){
  const m=get(id);return m?m.status:"SEM_MODELO_AUDITADO";
 }
 return {MODELS,REQUIRED,get,audit,rootSteps,manualPage,status};
});
