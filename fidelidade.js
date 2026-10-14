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
 // Referência cruzada: instruções oficiais 10698_X_Frog + itens regulares do BrickLink 10698-1.
 // O arquivo LDraw de olhos 98138p07.dat representa o design decorado BrickLink 98138pb007.
 // Esta lista comprova alinhamento de identificação e quantidade com a referência adotada,
 // MAS NÃO comprova coordenadas, rotações, conexões nem montagem física.
 const FROG_CANDIDATES=[
  [["3021",2]], [["4287",2],["4287",2]],
  [["3040",2],["3040",2]], [["3039",2]],
  [["3004",27]], [["85984",2],["85984",2]],
  [["3003",27]], [["3021",2]],
  [["4070",2],["4070",2]], [["3039",2]],
  [["98138p07",15],["98138p07",15]]
 ];
 const FROG_SET_STOCK={
  "3021|2":2,"4287|2":2,"3040|2":4,"3039|2":4,
  "3004|27":4,"85984|2":4,"3003|27":4,"4070|2":4,"98138p07|15":4
 };
 function catalogComparison(id,text){
  if(id!=="lego-sapo")return {available:false,matching:false,discrepancies:["Nenhuma tabela cruzada aprovada para este projeto."]};
  let stages;
  try{stages=rootSteps(text).steps;}catch(e){return {available:true,matching:false,discrepancies:[String(e.message||e)]};}
  const problems=[],need=new Map();
  const normal=p=>p.id.toLowerCase().replace(/\.dat$/i,"")+"|"+Number(p.color);
  const candidate=pair=>pair[0]+"|"+pair[1];
  FROG_CANDIDATES.forEach((expected,i)=>{
    const actual=stages[i]||[];
    const expectedKeys=expected.map(candidate).sort(),actualKeys=actual.map(normal).sort();
    if(JSON.stringify(expectedKeys)!==JSON.stringify(actualKeys))
      problems.push("Etapa "+(i+1)+": candidatos do inventário não correspondem aos códigos e cores do CAD.");
    for(const key of actualKeys)need.set(key,(need.get(key)||0)+1);
  });
  if(stages.length!==FROG_CANDIDATES.length)problems.push("Número de etapas divergente.");
  for(const [key,n] of need){
    if(!(key in FROG_SET_STOCK))problems.push("Peça/cor não localizada na seleção do inventário 10698: "+key);
    else if(n>FROG_SET_STOCK[key])problems.push("Quantidade excedida para "+key+": "+n+"/"+FROG_SET_STOCK[key]);
  }
  return {available:true,matching:problems.length===0,discrepancies:problems,
   references:["https://www.lego.com/cdn/product-assets/product.bi.additional.extra.pdf/10698_X_Frog.pdf",
    "https://www.bricklink.com/catalogItemInv.asp?S=10698-1"],
   warning:"Comparação com candidatos de código/cor não comprova posições, variantes decoradas ou estabilidade física."};
 }

 const MATERIAL_NAMES={
  "3021":"placa 2×3", "4287":"rampa invertida 1×3", "3040":"rampa 1×2",
  "3039":"rampa 2×2", "3004":"tijolo 1×2", "85984":"rampa baixa 1×2",
  "3003":"tijolo 2×2", "4070":"tijolo com pino lateral 1×1",
  "98138p07":"olho redondo estampado", "3034":"placa 2×8",
  "2456":"tijolo 2×6","3028":"placa 6×12", "3001":"tijolo 2×4",
  "3032":"placa 4×6","3029":"placa 4×12","3069":"azulejo liso 1×2",
  "3031":"placa 4×4","3020":"placa 2×4","6215":"rampa curva 2×3"
 };
 const COLOR_NAMES={
  0:"preto",1:"azul",2:"verde",14:"amarelo",15:"branco",
  19:"bege",27:"verde-limão",36:"verde-vivo",
  71:"cinza-claro",72:"cinza-escuro",191:"amarelo-alaranjado",321:"azul-azur"
 };
 function describePiece(piece){
  if(!piece)return "";
  const id=String(piece.id||"").replace(/\.dat$/i,"").toLowerCase();
  return (MATERIAL_NAMES[id]||"peça LEGO "+id)+" · "+(COLOR_NAMES[Number(piece.color)]||"cor "+piece.color)+" (código "+id+")";
 }
 // Transcrição visual dos dois primeiros quadros de cada manual oficial.
 // As geometrias 3D e os encaixes NÃO são certificados por esta tabela.
 const FIRST_TWO_STAGES={
  "lego-camera":{total:12,parts:[[["3034",71]],[["2456",0]]]},
  "lego-castelo":{total:22,parts:[[["3028",36]],[["3001",71],["3001",71]]]},
  "lego-escavadeira":{total:11,parts:[[["3032",14]],[["3001",191],["3001",191]]]},
  "lego-apartamento":{total:25,parts:[[["3029",72],["3004",321]],[["3069",15],["3004",321]]]},
  "lego-palmeira":{total:15,parts:[[["3031",1],["3031",1]],[["3001",14]]]},
  "lego-ursinho":{total:16,parts:[[["3020",19]],[["6215",15]]]}
 };
 function auditInitialStages(id,text){
  const target=FIRST_TWO_STAGES[id];
  if(!target)return {hasReference:false,matching:false,issues:["Quadros ainda não transcritos do manual."]};
  try{
   const actual=rootSteps(text).steps;
   const problems=[],key=p=>String(p.id).replace(/\.dat$/i,"").toLowerCase()+"|"+Number(p.color);
   target.parts.forEach((expected,i)=>{
    const found=(actual[i]||[]).map(key).sort(),needed=expected.map(pair=>pair[0]+"|"+pair[1]).sort();
    if(JSON.stringify(found)!==JSON.stringify(needed))
      problems.push("Etapa "+(i+1)+" com códigos, cores ou quantidades diferentes do manual.");
   });
   if(actual.length!==target.parts.length)problems.push("O arquivo 3D não contém exatamente as duas etapas previstas.");
   return {hasReference:true,matching:problems.length===0,issues:problems,
    stagesDigitized:actual.length,stagesDeclared:target.total,positionsCertified:false,physicalCertified:false};
  }catch(e){return {hasReference:true,matching:false,issues:[String(e.message||e)]};}
 }
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
   if(text){
    const early=auditInitialStages(id,text);
    report.partialAudit=early;
    report.criteria.firstTwoStageMaterialsMatch=early.matching;
    report.status="EM_CONFERENCIA";
    if(!early.matching)report.failures.push(...early.issues);
   }
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
   report.catalogComparison=catalogComparison(id,text);
   report.criteria.expectedDesignIdsAndColors=report.catalogComparison.matching;
   if(!report.catalogComparison.matching)report.failures.push(...report.catalogComparison.discrepancies);
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
 return {MODELS,REQUIRED,get,audit,rootSteps,manualPage,status,catalogComparison,FROG_CANDIDATES,FROG_SET_STOCK,MATERIAL_NAMES,COLOR_NAMES,describePiece,FIRST_TWO_STAGES,auditInitialStages};
});
