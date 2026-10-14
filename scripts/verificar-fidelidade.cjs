/*
 * OTTO LEGO — verificador independente de fidelidade.
 * Falha fechada: renderizar uma peça LDraw NÃO certifica a pose ou o encaixe.
 * A saída "auditoria" não é aprovação; apenas um CAD totalmente comprovado
 * pode obter status PRONTO_PARA_PUBLICAR.
 *
 * Uso:
 * node scripts/verificar-fidelidade.cjs
 * node scripts/verificar-fidelidade.cjs --release   (retorna erro até todos aprovados)
 */
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"..");
const read=(p)=>fs.readFileSync(path.join(ROOT,p),"utf8");
const manifest=JSON.parse(read("auditoria/controle-fidelidade-v2.json"));
function registry(file,key){
 const ctx={window:{}};vm.runInNewContext(read(file),ctx,{filename:file});
 return JSON.parse(JSON.stringify(ctx.window[key]));
}
const catalog=registry("catalogo-reais.js","OTTO_CATALOGO_REAL");
const oldModels=registry("modelos3d-catalogo.js","OTTO_MODELOS3D");
const F=require("../fidelidade.js");
const requiredProofs=[
 "manualPdfInspected","stepPartsValidated","geometryComparedWithEveryPage",
 "exactColorsValidated","allJointConnectionsValidated","inventoryWithin10698"
];
function verify(){
 if(manifest.schemaVersion!=="otto-fidelidade-2")throw Error("Manifesto não reconhecido");
 if(manifest.set!=="10698"||manifest.setPieces!==790)throw Error("Conjunto LEGO incorreto");
 const sourceIds=new Set(catalog.map(p=>p.id));
 const seen=new Set();
 if(sourceIds.size!==catalog.length)throw Error("IDs duplicados no catálogo");
 if(manifest.entries.length!==catalog.length)throw Error("Manifesto não cobre todos os projetos do catálogo");
 const reports=[];
 for(const entry of manifest.entries){
  if(seen.has(entry.id))throw Error("Duplicidade: "+entry.id);seen.add(entry.id);
  const original=catalog.find(p=>p.id===entry.id);
  if(!original)throw Error("Projeto inexistente no catálogo: "+entry.id);
  if(!/^https:\/\//.test(entry.manual))throw Error("Sem fonte verificável: "+entry.id);
  if(entry.manual!==original.manual)throw Error("Fonte adulterada em "+entry.id);
  const report={id:entry.id,kind:entry.kind,original:entry.manual,approved:false,
    errors:[],warnings:[],coverage:null,stageCount:null,pieceCount:null};
  if(entry.kind==="colecao"){
   report.errors.push("Livro é coleção: exige separar e auditar cada construção individual");
   reports.push(report);continue;
  }
  if(entry.kind!=="modelo")throw Error("Tipo inesperado de entrada: "+entry.kind);
  if(!entry.cadFile||!fs.existsSync(path.join(ROOT,entry.cadFile))){
   report.errors.push("Não existe arquivo CAD deste modelo");reports.push(report);continue;
  }
  const cad=read(entry.cadFile);
  try{
   const model=F.rootSteps(cad);
   report.stageCount=model.steps.length;report.pieceCount=model.parts.length;
   report.coverage=Number.isInteger(entry.manualStages)&&entry.manualStages>0?
      model.steps.length/entry.manualStages:null;
   if(entry.stagesIndependentlyCounted&&model.steps.length!==entry.manualStages)
    report.errors.push("Etapas CAD diferentes das etapas oficiais");
   if(entry.stagesIndependentlyCounted&&Number.isInteger(entry.expectedParts)&&model.parts.length!==entry.expectedParts)
    report.errors.push("Peças CAD diferentes da contagem do manual");
   if(!entry.stagesIndependentlyCounted)
    report.errors.push("Etapas do manual ainda não contadas independentemente");
   if(model.parts.some(p=>!p.id||!Number.isInteger(p.color)||p.orientation?.length!==9||
      !p.position.every(Number.isFinite)))
    report.errors.push("Arquivo CAD contém peça ou coordenadas inválidas");
   if(model.parts.some(p=>!p.id.toLowerCase().endsWith(".dat")))
    report.errors.push("O modelo precisa usar códigos de peça individuais, não abstrações sem lista própria");
   const proofFile="auditoria/provas-3d/"+entry.id+".json";
   if(!fs.existsSync(path.join(ROOT,proofFile))){
    report.errors.push("Não existe prova por peça e por etapa, contrastada com manual oficial");
   }else{
    let proof;
    try{proof=JSON.parse(read(proofFile));}catch{report.errors.push("Prova 3D ilegível");}
    if(proof){
     if(proof.id!==entry.id||proof.manual!==entry.manual)
      report.errors.push("Prova pertence a projeto ou manual diferente");
     for(const k of requiredProofs)if(proof.checks?.[k]!==true)
      report.errors.push("Critério não verificado: "+k);
     if(!Array.isArray(proof.steps)||proof.steps.length!==model.steps.length)
      report.errors.push("Prova não cobre todas as etapas CAD");
     else for(let i=0;i<model.steps.length;i++){
      const stage=proof.steps[i];
      if(stage.number!==i+1||!Number.isInteger(stage.manualPage)||stage.manualPage<1||
         !Array.isArray(stage.pieces)||stage.pieces.length!==model.steps[i].length){
       report.errors.push("Prova da etapa "+(i+1)+" incompleta");continue;
      }
      for(let j=0;j<model.steps[i].length;j++){
       const a=model.steps[i][j],b=stage.pieces[j];
       if(a.id!==b?.id||a.color!==b.color||JSON.stringify(a.position)!==JSON.stringify(b.position)||
          JSON.stringify(a.orientation)!==JSON.stringify(b.orientation)||
          typeof b.independentReview!=="string"||b.independentReview.trim().length<12)
        report.errors.push("Evidência individual ausente ou divergente na etapa "+(i+1)+", peça "+(j+1));
      }
     }
    }
   }
  }catch(err){report.errors.push("CAD não pôde ser validado: "+(err.message||err));}
  if(entry.cadStatus!=="certificado")report.errors.push("Status ainda não certificado");
  if(entry.blockers?.length)report.errors.push(...entry.blockers.map(x=>"Pendente: "+x));
  report.approved=report.errors.length===0;
  reports.push(report);
 }
 if([...sourceIds].some(id=>!seen.has(id)))throw Error("Há projeto fora do manifesto");
 return {set:manifest.set,items:reports.length,models:reports.filter(x=>x.kind==="modelo").length,
   collections:reports.filter(x=>x.kind==="colecao").length,
   ready:reports.filter(x=>x.approved).length,problems:reports.filter(x=>!x.approved).length,reports};
}
if(require.main===module){
 try{
  const result=verify();
  for(const p of result.reports){
   console.log((p.approved?"APROVADO":"PENDENTE").padEnd(10)+" "+p.id.padEnd(22)+" "+(p.coverage===null?"cobertura não provada":Math.round(p.coverage*100)+"% de etapas CAD")+" • "+p.errors.length+" pendências");
  }
  console.log("RESULTADO: "+result.ready+"/"+result.models+" modelos certificados; "+
              result.collections+" coletâneas aguardam desdobramento. "+
              "NÃO confundir validação de interface com aprovação LEGO.");
  if(process.argv.includes("--release")&&result.problems)process.exitCode=1;
 }catch(err){console.error(err);process.exitCode=2;}
}
module.exports={verify,requiredProofs};
