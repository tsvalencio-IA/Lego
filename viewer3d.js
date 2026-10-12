/* OTTO LEGO • 3D v5
 * Geometria retangular esquemática, baseada no tamanho externo real dos tijolos LEGO.
 * Canvas: órbita 3D local sem dependências; WebGL Three.js opcional, com fallback imediato.
 * Não certifica encaixe interno, atrito, resistência nem peças curvas/especiais.
 */
(function (root) {
 "use strict";
 const COLOR={
  "Black":"#292d37","Bright Blue":"#267ce9","Blue":"#267ce9","Green":"#23995a",
  "Bright Green":"#38b66e","Dark Purple":"#7851a6","Dark Red":"#983047",
  "Red":"#e24442","Brick Yellow":"#d3b47b","Dark Tan":"#a18b73",
  "Dark Pink":"#e463ad","Yellow":"#f3cb36","White":"#f6f6ef",
  "Light Bluish Gray":"#a7b0c0"
 };
 const STEP=8,HEIGHT=9.6,STUD_R=2.4,STUD_H=1.8;
 const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
 const tint=(hex,f)=>"#"+[1,3,5].map(i=>clamp(Math.round(parseInt(hex.slice(i,i+2),16)*f),0,255).toString(16).padStart(2,"0")).join("");
 class Viewer {
  constructor(container,status){
   this.container=container;this.status=status||(()=>{});
   this.pieces=[];this.visible=0;this.yaw=-.72;this.pitch=.52;this.zoom=1;this.center=[0,0,0];
   this.frame=0;this.pointer=new Map();this.drag=null;this.native=null;this.started=false;
   this.canvas=document.createElement("canvas");this.canvas.className="otto-3d-canvas";
   this.canvas.setAttribute("aria-label","Modelo 3D. Arraste para girar; gesto de pinça para aproximar ou afastar.");
   this.canvas.style.cssText="width:100%;height:100%;display:block;touch-action:none;";
   container.replaceChildren(this.canvas);this.ctx=this.canvas.getContext("2d");
   this.bind();this.resize();this.status("3D rotativo local • arraste para girar");
   if(typeof ResizeObserver==="function"){
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(container);
   }else window.addEventListener("resize",()=>this.resize());
  }
  bind(){
   const canvas=this.canvas;
   canvas.addEventListener("pointerdown",e=>{
    if(this.native)return;
    if(typeof canvas.setPointerCapture==="function")canvas.setPointerCapture(e.pointerId);
    this.pointer.set(e.pointerId,{x:e.clientX,y:e.clientY});
    this.drag={x:e.clientX,y:e.clientY};
   });
   canvas.addEventListener("pointermove",e=>{
    if(this.native||!this.pointer.has(e.pointerId))return;
    const old=this.pointer.get(e.pointerId);
    this.pointer.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(this.pointer.size===1){
     this.yaw+=(e.clientX-old.x)*.009;
     this.pitch=clamp(this.pitch+(e.clientY-old.y)*.009,-1.23,1.35);
    }else if(this.pointer.size===2){
     const entries=[...this.pointer.entries()];
     const a=entries[0],b=entries[1];
     const otherOld=(a[0]===e.pointerId)?b[1]:a[1],movingOld=old;
     const oldDist=Math.hypot(movingOld.x-otherOld.x,movingOld.y-otherOld.y);
     const newDist=Math.hypot(a[1].x-b[1].x,a[1].y-b[1].y);
     if(oldDist>8&&newDist>8)this.zoom=clamp(this.zoom*(newDist/oldDist),.3,5);
    }
    e.preventDefault();this.schedule();
   });
   const up=e=>{this.pointer.delete(e.pointerId);this.drag=null;};
   canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",up);
   canvas.addEventListener("wheel",e=>{
    if(this.native)return;
    e.preventDefault();this.zoom=clamp(this.zoom*Math.exp(-e.deltaY*.0014),.3,5);this.schedule();
   },{passive:false});
  }
  resize(){
   if(this.native){
    const {renderer,camera}=this.native,w=Math.max(1,this.container.clientWidth),h=Math.max(1,this.container.clientHeight);
    renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();return;
   }
   if(!this.ctx)return;
   const w=Math.max(1,this.container.clientWidth),h=Math.max(1,this.container.clientHeight),dpr=clamp(window.devicePixelRatio||1,1,2);
   this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);
   this.ctx.setTransform(dpr,0,0,dpr,0,0);this.schedule();
  }
  setModel(all,count){
   const list=Array.isArray(all)?all:[];
   const changed=this.pieces!==list && (this.pieces.length!==list.length||list.some((p,i)=>p.part!==this.pieces[i]?.part||p.x!==this.pieces[i]?.x||p.y!==this.pieces[i]?.y||p.z!==this.pieces[i]?.z||p.color!==this.pieces[i]?.color));
   this.pieces=list;this.visible=clamp(Number(count)||0,0,list.length);
   if(changed){this.resetView(false);}
   if(this.native)this.buildWebGL();
   else this.schedule();
  }
  resetView(draw=true){this.yaw=-.75;this.pitch=.58;this.zoom=1;if(this.native)this.frameWebGL();if(draw)this.schedule();}
  rotate(){this.yaw+=Math.PI/4;if(this.native){const c=this.native.controls, pos=c.object.position.clone().sub(c.target);pos.applyAxisAngle(this.native.THREE.Vector3.prototype.constructor?new this.native.THREE.Vector3(0,1,0):{x:0,y:1,z:0},Math.PI/4);c.object.position.copy(c.target).add(pos);c.update();}else this.schedule();}
  zoomBy(f){this.zoom=clamp(this.zoom*f,.3,5);if(this.native){this.native.controls.dollyIn?this.native.controls.dollyIn(f):this.native.camera.position.multiplyScalar(1/f);this.native.controls.update();}else this.schedule();}
  schedule(){if(!this.ctx||this.native)return;if(this.frame)return;this.frame=requestAnimationFrame(()=>{this.frame=0;this.draw();});}
  cameraPoint(point,center,camera){
   const x=point[0]-center[0],y=point[1]-center[1],z=point[2]-center[2],cy=Math.cos(this.yaw),sy=Math.sin(this.yaw);
   const rx=x*cy-z*sy,rz=x*sy+z*cy,cp=Math.cos(this.pitch),sp=Math.sin(this.pitch);
   const ry=y*cp-rz*sp,depth=rz*cp+y*sp;
   const f=camera.distance/(camera.distance+depth);
   return [camera.width/2+rx*camera.factor*f,camera.height*.55-ry*camera.factor*f,depth];
  }
  draw(){
   const ctx=this.ctx;if(!ctx)return;
   const width=this.container.clientWidth||480,height=this.container.clientHeight||330;
   ctx.clearRect(0,0,width,height);
   const grad=ctx.createLinearGradient(0,0,0,height);grad.addColorStop(0,"#e9f1fe");grad.addColorStop(1,"#f9fbff");
   ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);
   if(!this.pieces.length||this.visible===0){
    ctx.textAlign="center";ctx.fillStyle="#657a98";ctx.font="14px system-ui";
    ctx.fillText(this.pieces.length?"Avance uma etapa para começar a montagem":"Peça uma construção para ver o modelo",width/2,height/2);
    return;
   }
   const w=Math.max(...this.pieces.map(p=>(p.x+p.w)*STEP),1);
   const d=Math.max(...this.pieces.map(p=>(p.z+p.d)*STEP),1);
   const h=Math.max(...this.pieces.map(p=>(p.y+1)*HEIGHT+STUD_H),1);
   const center=[w/2,h/2,d/2],factor=Math.min(width/(w+d+20),height/(h+(w+d)*.7+12))*1.5*this.zoom;
   const camera={width,height,distance:Math.max(180,w+d+h+120),factor:clamp(factor,.12,6)};
   const solids=[];
   const face=(coords,color,normal,kind,priority=0)=>{
    const pp=coords.map(p=>this.cameraPoint(p,center,camera));
    const depth=pp.reduce((s,p)=>s+p[2],0)/pp.length;
    solids.push({pp,color,depth,kind,priority});
   };
   const q=(a,b,c,d,col)=>face([a,b,c,d],col,null,"face");
   for(const [i,p] of this.pieces.slice(0,this.visible).entries()){
    const x=p.x*STEP,z=p.z*STEP,y=p.y*HEIGHT,X=x+p.w*STEP,Z=z+p.d*STEP,Y=y+HEIGHT;
    const c=COLOR[p.color]||"#95a9be",highlight=i===this.visible-1;
    const top=tint(c,highlight?1.26:1.13),side=tint(c,highlight?.91:.86),dark=tint(c,highlight?.83:.72);
    q([x,Y,z],[X,Y,z],[X,Y,Z],[x,Y,Z],top);
    q([x,y,z],[x,Y,z],[X,Y,z],[X,y,z],dark);
    q([X,y,z],[X,Y,z],[X,Y,Z],[X,y,Z],side);
    q([X,y,Z],[X,Y,Z],[x,Y,Z],[x,y,Z],dark);
    q([x,y,Z],[x,Y,Z],[x,Y,z],[x,y,z],side);
    const segments=12;
    for(let sx=0;sx<p.w;sx++)for(let sz=0;sz<p.d;sz++){
     const cx=x+(sx+.5)*STEP,cz=z+(sz+.5)*STEP;
     const ring=(yy)=>Array.from({length:segments},(_,k)=>[cx+STUD_R*Math.cos(k*Math.PI*2/segments),yy,cz+STUD_R*Math.sin(k*Math.PI*2/segments)]);
     const base=ring(Y),cap=ring(Y+STUD_H);
     for(let k=0;k<segments;k++)face([base[k],base[(k+1)%segments],cap[(k+1)%segments],cap[k]],side,null,"stud");
     face(cap,top,null,"studtop");
    }
   }
   solids.sort((a,b)=>b.depth-a.depth||a.priority-b.priority);
   ctx.lineJoin="round";
   for(const s of solids){
    ctx.beginPath();const first=s.pp[0];ctx.moveTo(first[0],first[1]);for(let i=1;i<s.pp.length;i++)ctx.lineTo(s.pp[i][0],s.pp[i][1]);ctx.closePath();
    ctx.fillStyle=s.color;ctx.fill();
    if(s.kind!=="stud"){ctx.strokeStyle="#34476566";ctx.lineWidth=.8;ctx.stroke();}
   }
   ctx.textAlign="left";ctx.font="12px system-ui";ctx.fillStyle="#667891";
   ctx.fillText("3D interativo • arraste e use pinça / rolagem",12,height-12);
  }
  async enhance(){
   if(this.native||this.attempted)return;this.attempted=true;
   let renderer;
   try{
    const THREE=await import("three");
    const {OrbitControls}=await import("three/addons/controls/OrbitControls.js");
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"low-power"});
    renderer.setPixelRatio(clamp(window.devicePixelRatio||1,1,2));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(48,1,.1,3000);
    scene.background=new THREE.Color("#e9f1fe");
    scene.add(new THREE.HemisphereLight(0xffffff,0x7b8eaa,2.4));
    const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(70,120,90);scene.add(sun);
    const platform=new THREE.GridHelper(200,20,0xc4d3e9,0xe0e9f8);platform.position.y=-1.3;scene.add(platform);
    const group=new THREE.Group();scene.add(group);
    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;controls.dampingFactor=.09;controls.enableZoom=true;controls.enablePan=false;
    controls.maxPolarAngle=Math.PI*.89;controls.minDistance=25;controls.maxDistance=600;
    this.native={THREE,renderer,scene,camera,controls,group};this.canvas.style.display="none";
    this.container.appendChild(renderer.domElement);
    renderer.domElement.style.cssText="width:100%;height:100%;display:block;touch-action:none;";
    this.buildWebGL();this.frameWebGL();this.resize();this.status("3D WebGL • gire livremente e use pinça para zoom");
    const loop=()=>{if(!this.native)return;requestAnimationFrame(loop);controls.update();renderer.render(scene,camera);};loop();
   }catch(error){
    if(renderer)renderer.dispose();
    this.native=null;this.canvas.style.display="block";
    this.status("3D rotativo local • bibliotecas WebGL indisponíveis");
    this.schedule();
   }
  }
  frameWebGL(){
   if(!this.native)return;
   const {THREE,controls,camera}=this.native;
   const w=Math.max(...this.pieces.map(p=>(p.x+p.w)*STEP),0),d=Math.max(...this.pieces.map(p=>(p.z+p.d)*STEP),0),h=Math.max(...this.pieces.map(p=>(p.y+1)*HEIGHT),0);
   const max=Math.max(w,d,h,22),target=new THREE.Vector3(w/2,h/2,d/2),dist=Math.max(60,max*2.4);
   controls.target.copy(target);camera.position.copy(target).add(new THREE.Vector3(dist,dist*.8,dist));controls.update();
  }
  buildWebGL(){
   if(!this.native)return;
   const {THREE,group}=this.native;
   group.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose();}});
   while(group.children.length)group.remove(group.children[0]);
   const studGeo=new THREE.CylinderGeometry(STUD_R,STUD_R,STUD_H,18);
   this.pieces.slice(0,this.visible).forEach((p,i)=>{
    const color=COLOR[p.color]||"#95a9be";
    const mat=new THREE.MeshStandardMaterial({color,roughness:.43,metalness:0,emissive:i===this.visible-1?"#181310":"#000000",emissiveIntensity:.18});
    const w=p.w*STEP-.22,d=p.d*STEP-.22,h=HEIGHT-.1;
    const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    body.position.set((p.x+p.w/2)*STEP,p.y*HEIGHT+h/2,(p.z+p.d/2)*STEP);group.add(body);
    for(let x=0;x<p.w;x++)for(let z=0;z<p.d;z++){
     const stud=new THREE.Mesh(studGeo.clone(),mat.clone());
     stud.position.set((p.x+x+.5)*STEP,(p.y+1)*HEIGHT+STUD_H/2,(p.z+z+.5)*STEP);group.add(stud);
    }
   });
   studGeo.dispose();
   this.native.renderer.render(this.native.scene,this.native.camera);
  }
 }
 root.OTTO3D={create:(container,options)=>new Viewer(container,options?.onStatus)};
})(typeof globalThis!=="undefined"?globalThis:this);
