const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const script=fs.readFileSync(path.join(root,"app.js"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const G=require("../generator.js");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifest.webmanifest"),"utf8"));
assert.match(html,/generator\.js\?v=2\.0\.0/);
assert.match(html,/app\.js\?v=2\.0\.0/);
assert.equal(manifest.start_url,"./");
const ids=new Map();
function element(id){
 if(!ids.has(id)){
  const members=new Set();
  ids.set(id,{id,value:"",innerHTML:"",textContent:"",disabled:false,style:{},className:"",
   classList:{add:c=>members.add(c),remove:c=>members.delete(c),toggle:(c,v)=>{if(v===false)members.delete(c);else members.add(c);}},
   addEventListener(){},focus(){},click(){}});
 }
 return ids.get(id);
}
const document={getElementById:element,querySelectorAll:()=>[],querySelector:()=>null};
const memory=new Map();
const localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
const runtime=new Function("document","localStorage","window","navigator","confirm","setTimeout","clearTimeout", "Blob","URL",script+
 "\nreturn {shortage,requirements,used,sum,savePreview,renderAll,parseCSV,validateCatalog,onProjectAction,projects:()=>state.projects,catalog:()=>state.catalog,setPreview:p=>{preview=p;previewSaved=false;},makePlan};"
)(document,localStorage,{OTTOGenerator:G},null,()=>true,()=>1,()=>{},function(){},{createObjectURL(){return "";},revokeObjectURL(){}});
assert.equal(runtime.catalog().length,39);
assert.equal(runtime.sum(runtime.catalog()),131);
assert.equal(Number(element("total").textContent),790);
assert.equal(Number(element("available").textContent),131);
const kinds=["torre","muro","casa","escada","plataforma"];
for(const kind of kinds){
 const generated=G.generate(kind,runtime.catalog());
 assert.equal(generated.ok,true,kind+": "+generated.error);
 assert.equal(generated.audit.ok,true);
 assert.equal(G.validate(generated.project).ok,true);
 assert(generated.project.pieces.length>0);
}
assert.notDeepEqual(G.generate("torre",runtime.catalog()).project.pieces,
 G.generate("torre de 2x4 com 2 camadas",runtime.catalog()).project.pieces);
assert.equal(G.generate("carro",runtime.catalog()).ok,false,"unsupported shapes must not be fabricated");
assert.equal(G.generate("torre branca",runtime.catalog()).ok,false,"requested color must not be substituted");
assert.equal(G.generate("plataforma de 4x4 com 1 camada",runtime.catalog()).ok,false,"disconnected layer must fail");
assert.equal(G.parseRequest("casa 6x6 com 3 camadas").width,6);
const house=G.generate("casa",runtime.catalog()).project;
const ldr=G.exportLDraw(house);
assert.equal((ldr.match(/^1 /gm)||[]).length,house.pieces.length,"each real brick must be exported");
assert.equal((ldr.match(/^0 STEP$/gm)||[]).length,house.pieces.length-1,"each brick must have a separate assembly step");
assert.match(ldr,/300[12345]\.dat|2456\.dat/);

const tower=G.generate("torre",runtime.catalog()).project;
runtime.setPreview(tower);runtime.savePreview();
assert.equal(runtime.projects().length,1);
assert.equal(Number(element("committed").textContent),tower.pieces.length);
runtime.setPreview(tower);runtime.savePreview();
assert.equal(runtime.projects().length,2);
assert.equal(Number(element("committed").textContent),tower.pieces.length*2);
const firstId=runtime.projects()[0].id;
runtime.onProjectAction(firstId,"toggle");
assert.equal(runtime.projects()[0].status,"montado");
runtime.onProjectAction(firstId,"toggle");
assert.equal(runtime.projects()[0].status,"desmontado");
assert.equal(Number(element("committed").textContent),tower.pieces.length);
const rows=runtime.validateCatalog(runtime.parseCSV("part,color,quantity,name\n3004,Black,4,Brick 1 x 2\n3002,Black,8,Brick 2 x 3"));
assert.equal(runtime.sum(rows),12);
assert.throws(()=>runtime.validateCatalog([{part:"3004",color:"Black",quantity:4},{part:"3004",color:"Black",quantity:2}]));
assert.throws(()=>runtime.validateCatalog([{part:"3004",color:"Black",quantity:791}]));
const collision={pieces:[{part:"3001",color:"Green",x:0,y:0,z:0,w:2,d:4},{part:"3001",color:"Green",x:0,y:0,z:0,w:2,d:4}]};
assert.equal(G.validate(collision).ok,false);
const floating={pieces:[{part:"3001",color:"Green",x:0,y:1,z:0,w:2,d:4}]};
assert.equal(G.validate(floating).ok,false);
console.log("OTTO 3D v2 smoke: PASS (procedural plans, connectivity, colors, LDraw steps, reservations, returns, imports)");
