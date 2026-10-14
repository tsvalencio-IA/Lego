/* Source-root LDraw assembly envelope proof for first two stages.
   Detects unsupported floating bricks, off-base parts, and unintended overlaps.
   Does NOT prove final official-manual placement nor joint strength.
*/
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),get=f=>fs.readFileSync(path.join(root,f),"utf8");
const F=require("../fidelidade.js");
const specs={"3034":[160,40,8],"2456":[120,40,24],"3028":[240,120,8],
 "3001":[80,40,24],"3032":[120,80,8],"3029":[240,80,8],
 "3004":[40,20,24],"3069":[40,20,8],"3031":[80,80,8],
 "3020":[80,40,8],"6215":[60,40,24]};
function bounds(part){
 const id=part.id.toLowerCase().replace(/\.dat$/,""),shape=specs[id];
 assert(shape,"Forma sem dimensão nominal controlada: "+id);
 assert.deepEqual(part.orientation,[1,0,0,0,1,0,0,0,1],"Rotação não validada de "+id);
 return {part,id,x1:part.position[0]-shape[0]/2,x2:part.position[0]+shape[0]/2,
  z1:part.position[2]-shape[1]/2,z2:part.position[2]+shape[1]/2,
  y:part.position[1],height:shape[2]};
}
const overlap=(a,b)=>Math.max(0,Math.min(a.x2,b.x2)-Math.max(a.x1,b.x1))*
 Math.max(0,Math.min(a.z2,b.z2)-Math.max(a.z1,b.z1));
function inspect(source,project){
 const frames=F.rootSteps(source).steps;
 assert.equal(frames.length,2,project);
 const parts=frames.flat().map(bounds),plates=parts.filter(p=>p.y===0);
 assert(plates.length>=1,"Base ausente: "+project);
 for(let i=0;i<parts.length;i++){
  const p=parts[i];
  if(p.y===0)continue;
  const below=parts.slice(0,i).filter(q=>q.y===p.y+p.height);
  const support=below.reduce((n,q)=>n+overlap(p,q),0);
  assert(support>0,project+" / "+p.id+": peça sem apoio vertical na grade");
  if(below.some(q=>q.y===0)){
    const totalArea=(p.x2-p.x1)*(p.z2-p.z1);
    assert(support>=totalArea-.01,
     project+" / "+p.id+": peça fora da placa (apoio "+support+"/"+totalArea+")");
  }
 }
 for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){
  const a=parts[i],b=parts[j];
  assert(!(a.y===b.y&&overlap(a,b)>0),
    project+": colisão entre "+a.id+" e "+b.id+" na camada "+a.y);
 }
 return parts;
}
const names=["camera","castelo","escavadeira","apartamento","palmeira","ursinho"];
for(const name of names){
 const packed=get("modelos3d/parciais/"+name+"-partes.mpd");
 const raw=get("modelos3d/parciais/"+name+".ldr");
 const a=inspect(packed,name),b=inspect(raw,name);
 assert.deepEqual(a.map(p=>p.part.position),b.map(p=>p.part.position),"Fontes CAD distintas: "+name);
 console.log("ENCAIXE PRELIMINAR "+name+": "+a.length+" peças sem sobreposição de tijolos e com apoio nominal");
}
let broken=get("modelos3d/parciais/camera.ldr").replace("1 0 20 -24 0","1 0 0 -24 20");
assert.throws(()=>inspect(broken,"camera com deslocamento fora da placa"),/fora da placa/);
broken=get("modelos3d/parciais/escavadeira.ldr").replace("1 191 0 -24 20","1 191 0 -24 -20");
assert.throws(()=>inspect(broken,"escavadeira com tijolos sobrepostos"),/colisão/);
console.log("GEOMETRIA PRELIMINAR PASS — os 6 modelos têm bases, apoio e posições nominais sem colisões.");
