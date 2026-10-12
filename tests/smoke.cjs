const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const script=fs.readFileSync(path.join(root,"app.js"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifest.webmanifest"),"utf8"));
assert.match(html,/app\.js\?v=/);
assert.match(html,/styles\.css\?v=/);
assert.match(html,/manifest\.webmanifest/);
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
 "\nreturn {build,shortage,requirements,used,sum,savePreview,renderAll,parseCSV,validateCatalog,onProjectAction,projects:()=>state.projects,catalog:()=>state.catalog,setPreview:p=>{preview=p;previewSaved=false;}};"
)(document,localStorage,{},null,()=>true,()=>1,()=>{},function(){},{createObjectURL(){return "";},revokeObjectURL(){}});
assert.equal(runtime.catalog().length,39);
assert.equal(runtime.sum(runtime.catalog()),131);
assert.equal(Number(element("total").textContent),790);
assert.equal(Number(element("available").textContent),131);
const tower=runtime.build("torre","Minha torre","Quero torre");
assert.equal(tower.pieces.length,7);
assert.equal(runtime.shortage(tower).length,0);
runtime.setPreview(tower);runtime.savePreview();
assert.equal(runtime.projects().length,1);
assert.equal(Number(element("committed").textContent),7);
assert.equal(Number(element("available").textContent),124);
runtime.setPreview(tower);runtime.savePreview();
assert.equal(runtime.projects().length,2);
assert.equal(Number(element("committed").textContent),14);
assert(runtime.shortage(tower).length>0,"terceira torre deveria exceder as peças verdes e azuis");
const firstId=runtime.projects()[0].id;
runtime.onProjectAction(firstId,"toggle");
assert.equal(runtime.projects()[0].status,"montado");
assert.equal(Number(element("committed").textContent),14);
runtime.onProjectAction(firstId,"toggle");
assert.equal(runtime.projects()[0].status,"desmontado");
assert.equal(Number(element("committed").textContent),7);
assert.equal(runtime.shortage(tower).length,0);
const rows=runtime.validateCatalog(runtime.parseCSV("part,color,quantity,name\n3004,Black,4,Brick 1 x 2\n3002,Black,8,Brick 2 x 3"));
assert.equal(runtime.sum(rows),12);
assert.throws(()=>runtime.validateCatalog([{part:"3004",color:"Black",quantity:4},{part:"3004",color:"Black",quantity:2}]));
assert.throws(()=>runtime.validateCatalog([{part:"3004",color:"Black",quantity:791}]));
console.log("OTTO 3D smoke: PASS (inventory, reservations, return, import and static links)");
