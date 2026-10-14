/* Evidence gate: an accurate step count is not proof of physical fidelity. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"auditoria/10698-sapo-manual-evidencias.json"),"utf8"));
const fidelity=require("../fidelidade.js");
const cad=fs.readFileSync(path.join(root,"modelos3d/lego-sapo-10698-packed.mpd"),"utf8");
const model=fidelity.rootSteps(cad);
assert.equal(manifest.schema,"otto.manual-evidence.v1");
assert.equal(manifest.set,"10698");
assert.equal(manifest.modelId,"lego-sapo");
assert(manifest.manual.url.startsWith("https://www.lego.com/"));
assert.equal(manifest.expectedStages,11);
assert.equal(manifest.expectedPieceTotal,16);
assert.equal(manifest.stages.length,11);
assert.equal(manifest.stages.reduce((sum,stage)=>sum+stage.count,0),16);
const pages=[3,3,4,4,5,5,6,6,7,7,8];
for(let i=0;i<manifest.stages.length;i++){
  const stage=manifest.stages[i];
  assert.equal(stage.step,i+1);
  assert.equal(stage.page,pages[i]);
  assert.equal(stage.count,model.counts[i],"Divergência no número de peças da etapa "+(i+1));
  assert(Array.isArray(stage.observed)&&stage.observed.length>0);
  assert.equal(stage.partCodesVerified,false,"Não confirmar códigos sem comparação original");
  assert.equal(stage.positionsVerified,false,"Não confirmar coordenadas sem cotejo CAD/manual");
}
const report=fidelity.audit("lego-sapo",cad);
assert.equal(report.criteria.stepCountsMatch,true);
assert.equal(report.criteria.pieceTotalMatches,true);
assert.equal(report.certified100,false);
assert.notEqual(report.status,"CONFERIDO_100");
assert(/PENDENTE/.test(manifest.status));
console.log("AUDITORIA MANUAL: 11 etapas e 16 peças alinhadas em CONTAGEM. Geometria e encaixes não certificados.");
