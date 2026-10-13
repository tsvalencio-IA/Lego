const assert=require("node:assert/strict"),path=require("node:path"),fs=require("node:fs"),vm=require("node:vm");
const base=path.join(__dirname,".."),read=file=>fs.readFileSync(path.join(base,file),"utf8");
const fid=require("../fidelidade.js");
const data=read("modelos3d/lego-sapo-10698-packed.mpd");
const frog=fid.rootSteps(data);
assert.deepEqual(frog.counts,[1,2,2,1,1,2,1,1,2,1,2]);
assert.equal(frog.total,16);
const rep=fid.audit("lego-sapo",data);
assert.equal(rep.steps,11);
assert.equal(rep.totalPieces,16);
assert.equal(rep.criteria.stepCountsMatch,true);
assert.equal(rep.criteria.pieceTotalMatches,true);
assert.equal(rep.certified100,false,"um 3D aproximado jamais deve ser tratado como 100% fiel");
for(const missing of ["partIdsVerified","allPositionsVerified","connectionVerified","realBuildVerified"])
 assert.equal(rep.criteria[missing],false,"critério não auditado: "+missing);
assert.equal(fid.manualPage("lego-sapo",1),3);
assert.equal(fid.manualPage("lego-sapo",7),6);
assert.equal(fid.manualPage("lego-sapo",11),8);
const broken=data.replace("0 STEP","0 STEP\n1 15 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat");
const result=fid.audit("lego-sapo",broken);
assert.equal(result.certified100,false);
assert.equal(result.criteria.pieceTotalMatches,false,"não deve aprovar peça extra");
assert.equal(fid.audit("lego-castelo",null).status,"PENDENTE");
const catalog={window:{}};
vm.runInNewContext(read("catalogo-reais.js"),catalog);
const list=catalog.window.OTTO_CATALOGO_REAL;
assert.equal(list.length,12);
const ids=new Set(list.map(x=>x.id));
assert.equal(ids.size,12);
for(const item of list){
 assert(item.manual.startsWith("https://"),"manual real é obrigatório");
 assert(fid.audit(item.id,null).certified100!==true,"nunca inventar um certificado");
}
assert(list.filter(x=>x.id.startsWith("lego-manual-")).length===2,"livros não são modelos únicos");
const html=read("index.html"),ui=read("modelos3d-ui.js");
for(const id of ["model3dAudit","model3dManualFrame","model3dManualStep"])
 assert(html.includes('id="'+id+'"'),"interface de comparação faltando: "+id);
assert(ui.includes("fidelity?.manualPage"));
assert(ui.includes("checkFidelity(record,project)"));
console.log("OTTO FIDELIDADE: PASS; 12 fontes auditadas, 11 passos do sapo, 16 peças, modelo NÃO certificado.");
