/* ORÁCULO 3D — engenharia auditável para OTTO (v3).
 * Totalmente determinístico: nenhuma geometria, inventário ou certificação é fabricada.
 * Compatível com browser e Node CommonJS.
 */
(function(root,factory){
  "use strict";
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.OTTOOracle=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const SET={id:"10698-1",declared:790,declaredLots:225,source:"https://www.bricklink.com/catalogItemInv.asp?S=10698-1"};
 const REQUIRED_FEATURES=[
  {id:"rodas",label:"Rodas e eixos",rx:/\b(rodas?|eixos?|pneus?|rolantes?|rodar|pneumaticos?)\b/},
  {id:"articulacao",label:"Articulações móveis",rx:/\b(articulad[ao]s?|articulacoes?|dobradicas?|abrir|abre|fecha|fechar|mov[eé]l|moveis|levanta|levantar|girar|giratorio|bascula|basculante)\b/},
  {id:"motor",label:"Motorização",rx:/\b(motores?|eletric[ao]s?|controle remoto|bateria|pilha|engrenagens?|transmiss[aã]o|automatic[ao])\b/},
  {id:"detalhes",label:"Detalhes especiais",rx:/\b(janelas?|telhados?\s+(inclinados?|curvos?)|portas?\s+(?:que|com|moveis?|azuis?|vermelhas?)|asas?|helices?|bracos?\s+mecanicos?|escavadeiras?)\b/}
 ];
 const UNSUPPORTED_OBJECTS=[
  {id:"veiculo",label:"Veículos com formato específico",rx:/\b(carros?|caminhoes?|caminhonetes?|onibus|tratores?|motos?|viaturas?|guinchos?|escavadeiras?|trem|trens|bicicletas?)\b/},
  {id:"voador",label:"Aeronaves ou foguetes",rx:/\b(aviao|avioes|helicopteros?|foguetes?|naves?|drones?)\b/},
  {id:"animal",label:"Animais ou personagens",rx:/\b(dinossauros?|cachorros?|gatos?|sap[oo]s?|ursos?|passaros?|robos?|bonecos?|drag[ao]es?|monstros?)\b/},
  {id:"cidade",label:"Cidade completa",rx:/\b(cidades?|bairros?|vilas?|parques?\s+de\s+divers[aã]o)\b/},
  {id:"ponte",label:"Estrutura suspensa",rx:/\b(pontes?|viadutos?|passarelas?)\b/}
 ];
 const noteByFeature={
  rodas:"É necessário modelar e verificar suportes, rodas, eixos, folgas e graus de liberdade; não basta desenhar cilindros.",
  articulacao:"Exige pares reais de dobradiças ou articulações compatíveis, limites de curso e verificação de colisão em movimento.",
  motor:"O conjunto 10698 não está certificado neste sistema para acionar motores ou engrenagens; jamais simular atuação inexistente.",
  detalhes:"É preciso geometria fiel das peças especiais e um plano que conecte cada detalhe solicitado."
 };
 const simplify=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
 const idOf=p=>String(p.part)+"|"+String(p.color||"").toLowerCase();
 const sum=a=>a.reduce((n,p)=>n+Number(p.quantity||0),0);
 const unique=a=>[...new Set(a)];
 const rounded=n=>Number(n.toFixed(3));
 function inventoryAudit(catalog,reserved){
  const items=Array.isArray(catalog)?catalog:[],busy=reserved instanceof Map?reserved:new Map(Object.entries(reserved||{}));
  const keys=new Set(),issues=[];
  for(const [i,p] of items.entries()){
    const k=idOf(p);
    if(keys.has(k))issues.push("Código/cor repetido: "+k);
    keys.add(k);
    if(!/^[A-Za-z0-9_-]{2,32}$/.test(String(p.part))||!p.color||!Number.isSafeInteger(Number(p.quantity))||Number(p.quantity)<0)
      issues.push("Registro inválido na linha "+(i+1));
    if(Number(busy.get(k)||0)>Number(p.quantity||0))issues.push("Reservas excedem o estoque: "+k);
  }
  for(const [k,n] of busy)if(n>0&&!keys.has(k))issues.push("Há reserva de peça não registrada: "+k);
  const known=sum(items),lots=items.length;
  if(known>SET.declared)issues.push("Quantidade acima do total oficial de "+SET.declared);
  const completeCount=known===SET.declared&&lots===SET.declaredLots;
  return {set:SET.id,totalDeclared:SET.declared,regularLotsDeclared:SET.declaredLots,
    known,missing:Math.max(0,SET.declared-known),lots,lotsUnmapped:Math.max(0,SET.declaredLots-lots),
    availableKnown:items.reduce((t,p)=>t+Math.max(0,p.quantity-(busy.get(idOf(p))||0)),0),
    countComplete:completeCount,physicalContentsConfirmed:false,valid:issues.length===0,issues,
    evidence:completeCount?"Contagem compatível com as fontes; peças e variantes ainda exigem conferência física.":"Inventário parcial: não inferir códigos, cores ou formas ausentes."};
 }
 function requiredFeatures(text){
  const q=simplify(text);
  const unmet=[...UNSUPPORTED_OBJECTS,...REQUIRED_FEATURES].filter(o=>o.rx.test(q));
  return unmet.map(o=>({id:o.id,label:o.label,details:noteByFeature[o.id]||"Não existe planejador geométrico deste objeto disponível na versão atual."}));
 }
 function checkSupply(pieces,catalog,reserved){
  const stock=new Map((catalog||[]).map(p=>[idOf(p),Number(p.quantity)||0]));
  const busy=reserved instanceof Map?reserved:new Map(Object.entries(reserved||{}));
  const req=new Map();
  for(const p of pieces||[])req.set(idOf(p),(req.get(idOf(p))||0)+1);
  const missing=[];
  for(const [id,qty] of req){const free=Math.max(0,(stock.get(id)||0)-(busy.get(id)||0));if(qty>free)missing.push({id,need:qty,free,missing:qty-free});}
  return {ok:missing.length===0,requiredPieces:(pieces||[]).length,differentLots:req.size,missing};
 }
 function overlap(a,b){
  return Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*
    Math.max(0,Math.min(a.z+a.d,b.z+b.d)-Math.max(a.z,b.z));
 }
 function stepAudit(project){
  const ps=project?.pieces||[],steps=[],issues=[];
  if(!ps.length)return {valid:false,issues:["Projeto vazio"],steps:[]};
  const occupancy=new Map();
  for(let i=0;i<ps.length;i++){
   const p=ps[i];let supports=[],contact=0;
   const layer=occupancy.get(p.y)||[];
   for(const q of layer)if(overlap(p,q)>0)issues.push("Colisão já na etapa "+(i+1));
   if(p.y>0){
    const below=occupancy.get(p.y-1)||[];
    supports=below.filter(q=>overlap(p,q)>0);
    contact=supports.reduce((t,q)=>t+overlap(p,q),0);
    if(contact<Math.min(2,p.w*p.d))issues.push("Etapa "+(i+1)+" posicionada sem apoio mínimo de peças anteriores");
   }
   if(!occupancy.has(p.y))occupancy.set(p.y,[]);
   occupancy.get(p.y).push(p);
   steps.push({
    number:i+1,code:String(p.part),color:p.color,orientation:p.w+"x"+p.d,
    grid:{x:p.x,z:p.z,layer:p.y+1},supportContacts:contact,
    supportPieces:supports.map(q=>String(q.part)+"|"+q.color),
    action:p.y===0?"Apoiar sobre a superfície plana":"Encaixar nos pinos das peças da camada anterior",
    passesPriorSupport:p.y===0||contact>=Math.min(2,p.w*p.d)
   });
  }
  return {valid:issues.length===0,issues,steps};
 }
 function certificate(project,catalog,reserved,generator){
  const inv=inventoryAudit(catalog,reserved),supply=checkSupply(project?.pieces,catalog,reserved);
  const geometry=generator&&typeof generator.validate==="function"?generator.validate(project):{ok:false,errors:["Motor geométrico indisponível"]};
  const construction=stepAudit(project);
  const errors=[...inv.issues,...supply.missing.map(p=>"Faltam "+p.missing+" de "+p.id),
    ...(geometry.errors||[]),...construction.issues];
  const pass=inv.valid&&supply.ok&&geometry.ok&&construction.valid;
  return {
    status:pass?"GRADE_CONFERIDA":"REPROVADO",
    valid:pass,code:"ORACULO-3D-V3",pieces:project?.pieces?.length||0,
    inventory:inv,supply,geometry:{pass:!!geometry.ok,errors:geometry.errors||[]},
    assembly:{pass:construction.valid,stepCount:construction.steps.length,issues:construction.issues},
    steps:construction.steps,errors,
    assurances:{
      catalogWithinRegisteredAmounts:pass,gridNoOverlaps:!!geometry.ok,
      sequentialSupport:construction.valid,wholeAssemblyConnected:!!geometry.connected,
      engineeringStrengthVerified:false,physicalBalanceVerified:false,
      movingMechanismsVerified:false,exactLDrawGeometryLoaded:false,physicalAssemblyTested:false
    },
    warning:"Grade e consumo calculados; NÃO é certificação de estabilidade física ou geometria completa de todas as peças."
  };
 }
 function analyze(text,catalog,reserved,generator,options={}){
  const request=String(text||"").trim(),inv=inventoryAudit(catalog,reserved);
  if(!request)return {status:"FALTA_PEDIDO",message:"Otto precisa descrever o brinquedo.",inventory:inv};
  if(request.length>600)return {status:"PEDIDO_EXCESSIVO",message:"Descreva a construção em até 600 caracteres.",inventory:inv};
  if(!inv.valid)return {status:"ESTOQUE_INCONSISTENTE",message:"Corrija os dados de inventário antes de gerar.",inventory:inv};
  const features=requiredFeatures(request);
  if(features.length)return {status:"REQUISITO_NAO_IMPLEMENTADO",
    message:"Ainda não é possível garantir este pedido fielmente. O ORÁCULO não substituirá características solicitadas por outra construção.",
    requested:request,unverified:features,inventory:inv,
    next:"Para este pedido, precisamos mapear modelos LDraw, conexões e as peças especiais no inventário."};
  if(!generator||typeof generator.generate!=="function")return {status:"MOTOR_INDISPONIVEL",message:"Motor de projetos indisponível.",inventory:inv};
  const r=generator.generate(request,catalog,reserved,{name:options.name,maxNodes:options.maxNodes||35000});
  if(!r.ok)return {status:"SEM_SOLUCAO",message:r.error,inventory:inv,details:r.details||null,
    next:"Tente uma construção menor, outra cor ou outra forma com peças disponíveis."};
  const cert=certificate(r.project,catalog,reserved,generator);
  if(!cert.valid)return {status:"PROJETO_REPROVADO",message:"O verificador de engenharia encontrou incompatibilidades.",certificate:cert,inventory:inv};
  r.project.oracle={
    version:3,status:cert.status,verifiedAt:new Date().toISOString(),
    policy:"Grade conferida, estabilidade não certificada",
    steps:cert.steps.length,geometrySource:"Grade geométrica — use visualização LDraw verificável para detalhes externos"
  };
  return {status:"PROJETO_VALIDO_NA_GRADE",message:"Projeto viável dentro do estoque registrado e das verificações geométricas implementadas.",
    project:r.project,certificate:cert,inventory:inv};
 }
 function projectReport(result){
  const selected={version:3,set:SET.id,requested:result?.project?.idea||result?.requested||"",
    status:result?.status||"DESCONHECIDO",createdAt:new Date().toISOString(),
    project:result?.project||null,certificate:result?.certificate||null,
    inventory:result?.inventory||null,unverified:result?.unverified||null,
    limitations:["Catálogo da caixa parcial até importação e conferência física.",
     "Renderização esquemática não é modelo externo exato até a malha LDraw ser carregada.",
     "Conectividade de grade não comprova resistência, atrito ou equilíbrio.",
     "Sem engenharia certificada de mecanismos, engrenagens, rolamentos e motores."]};
  return JSON.stringify(selected,null,2);
 }
 const families=[
  {title:"Construções",items:["Torres","Casas de forma simples","Muros","Escadas","Plataformas"],level:"grade-implementada"},
  {title:"Transportes",items:["Carros","Caminhões","Tratores","Ônibus","Aviões","Barcos","Trens"],level:"aguardando-geometria-e-mecanismos"},
  {title:"Mecanismos",items:["Rodas e eixos","Dobradiças","Braços articulados","Manivelas","Alavancas","Polias","Engrenagens"],level:"aguardando-mapeamento-cinematico"},
  {title:"Criaturas e natureza",items:["Animais","Dinossauros","Robôs","Árvores","Palmeiras","Flores"],level:"aguardando-planejador-volumetrico"}
 ];
 return {SET,families,inventoryAudit,requiredFeatures,stepAudit,checkSupply,certificate,analyze,projectReport,simplify};
});
