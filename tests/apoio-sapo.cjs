const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),r=p=>fs.readFileSync(path.join(root,p),"utf8");
const F=require("../fidelidade.js");
const mpd=r("modelos3d/lego-sapo-10698-packed.mpd"),ldr=r("modelos3d/lego-sapo-10698.ldr");
const a=F.rootSteps(mpd),b=F.rootSteps(ldr);
assert.equal(a.steps.length,11);
assert.equal(a.parts.length,16);
assert.deepEqual(a.steps.map(x=>x.length),[1,2,2,1,1,2,1,1,2,1,2]);
assert.deepEqual(a.parts,b.parts,"Arquivo principal e pacote MPD devem conter as mesmas posições");
const pick=(stage,part)=>{
 const matches=a.steps[stage-1].filter(x=>x.id===part+".dat");
 assert.equal(matches.length,1,"Peça não encontrada na etapa "+stage);
 return matches[0];
};
const lime5=pick(5,"3004"),lime7=pick(7,"3003"),plate8=pick(8,"3021");
const greenEyes=a.steps[8].filter(p=>p.id==="4070.dat");
assert.equal(lime7.position[1],lime5.position[1]-24,"Tijolo 2×2 deve encaixar no tijolo 1×2");
assert.equal(plate8.position[1],lime7.position[1]-8,"Placa 2×3 deve tocar a face superior do tijolo 2×2");
assert.equal(plate8.position[0],lime7.position[0],"Placa deve ficar sobre o centro do tijolo");
assert.equal(plate8.position[2],lime7.position[2],"Placa deve ficar sobre o centro do tijolo");
for(const eye of greenEyes)assert.equal(eye.position[1],plate8.position[1]-24,
 "Tijolos de suporte aos olhos devem assentar na placa 2×3");
assert(!/1 2 0 -72 -20 1 0 0 0 1 0 0 0 1 3021.dat/.test(mpd),
 "Não recolocar a placa suspensa por 16 unidades");
assert.equal(F.audit("lego-sapo",mpd).certified100,false,
 "Correção de altura não equivale a aprovação de fidelidade física");
console.log("Sapo LEGO: cadeia vertical 1x2 → 2x2 → placa 2x3 → suportes de olhos alinhada em LDU.");
