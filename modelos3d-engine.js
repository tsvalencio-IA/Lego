/* OTTO — Visualizador CAD de modelos publicados.
   Fonte: LDraw .ldr/.mpd; não converte PDFs em posições arbitrárias.
   A renderização de peça real só é declarada após carregar as malhas LDraw.
*/
(function(root,factory){
 "use strict";const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.OTTOModelos3D=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const REMOTE=[
  "https://cdn.jsdelivr.net/gh/gkjohnson/ldraw-parts-library@master/complete/ldraw/",
  "https://raw.githubusercontent.com/gkjohnson/ldraw-parts-library/master/complete/ldraw/"
 ];
 const DB="otto-lego-cad-v1",STORE="models";
 function inspect(text){
  if(typeof text!=="string"||text.length<20||text.length>1500000)throw Error("Arquivo LDraw ausente ou acima de 1,5 MB.");
  const lines=text.replace(/\r/g,"").split("\n");
  const fileSections=lines.filter(l=>/^0\s+FILE\s+/i.test(l)).length;
  const linesOfParts=lines.filter(l=>/^1\s+\d+\s+/.test(l.trim()));
  if(!linesOfParts.length)throw Error("O arquivo não contém referências a peças LDraw.");
  if(linesOfParts.length>6000)throw Error("Modelo acima do limite de 6.000 instâncias.");
  const fields=linesOfParts.map(x=>x.trim().split(/\s+/));
  for(const x of fields){
   if(x.length<15||!/^[-.\d]+$/.test(x[2])||!/^[\d-]+$/.test(x[1])||!/^[a-z0-9_./\\ -]+\.(?:dat|ldr|mpd)$/i.test(x.slice(14).join(" ")))
    throw Error("Linha LDraw inválida ou peça não suportada: "+x.slice(0,3).join(" "));
  }
  return {lineCount:lines.length,partsReferenced:linesOfParts.length,
   stepSeparators:lines.filter(l=>/^0\s+STEP\s*$/i.test(l.trim())).length,
   isMultiPart:fileSections>1,files:fileSections};
 }
 const memory=new Map();
 function database(){
  return new Promise((resolve,reject)=>{
   if(typeof indexedDB==="undefined"){resolve(null);return;}
   const req=indexedDB.open(DB,1);
   req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};
   req.onerror=()=>reject(req.error||new Error("IndexedDB indisponível"));
   req.onsuccess=()=>resolve(req.result);
  });
 }
 async function get(id){
  try{
   const db=await database();
   if(!db)return memory.get(id)||null;
   return await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,"readonly"),r=tx.objectStore(STORE).get(id);
    r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);
    tx.oncomplete=()=>db.close();
   });
  }catch{return memory.get(id)||null;}
 }
 async function put(id,text,filename){
  const meta=inspect(text);
  const value={id,filename:String(filename||"projeto.ldr").slice(0,120),text,meta,
   importedAt:new Date().toISOString(),source:"Arquivo LDraw importado"};
  const db=await database();
  if(!db){memory.set(id,value);return value;}
  await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,"readwrite");
   tx.objectStore(STORE).put(value,id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });db.close();return value;
 }
 function sourceInfo(id){
  const builtin=window.OTTO_MODELOS3D?.[id];
  return builtin&&builtin.src?builtin:null;
 }
 async function projectSource(id){
  const imported=await get(id);
  if(imported)return imported;
  const config=sourceInfo(id);
  if(!config)return null;
  const response=await fetch(config.src,{cache:"no-cache"});
  if(!response.ok)throw Error("Falha ao buscar arquivo 3D ("+response.status+").");
  const text=await response.text();
  return {id,filename:config.src.split("/").pop(),text,meta:inspect(text),source:config.source,
   quality:config.quality,review:config.review||"",officialReference:config.officialReference||""};
 }
 class CADViewer{
  constructor(container,onState){
   this.element=container;this.onState=onState||(()=>{});
   this.disposed=false;this.activeToken=0;
   this.step=0;this.steps=0;this.loaded=null;this.ready=false;
  }
  status(str){if(!this.disposed)this.onState(str);}
  async init(){
   if(this.ready)return;
   this.status("Iniciando motor CAD…");
   const [THREE,{OrbitControls},{LDrawLoader}]=await Promise.all([
    import("three"),import("three/addons/controls/OrbitControls.js"),import("three/addons/loaders/LDrawLoader.js")
   ]);
   if(this.disposed)return;
   this.THREE=THREE;this.LDrawLoader=LDrawLoader;
   const scene=new THREE.Scene();scene.background=new THREE.Color("#ecf3fe");
   const camera=new THREE.PerspectiveCamera(45,1,.1,2000);
   const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"low-power"});
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
   renderer.outputColorSpace=THREE.SRGBColorSpace;
   renderer.domElement.style.cssText="display:block;width:100%;height:100%;touch-action:none";
   this.element.replaceChildren(renderer.domElement);
   const hemi=new THREE.HemisphereLight(0xffffff,0x98abc6,2.25);scene.add(hemi);
   const sun=new THREE.DirectionalLight(0xffffff,2.4);sun.position.set(70,95,65);scene.add(sun);
   const controls=new OrbitControls(camera,renderer.domElement);
   controls.enableDamping=true;controls.dampingFactor=.07;controls.enablePan=true;
   controls.maxPolarAngle=Math.PI*.92;controls.minDistance=5;controls.maxDistance=2000;
   this.scene=scene;this.camera=camera;this.renderer=renderer;this.controls=controls;this.ready=true;
   const tick=()=>{if(this.disposed)return;requestAnimationFrame(tick);
    if(this.element.clientWidth>0&&this.element.clientHeight>0)controls.update();
    renderer.render(scene,camera);};tick();
   this.resize();
   if(typeof ResizeObserver==="function"){this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this.element);}
   else window.addEventListener("resize",()=>this.resize());
  }
  resize(){
   if(!this.ready||this.disposed)return;
   const w=Math.max(1,this.element.clientWidth),h=Math.max(1,this.element.clientHeight);
   this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
  }
  parseWith(loader,text){
   return new Promise((resolve,reject)=>{
    try{loader.parse(text,"",resolve,err=>reject(err instanceof Error?err:new Error(String(err))));}
    catch(e){reject(e);}
   });
  }
  async loadModel(text){
   const meta=inspect(text),token=++this.activeToken;
   await this.init();
   if(this.disposed)return null;
   this.status("Carregando malhas das peças LDraw…");
   let group,lastError;
   for(const base of REMOTE){
    const loader=new this.LDrawLoader();
    loader.setPartsLibraryPath(base);
    try{
     group=await this.parseWith(loader,text);
     if(group)break;
    }catch(e){lastError=e;}
    if(this.disposed||token!==this.activeToken)return null;
   }
   if(!group)throw new Error("Não foi possível carregar a biblioteca de peças LDraw: "+String(lastError?.message||lastError));
   if(this.disposed||token!==this.activeToken)return null;
   let meshes=0;group.traverse(o=>{if(o.isMesh)meshes++;});
   if(!meshes)throw new Error("LDraw carregado sem geometria de peças reais.");
   if(this.loaded)this.scene.remove(this.loaded);
   group.rotation.x=Math.PI;group.scale.setScalar(.4);
   this.loaded=group;this.scene.add(group);
   this.steps=Math.max(1,Number(group.userData?.numBuildingSteps)||meta.stepSeparators+1);
   this.step=this.steps;
   this.setStep(this.steps);
   this.fit();
   this.status("Malhas LDraw carregadas • "+meshes+" objetos 3D");
   return {steps:this.steps,meshCount:meshes,meta};
  }
  setStep(n){
   if(!this.loaded)return;
   this.step=Math.max(0,Math.min(this.steps,Number(n)||0));
   const shown=this.step;
   this.loaded.traverse(object=>{
    if(object===this.loaded)return;
    if(object.userData&&Number.isFinite(object.userData.buildingStep))
     object.visible=object.userData.buildingStep<shown;
   });
  }
  fit(){
   if(!this.loaded)return;
   const THREE=this.THREE, bounds=new THREE.Box3().setFromObject(this.loaded);
   if(!Number.isFinite(bounds.min.x))return;
   const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
   const max=Math.max(size.x,size.y,size.z,15),distance=Math.max(40,max*2.25);
   this.controls.target.copy(center);
   this.camera.position.set(center.x+distance*.89,center.y+distance*.66,center.z+distance);
   this.controls.update();
  }
  turn(){
   if(!this.ready)return;const relative=this.camera.position.clone().sub(this.controls.target);
   relative.applyAxisAngle(new this.THREE.Vector3(0,1,0),Math.PI/4);
   this.camera.position.copy(this.controls.target).add(relative);this.controls.update();
  }
  zoom(factor){
   if(!this.ready)return;const offset=this.camera.position.clone().sub(this.controls.target);
   offset.multiplyScalar(1/factor);this.camera.position.copy(this.controls.target).add(offset);
   this.controls.update();
  }
  dispose(){
   this.disposed=true;this.activeToken++;
   if(this.resizeObserver)this.resizeObserver.disconnect();
   if(this.loaded)this.scene.remove(this.loaded);
   if(this.controls)this.controls.dispose();
   if(this.renderer)this.renderer.dispose();
   this.element.replaceChildren();
  }
 }

 class ReliableCADViewer {
  constructor(element,onState){
   this.element=element;this.status=onState||(()=>{});
   this.impl=null;this.steps=0;this.step=0;
  }
  async loadModel(source){
   if(!window.OTTOCanvasCAD?.Viewer)throw Error("Renderizador LDraw local não foi carregado.");
   const info=inspect(source);
   if(this.impl)this.impl.dispose();
   this.impl=new window.OTTOCanvasCAD.Viewer(this.element,this.status);
   const result=this.impl.load(source);
   this.steps=result.steps;this.step=this.steps;
   this.status("Modelo LDraw renderizado localmente com "+result.meshCount+" faces.");
   return {...result,meta:info};
  }
  setStep(n){if(!this.impl)return;this.impl.setStep(n);this.step=this.impl.step;}
  fit(){this.impl?.fit();}
  turn(){this.impl?.turn();}
  zoom(f){this.impl?.zoom(f);}
  dispose(){if(this.impl)this.impl.dispose();this.impl=null;}
 }
 return {inspect,put,get,projectSource,CADViewer:ReliableCADViewer,REMOTE};
});
