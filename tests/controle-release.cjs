const assert=require("node:assert/strict"),cp=require("node:child_process");
const {verify,requiredProofs}=require("../scripts/verificar-fidelidade.cjs");
const a=verify();
assert.equal(a.set,"10698");
assert.equal(a.items,12);
assert.equal(a.models,10);
assert.equal(a.collections,2);
assert.equal(a.ready,0,"Não aceitar projetos como fiéis quando os manuais não foram integralmente conferidos");
assert.equal(a.problems,12);
assert.equal(new Set(a.reports.map(x=>x.id)).size,12);
assert.equal(requiredProofs.length,6);
const byId=id=>a.reports.find(x=>x.id===id);
assert.equal(byId("lego-sapo").stageCount,11);
assert.equal(byId("lego-sapo").pieceCount,16);
assert.equal(byId("lego-camera").stageCount,2);
assert.equal(byId("lego-camera").coverage,2/12);
assert.equal(byId("lego-castelo").coverage,null);
assert.equal(byId("moc-casa-modular").stageCount,null);
assert(byId("lego-sapo").errors.some(x=>/prova por peça/i.test(x)));
assert(byId("lego-apartamento").errors.some(x=>/Etapas do manual ainda não contadas/.test(x)));
assert(byId("lego-manual-1").errors.some(x=>/coleção/i.test(x)));
assert.notEqual(cp.spawnSync(process.execPath,["scripts/verificar-fidelidade.cjs","--release"],{cwd:require("node:path").resolve(__dirname,"..")}).status,0,
 "O comando de publicação DEVE recusar os 12 itens incompletos");
assert.equal(cp.spawnSync(process.execPath,["scripts/verificar-fidelidade.cjs"],{cwd:require("node:path").resolve(__dirname,"..")}).status,0,
 "O comando de auditoria deve funcionar sem promover modelo incorretamente");
console.log("GATE HONESTO 10698: PASS; zero modelos autorizados a publicar como fiéis, sem perder a contagem e os manuais.");
