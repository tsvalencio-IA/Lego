const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),vm=require("node:vm");
const home=path.join(__dirname,".."),get=p=>fs.readFileSync(path.join(home,p),"utf8");
const canvas={window:{}},fid=require("../fidelidade.js");
vm.runInNewContext(get("modelos3d-canvas.js"),canvas);
vm.runInNewContext(get("modelos3d-catalogo.js"),canvas);
const parse=canvas.window.OTTOCanvasCAD.parse,records=canvas.window.OTTO_MODELOS3D;
const cases={
 "lego-camera":{path:"camera",parts:2,page2:3},
 "lego-castelo":{path:"castelo",parts:3,page2:4},
 "lego-escavadeira":{path:"escavadeira",parts:3,page2:3},
 "lego-apartamento":{path:"apartamento",parts:4,page2:4},
 "lego-palmeira":{path:"palmeira",parts:3,page2:3},
 "lego-ursinho":{path:"ursinho",parts:2,page2:3}
};
for(const [id,p] of Object.entries(cases)){
 const record=records[id];
 assert(record,"Falta modelo "+id);
 assert.equal(record.quality,"reconstrucao-parcial","Não declarar construção concluída");
 assert.equal(record.stepsDigitized,2);
 assert(record.stepsDeclared>record.stepsDigitized);
 const source=get("modelos3d/parciais/"+p.path+"-partes.mpd");
 const result=parse(source);
 assert.equal(result.steps,2,id);
 assert.equal(result.partCount,p.parts,id);
 assert(result.triangles.length>100,"Deve conter geometrias LDraw: "+id);
 assert.equal(fid.manualPage(id,2),p.page2,"Etapa sem correspondência no manual: "+id);
 assert.notEqual(fid.audit(id,source).certified100,true);
 console.log(id+" · "+result.partCount+" peças iniciais · "+result.triangles.length+" faces · 2 etapas CAD");
}
assert.equal(Object.keys(records).length,7,"Não alterar os 12 cards nem misturar outros projetos");
console.log("OTTO CAD PARCIAL PASS: seis fontes oficiais em 3D, 2 etapas iniciais e cobertura explicitamente incompleta.");
