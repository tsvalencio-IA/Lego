/* OTTO — Renderizador 3D de triângulos LDraw, sem bibliotecas externas.
 * Lê coordenadas reais de peças em arquivos .ldr/.mpd.
 * Não garante que reconstrução coincide com manual ou encaixe físico.
 */
(function(root){
"use strict";
const COLORS={
 0:"#202020",1:"#0055bf",2:"#237841",3:"#008f9b",4:"#c91a09",5:"#c870a0",
 6:"#583927",7:"#9ba19d",8:"#6d6e5c",9:"#4b9fdd",10:"#4b9fdd",
 11:"#53a2a3",12:"#ff8014",13:"#ffb729",14:"#f2cd37",15:"#ffffff",
 19:"#e4cd9e",25:"#fe8a18",27:"#a5ca18",28:"#958a73",36:"#55aa44",
 71:"#a0a5a9",72:"#6c6e68",320:"#720e0f"
};
const norm=s=>String(s||"").trim().replaceAll("\\","/").toLowerCase();
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const rgb=color=>{const x=(COLORS[color]||COLORS[7]).slice(1);return [parseInt(x.slice(0,2),16),parseInt(x.slice(2,4),16),parseInt(x.slice(4,6),16)];};
function parse(text){
 const files=new Map(),seq=[],lines=String(text).replace(/\r/g,"").split("\n");
 let file=null,depth=0;
 for(let ln=0;ln<lines.length;ln++){
  const line=lines[ln].trim();if(!line)continue;
  const found=line.match(/^0\s+FILE\s+(.+)$/i);
  if(found){file=norm(found[1]);if(!files.has(file))files.set(file,[]);continue;}
  if(!file){file="root.ldr";files.set(file,[]);}
  if(/^0\s+NOFILE\b/i.test(line)){file=null;continue;}
  if(/^0\s+STEP(?:\s|$)/i.test(line)){files.get(file).push({type:0,step:true});continue;}
  const words=line.split(/\s+/),kind=Number(words[0]);
  if(kind===1&&words.length>=15){
   const tr=words.slice(2,14).map(Number);
   if(!tr.every(Number.isFinite))throw Error("Posições LDraw inválidas na linha "+(ln+1));
   const ref=norm(words.slice(14).join(" "));
   if(!/^[a-z0-9_. /\\-]+\.(dat|ldr|mpd)$/i.test(ref))throw Error("Subarquivo LDraw inválido: "+ref);
   files.get(file).push({type:1,color:Number(words[1]),pos:tr.slice(0,3),
    mat:tr.slice(3),ref});
  }else if((kind===3&&words.length>=11)||(kind===4&&words.length>=14)){
   const count=kind===3?3:4,v=words.slice(2,2+3*count).map(Number);
   if(!v.every(Number.isFinite))throw Error("Vértice LDraw inválido na linha "+(ln+1));
   const points=Array.from({length:count},(_,i)=>v.slice(i*3,i*3+3));
   files.get(file).push({type:kind,color:Number(words[1]),points});
  }
 }
 const rootName=files.keys().next().value;
 if(!rootName)throw Error("Arquivo 3D vazio.");
 const main=files.get(rootName),stepCount=1+main.filter(x=>x.step).length;
 const triangles=[],bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
 const ID=[1,0,0,0,1,0,0,0,1];
 const mulVec=(m,v)=>[m[0]*v[0]+m[1]*v[1]+m[2]*v[2],m[3]*v[0]+m[4]*v[1]+m[5]*v[2],m[6]*v[0]+m[7]*v[1]+m[8]*v[2]];
 const transform=(p,mat,origin)=>{const w=mulVec(mat,p);return [w[0]+origin[0],w[1]+origin[1],w[2]+origin[2]];};
 const multiply=(a,b)=>{const o=new Array(9);for(let r=0;r<3;r++)for(let c=0;c<3;c++)o[r*3+c]=a[r*3]*b[c]+a[r*3+1]*b[3+c]+a[r*3+2]*b[6+c];return o;};
 const emit=(vertices,color,step)=>{
  const poly=vertices.map(v=>[v[0],-v[1],v[2]]);
  for(const v of poly)for(let k=0;k<3;k++){bounds.min[k]=Math.min(bounds.min[k],v[k]);bounds.max[k]=Math.max(bounds.max[k],v[k]);}
  triangles.push({vertices:poly,color:COLORS[color]||COLORS[7],step});
  if(triangles.length>140000)throw Error("Modelo excede o limite de polígonos seguro.");
 };
 function expand(filename,mat,origin,color,step,ancestors){
  if(ancestors.includes(filename)||ancestors.length>30)throw Error("Recursão no subarquivo "+filename);
  const arr=files.get(filename);
  if(!arr)throw Error("Peça geométrica LDraw ausente: "+filename);
  const ancestry=[...ancestors,filename];
  for(const x of arr){
   if(x.type===1){
    const c=x.color===16?color:x.color;
    expand(x.ref,multiply(mat,x.mat),transform(x.pos,mat,origin),c,step,ancestry);
   }else if(x.type===3||x.type===4){
    const c=x.color===16?color:x.color;
    const polygon=x.points.map(v=>transform(v,mat,origin));
    emit(polygon.slice(0,3),c,step);
    if(x.type===4)emit([polygon[0],polygon[2],polygon[3]],c,step);
   }
  }
 }
 let step=0;
 for(const x of main){
  if(x.step){step++;continue;}
  if(x.type!==1)continue;
  expand(x.ref,x.mat,x.pos,x.color,step,[rootName]);
 }
 if(triangles.length===0)throw Error("O arquivo não contém malhas LDraw renderizáveis.");
 return {triangles,steps:stepCount,bounds,partCount:main.filter(x=>x.type===1).length,filenames:files.size};
}
class Viewer {
 constructor(container,onStatus){
  this.container=container;this.onStatus=onStatus||(()=>{});
  this.step=0;this.steps=0;this.geometry=null;this.yaw=-.75;this.pitch=.54;this.zoomValue=1;this.frame=0;this.pointer=new Map();
  this.canvas=document.createElement("canvas");this.canvas.setAttribute("aria-label","Modelo CAD LEGO em três dimensões");
  this.canvas.style.cssText="width:100%;height:100%;display:block;touch-action:none";
  this.ctx=this.canvas.getContext("2d");if(!this.ctx)throw Error("Canvas 3D não disponível.");
  container.replaceChildren(this.canvas);
  this.bind();this.resize();
  if(typeof ResizeObserver==="function"){this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(container);}
  else window.addEventListener("resize",()=>this.resize());
 }
 bind(){
  const c=this.canvas;
  c.addEventListener("pointerdown",e=>{c.setPointerCapture?.(e.pointerId);this.pointer.set(e.pointerId,{x:e.clientX,y:e.clientY});});
  c.addEventListener("pointermove",e=>{
   if(!this.pointer.has(e.pointerId))return;const old=this.pointer.get(e.pointerId);
   this.pointer.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(this.pointer.size===1){this.yaw+=(e.clientX-old.x)*.012;this.pitch=clamp(this.pitch+(e.clientY-old.y)*.012,-1.34,1.34);}
   else if(this.pointer.size===2){
    const a=[...this.pointer.values()],before=Math.hypot(old.x-a[0].x,old.y-a[0].y),after=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
    if(before>3&&after>3)this.zoomValue=clamp(this.zoomValue*after/before,.22,8);
   }
   e.preventDefault();this.request();
  });
  const off=e=>this.pointer.delete(e.pointerId);
  c.addEventListener("pointerup",off);c.addEventListener("pointercancel",off);
  c.addEventListener("wheel",e=>{e.preventDefault();this.zoomValue=clamp(this.zoomValue*Math.exp(-e.deltaY*.0013),.22,8);this.request();},{passive:false});
 }
 resize(){
  if(!this.ctx)return;
  const w=Math.max(1,this.container.clientWidth||460),h=Math.max(1,this.container.clientHeight||340),pixel=Math.min(window.devicePixelRatio||1,2);
  this.canvas.width=Math.round(w*pixel);this.canvas.height=Math.round(h*pixel);
  this.ctx.setTransform(pixel,0,0,pixel,0,0);this.request();
 }
 load(text){
  const data=parse(text);this.geometry=data;this.steps=data.steps;this.step=this.steps;this.fit();
  return {steps:data.steps,meshCount:data.triangles.length,meta:{partsReferenced:data.partCount,files:data.filenames}};
 }
 setStep(n){this.step=clamp(Number(n)||0,0,this.steps);this.request();}
 turn(){this.yaw+=Math.PI/4;this.request();}
 zoom(f){this.zoomValue=clamp(this.zoomValue*f,.22,8);this.request();}
 fit(){this.zoomValue=1;this.yaw=-.75;this.pitch=.54;this.request();}
 request(){if(this.frame||!this.ctx)return;this.frame=requestAnimationFrame(()=>{this.frame=0;this.draw();});}
 draw(){
  const ctx=this.ctx,w=this.container.clientWidth||460,h=this.container.clientHeight||340;
  ctx.clearRect(0,0,w,h);
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,"#e5effc");g.addColorStop(1,"#f8fbff");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  const geo=this.geometry;if(!geo)return;
  const min=geo.bounds.min,max=geo.bounds.max,center=[(min[0]+max[0])/2,(min[1]+max[1])/2,(min[2]+max[2])/2];
  const size=[max[0]-min[0],max[1]-min[1],max[2]-min[2]],extent=Math.max(25,...size);
  const factor=clamp(Math.min(w,h)/(extent*1.6)*this.zoomValue,.02,50);
  const cy=Math.cos(this.yaw),sy=Math.sin(this.yaw),cp=Math.cos(this.pitch),sp=Math.sin(this.pitch);
  const project=v=>{
   const x=v[0]-center[0],y=v[1]-center[1],z=v[2]-center[2];
   const rx=x*cy-z*sy,rz=x*sy+z*cy,ry=y*cp-rz*sp,d=rz*cp+y*sp;
   return [w/2+rx*factor,h/2-ry*factor,d];
  };
  const visible=geo.triangles.filter(t=>t.step<this.step);
  const transformed=visible.map(t=>{
   const a=project(t.vertices[0]),b=project(t.vertices[1]),c=project(t.vertices[2]);
   const bright=clamp(.76+.15*Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/(extent*factor+5),.72,1.1);
   return {points:[a,b,c],depth:(a[2]+b[2]+c[2])/3,color:t.color,bright};
  });
  transformed.sort((a,b)=>b.depth-a.depth);
  for(const t of transformed){
   ctx.beginPath();ctx.moveTo(t.points[0][0],t.points[0][1]);ctx.lineTo(t.points[1][0],t.points[1][1]);ctx.lineTo(t.points[2][0],t.points[2][1]);ctx.closePath();
   const c=rgb(Object.keys(COLORS).find(k=>COLORS[k]===t.color)||7);
   ctx.fillStyle="rgb("+c.map(v=>clamp(Math.round(v*t.bright),0,255)).join(",")+")";ctx.fill();
  }
  ctx.fillStyle="#526782";ctx.font="12px system-ui";ctx.fillText("LDraw 3D local · toque e arraste para girar",12,h-12);
 }
 dispose(){if(this.observer)this.observer.disconnect();this.ctx=null;this.geometry=null;this.canvas?.remove();}
}
root.OTTOCanvasCAD={parse,Viewer};
})(typeof globalThis!=="undefined"?globalThis:this);
