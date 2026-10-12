/* ORÁCULO 3D — testes de segurança de requisitos e validações matemáticas */
const assert=require("node:assert/strict");
const Oracle=require("../oraculo.js");
const Engine=require("../generator.js");
const fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"../app.js"),"utf8");
const rows=[...app.matchAll(/\["([A-Za-z0-9]+)","([^"]+)",([0-9]+),"([^"]+)"\]/g)].map(m=>({
 part:m[1],color:m[2],quantity:Number(m[3]),name:m[4]
}));
assert.equal(rows.length,39);
const snapshot=Oracle.inventoryAudit(rows,new Map());
assert.equal(snapshot.known,131);
assert.equal(snapshot.missing,659);
assert.equal(snapshot.countComplete,false);
assert.equal(snapshot.availableKnown,131);
const good=Oracle.analyze("Quero uma torre azul de 3 camadas",rows,new Map(),Engine);
assert.equal(good.status,"PROJETO_VALIDO_NA_GRADE",good.message);
assert.equal(good.certificate.valid,true);
assert.equal(good.certificate.assurances.engineeringStrengthVerified,false);
assert.equal(good.certificate.assurances.physicalAssemblyTested,false);
assert.equal(good.certificate.steps.length,good.project.pieces.length);
assert(good.project.pieces.every(p=>p.color==="Bright Blue"));
assert.equal(good.certificate.supply.missing.length,0);
const blank=Oracle.analyze(" ",rows,new Map(),Engine);
assert.equal(blank.status,"FALTA_PEDIDO");
const truck=Oracle.analyze("Quero um caminhão vermelho com caçamba que levanta",rows,new Map(),Engine);
assert.equal(truck.status,"REQUISITO_NAO_IMPLEMENTADO");
assert(truck.unverified.some(x=>x.id==="veiculo"));
assert(truck.unverified.some(x=>x.id==="articulacao"));
assert.equal("project" in truck,false,"não pode inventar um projeto");
const robots=Oracle.analyze("Quero um robô que gire e ande",rows,new Map(),Engine);
assert.equal(robots.status,"REQUISITO_NAO_IMPLEMENTADO");
const houseWindows=Oracle.analyze("Uma casa de 4x4 com janelas e garagem",rows,new Map(),Engine);
assert.equal(houseWindows.status,"REQUISITO_NAO_IMPLEMENTADO");
const houseDoor=Oracle.analyze("Uma casa 4x4 com porta",rows,new Map(),Engine);
assert.equal(houseDoor.status,"PROJETO_VALIDO_NA_GRADE",houseDoor.message);
const reserved=new Map();
for(const piece of good.project.pieces)reserved.set(piece.part+"|"+piece.color.toLowerCase(),
  6); // exhaust the blue 2x4
const shortage=Oracle.analyze("Quero uma torre azul de 3 camadas",rows,reserved,Engine);
assert.equal(shortage.status,"SEM_SOLUCAO");
const invalid={pieces:[
 {part:"3001",color:"Green",x:0,y:0,z:0,w:2,d:4},
 {part:"3001",color:"Green",x:0,y:1,z:0,w:2,d:4}
]};
const invalidSequence={pieces:[invalid.pieces[1],invalid.pieces[0]]};
const seq=Oracle.stepAudit(invalidSequence);
assert.equal(seq.valid,false,"peça superior colocada antes da base deve reprovar");
const clash={pieces:[invalid.pieces[0],{...invalid.pieces[0]}]};
assert.equal(Oracle.certificate(clash,rows,new Map(),Engine).valid,false);
const report=JSON.parse(Oracle.projectReport(good));
assert.equal(report.project.pieces.length,good.project.pieces.length);
assert.equal(report.status,"PROJETO_VALIDO_NA_GRADE");
console.log("ORACULO 3D smoke: PASS - registro real, rejeição de requisitos, estoque, sequência, colisão e laudo");
