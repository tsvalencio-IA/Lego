const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("index.html"),src=read("simple.js"),generator=read("generator.js"),seed=read("inventory-seed.js");
for(const n of ["simple.js?v=4.0.0","generator.js?v=4.0.0","inventory-seed.js?v=4.0.0"])
 assert(html.includes(n),"Arquivo não referenciado no HTML: "+n);
const listed=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(new Set(listed).size,listed.length,"IDs HTML repetidos");
const elements=new Map();
function element(id){if(!elements.has(id)){
 const x={id,value:"",innerHTML:"",textContent:"",style:{},disabled:false,className:"",
 addEventListener(type,handler){this["listener_"+type]=handler;},click(){this.onclick?.();}};
 elements.set(id,x);
 }return elements.get(id);}
const local={storage:{},getItem(k){return this.storage[k]||null;},setItem(k,v){this.storage[k]=v;}};
const doc={getElementById:element,querySelectorAll(){return []}};
const c={window:{OTTO_SEED:[],scrollTo(){}},document:doc,localStorage:local,
 confirm:()=>true,Blob:class{},URL:{createObjectURL:()=>"",revokeObjectURL:()=>{}},
 setTimeout:()=>0};
c.window.window=c.window;c.window.globalThis=c.window;c.globalThis=c.window;
vm.runInNewContext(seed,c,{filename:"inventory-seed.js"});
vm.runInNewContext(generator,c,{filename:"generator.js"});
assert.equal(c.window.OTTO_SEED.length,39);
vm.runInNewContext(src,c,{filename:"simple.js"});
const ids=[...src.matchAll(/\bel\("([^"]+)"\)/g)].map(x=>x[1]);
assert.deepEqual([...new Set(ids.filter(x=>!listed.includes(x)))],[],"JS usa IDs que não existem");
assert.equal(element("known").textContent,131);
assert.equal(element("busy").textContent,0);
element("prompt").value="torre";
element("create").onclick();
assert.equal(element("save").disabled,false);
assert.match(element("notice").textContent,/Projeto calculado/);
element("next").onclick();
assert.match(element("sketch").innerHTML,/<svg /);
element("turn").onclick();
assert.match(element("sketch").innerHTML,/<svg /);
element("save").onclick();
const state=JSON.parse(local.getItem("otto3d:v1"));
assert.equal(state.projects.length,1);
assert.equal(state.projects[0].status,"planejado");
assert(element("busy").textContent>0);
const id=state.projects[0].id,city=element("city");
city.listener_click({target:{closest:()=>({dataset:{id,action:"switch"}})}});
assert.match(city.innerHTML,/Montado/);
city.listener_click({target:{closest:()=>({dataset:{id,action:"switch"}})}});
assert.equal(element("busy").textContent,0);
element("prompt").value="quero um caminhão com rodas";
element("create").onclick();
assert.match(element("notice").textContent,/não constrói/);
assert.equal(element("save").disabled,true);
assert.equal(element("sketch").innerHTML.includes("<svg"),false);
console.log("OTTO v4 PASS: interface, estoque 131, geração real, SVG, salvar, montar, devolver, rejeitar pedidos impossíveis.");
