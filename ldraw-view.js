/* LDraw high-detail optional renderer. Requires network and official LDraw library.
   This module never treats loading a shape as proof of mechanical assembly. */
import {LDrawLoader} from "three/addons/loaders/LDrawLoader.js";
import * as THREE from "three";
const LIBRARY="https://cdn.jsdelivr.net/gh/kulits/ldraw-parts@master/ldraw/";
let invocation=0;
function partialLDraw(full,steps){
 if(steps<=0)return "";
 const lines=full.split(/\r?\n/),head=[],sections=[],current=[];
 for(const line of lines){
  if(line==="0 STEP"){sections.push(current.splice(0));continue;}
  current.push(line);
 }
 if(current.length)sections.push(current);
 // The source includes header lines only before the first part. Keeping that section
 // intact also preserves header metadata on every truncated sub-model.
 return sections.slice(0,steps).flat().join("\r\n")+"\r\n";
}
function makePartSource(project,step,generator){
 const text=generator.exportLDraw(project);
 const source=partialLDraw(text,step);
 if(!source.includes("\r\n1 "))throw Error("Este passo não possui peças LDraw.");
 return source;
}
function parsedLDraw(loader,source){
 return new Promise((resolve,reject)=>{
  try{loader.parse(source,"",group=>resolve(group),error=>reject(error instanceof Error?error:new Error(String(error))));}
  catch(e){reject(e);}
 });
}
export async function loadDetail(project,step,generator){
 if(!project||!generator)throw Error("Selecione um projeto para carregar o LDraw.");
 if(step===0)return new THREE.Group();
 const source=makePartSource(project,step,generator);
 const loader=new LDrawLoader();
 loader.setPartsLibraryPath(LIBRARY);
 const group=await parsedLDraw(loader,source);
 if(!group||typeof group.traverse!=="function")throw Error("Biblioteca não devolveu um modelo 3D.");
 let meshes=0;
 group.traverse(o=>{if(o.isMesh)meshes++;});
 if(meshes===0)throw Error("Modelo LDraw retornou sem malhas.");
 const wrapper=new THREE.Group();
 group.rotation.x=Math.PI;
 group.scale.setScalar(0.4); // LDraw unit = 0.4 mm
 wrapper.add(group);
 wrapper.updateMatrixWorld(true);
 return wrapper;
}
export function installDetail(scene3d,object){
 if(!scene3d||!object)throw Error("Cena tridimensional indisponível.");
 const old=scene3d.group;
 old.clear();old.position.set(0,0,0);old.rotation.set(0,0,0);old.scale.set(1,1,1);
 old.add(object);
 const bounds=new THREE.Box3().setFromObject(old);
 if(!Number.isFinite(bounds.min.x))throw Error("Geometria LDraw possui limites inválidos.");
 const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
 object.position.x-=center.x;
 object.position.y-=bounds.min.y;
 object.position.z-=center.z;
 const dist=Math.max(70,Math.max(size.x,size.y,size.z)*2.15);
 scene3d.controls.target.set(0,Math.max(6,size.y*.45),0);
 scene3d.camera.position.set(dist*.87,dist*.77,dist*.96);
 scene3d.controls.update();
 return {meshes:object.children.length,size:{x:size.x,y:size.y,z:size.z},source:"LDraw CC BY 2.0"};
}
export const provenance={source:"LDraw official community parts library mirrored on jsDelivr",license:"CC BY 2.0",url:"https://www.ldraw.org/legal-info",library:LIBRARY};
