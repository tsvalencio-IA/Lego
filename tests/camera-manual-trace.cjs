const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const e=JSON.parse(read("auditoria/10698-camera-manual-evidencias.json"));
const fidelity=require("../fidelidade.js");
assert.equal(e.modelId,"lego-camera");
assert.equal(e.manual.issuer,"The LEGO Group");
assert.match(e.manual.url,/10698_X_Camera\.pdf/);
assert.equal(e.totalManualStages,12);
assert.equal(e.sources.length,12);
assert.equal(e.counts.length,12);
assert.equal(e.counts.reduce((a,b)=>a+b,0),26);
for(let i=0;i<e.sources.length;i++){
 assert.equal(e.sources[i].step,i+1,"Ordem das etapas incorreta");
 assert.equal(e.sources[i].qty,e.counts[i]);
 assert(e.sources[i].page>=3&&e.sources[i].page<=9);
}
assert.equal(e.sources[11].substeps,4);
assert.equal(e.sources[11].qty,6);
assert.equal(e.audit.exactBrickIdsConfirmed,false);
assert.equal(e.audit.positionsConfirmed,false);
const p=fidelity.rootSteps(read("modelos3d/parciais/camera-partes.mpd"));
assert.deepEqual(p.counts,e.counts.slice(0,2));
assert(p.total<e.counts.reduce((a,b)=>a+b,0),"Modelo parcial não pode ser reconhecido como completo");
assert.equal(fidelity.audit("lego-camera",read("modelos3d/parciais/camera-partes.mpd")).certified100,undefined);
console.log("CÂMERA MANUAL: 12 etapas e 26 peças mapeadas, lente em 4 subetapas; CAD de 2 etapas permanece incompleto.");
