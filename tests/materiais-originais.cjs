const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const F=require("../fidelidade.js");
const registry={window:{}};
vm.runInNewContext(read("modelos3d-catalogo.js"),registry);
const models=registry.window.OTTO_MODELOS3D;
const data=[
 ["lego-camera","camera",1,1],
 ["lego-castelo","castelo",1,2],
 ["lego-escavadeira","escavadeira",1,2],
 ["lego-apartamento","apartamento",2,2],
 ["lego-palmeira","palmeira",2,1],
 ["lego-ursinho","ursinho",1,1]
];
for(const [id,name,c1,c2] of data){
 const raw=read("modelos3d/parciais/"+name+".ldr");
 const packed=read("modelos3d/parciais/"+name+"-partes.mpd");
 const audit=F.auditInitialStages(id,packed);
 assert.equal(audit.hasReference,true,id);
 assert.equal(audit.matching,true,id+":"+audit.issues.join("; "));
 assert.equal(audit.positionsCertified,false);
 assert.equal(audit.physicalCertified,false);
 assert.equal(F.audit(id,packed).certified100,undefined,"Não marcar fidelidade absoluta");
 assert.equal(F.rootSteps(raw).counts[0],c1,id+" etapa 1");
 assert.equal(F.rootSteps(raw).counts[1],c2,id+" etapa 2");
 assert.equal(F.rootSteps(packed).total,c1+c2,id+" soma");
 assert.equal(models[id].quality,"reconstrucao-parcial");
 assert.equal(models[id].stepsDigitized,2);
 assert(models[id].stepsDeclared>2);
 const b=F.rootSteps(packed).parts[0];
 assert.match(F.describePiece(b),/código/);
 const sabotaged=packed.replace(/^1 ([0-9]+) ([^\n]+?)\.dat$/m,(full,col,rest)=>"1 999 "+rest+".dat");
 assert.equal(F.auditInitialStages(id,sabotaged).matching,false,
  id+": mutação intencional de cor deve reprovar");
}
const frog=read("modelos3d/lego-sapo-10698-packed.mpd");
const ref=F.catalogComparison("lego-sapo",frog);
assert.equal(ref.matching,true,ref.discrepancies.join("; "));
const wrongEyes=frog.replace(/98138p07\.dat/,"98138pb028.dat");
assert.equal(F.catalogComparison("lego-sapo",wrongEyes).matching,false);
assert.equal(F.FROG_CANDIDATES.length,11);
assert.equal(F.FROG_CANDIDATES.flat().length,16);
assert.equal(F.audit("lego-sapo",frog).certified100,false);
console.log("MATERIAIS OFICIAIS: PASS — 6 etapas iniciais duplas + 11 do sapo, códigos/cores rastreáveis, reprovação de alterações e zero falsas certificações.");
