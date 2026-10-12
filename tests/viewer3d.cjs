const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("index.html"),src=read("viewer3d.js"),app=read("catalogo-app.js");
for(const id of ["legacyTurn","legacyZoomIn","legacyZoomOut","legacyReset","legacyView"]){
 assert(html.includes('id="'+id+'"'),"Controle 3D ausente: "+id);
}
assert(html.includes("three@0.161.0"),"Import map precisa apontar para a mesma versão do WebGL.");
assert(html.indexOf("viewer3d.js?v=6.0.0")<html.indexOf("catalogo-app.js?v=6.0.0"),
 "Carregar renderizador antes da aplicação.");
assert(app.includes("oldViewer.setModel"),"Montagem não atualiza renderizador.");
assert(app.includes("oldViewer?.zoomBy"),"Zoom não foi conectado.");
let drawCalls=0,raf=[];
const ctx=new Proxy({
 clearRect(){},createLinearGradient(){return {addColorStop(){}};},fillRect(){},setTransform(){},
 fillText(){},beginPath(){drawCalls++;},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){}
},{get(obj,key){return key in obj?obj[key]:undefined;},set(obj,key,value){obj[key]=value;return true;}});
const handlers={};
function canvas(){
 return {style:{},width:0,height:0,className:"",setAttribute(){},getContext(type){return type==="2d"?ctx:null;},
 addEventListener(name,fn){handlers[name]=fn;},setPointerCapture(){}};
}
const container={clientWidth:460,clientHeight:340,innerHTML:"",children:[],
 replaceChildren(x){this.children=[x];},appendChild(x){this.children.push(x);}};
const win={devicePixelRatio:1,addEventListener(){}};
const c={window:win,document:{createElement(tag){assert.equal(tag,"canvas");return canvas();}},
 requestAnimationFrame(fn){raf.push(fn);return raf.length;},ResizeObserver:undefined,console};
c.globalThis=win;
vm.runInNewContext(src,c,{filename:"viewer3d.js"});
assert.equal(typeof win.OTTO3D?.create,"function");
const viewer=win.OTTO3D.create(container,{onStatus(){}});
assert(container.children[0]?.getContext,"Canvas de reserva não foi montado.");
const pieces=[
 {part:"3001",color:"Green",x:0,y:0,z:0,w:2,d:4},
 {part:"3001",color:"Bright Blue",x:0,y:1,z:0,w:2,d:4}
];
viewer.started=true; // limita o teste à renderização local sem depender da rede
viewer.setModel(pieces,2);
while(raf.length){const fn=raf.shift();fn();}
assert(drawCalls>10,"O motor precisa renderizar corpos e pinos em 3D.");
const a=viewer.yaw;viewer.rotate();assert(viewer.yaw>a,"Botão Girar precisa rotacionar o modelo.");
const z=viewer.zoom;viewer.zoomBy(1.2);assert(viewer.zoom>z,"Aproximar deve aplicar zoom.");
handlers.pointerdown({pointerId:1,clientX:20,clientY:30});
handlers.pointermove({pointerId:1,clientX:55,clientY:41,preventDefault(){}});
assert(viewer.yaw>a+Math.PI/4,"Arrastar não girou a cena.");
handlers.pointerup({pointerId:1});
viewer.setModel(pieces,1);assert.equal(viewer.visible,1,"Passos precisam atualizar a quantidade de peças.");
viewer.resetView();assert.equal(viewer.zoom,1,"Centralizar deve resetar o zoom.");
console.log("OTTO LEGO v6 legacy 3D PASS: malha desenhada, movimento livre, gestos, zoom e passo a passo.");
