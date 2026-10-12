/* OTTO 3D — Procedural brick planner v2
 * Only certified simple rectangular brick IDs are admitted.
 * This is a geometric stud-grid solver, not a structural-engineering certificate.
 */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.OTTOGenerator=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const DIMS={
  "3005":[1,1],"3004":[1,2],"3003":[2,2],"3002":[2,3],"3001":[2,4],"2456":[2,6]
 };
 const COLORS=[
  ["azul","Bright Blue"],["verde","Green"],["preto","Black"],["preta","Black"],
  ["vermelho","Dark Red"],["vermelha","Dark Red"],["roxo","Dark Purple"],["roxa","Dark Purple"],
  ["bege","Brick Yellow"],["amarelo","Yellow"],["amarela","Yellow"],["branco","White"],
  ["branca","White"],["rosa","Dark Pink"],["cinza","Light Bluish Gray"]
 ];
 const kinds={torre:"torre",predio:"torre",edificio:"torre",casa:"casinha",casinha:"casinha",
  muro:"muro",parede:"muro",escada:"escada",escadaria:"escada",plataforma:"plataforma",
  base:"plataforma",piso:"plataforma"};
 const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const key=p=>String(p.part)+"|"+String(p.color).toLowerCase();
 const cellsKey=(x,z)=>x+","+z;
 const dimensions=p=>DIMS[String(p.part)]||null;
 function parseRequest(text){
  const q=normalize(text).replace(/\s+/g," ").trim();
  if(!q)return {ok:false,error:"Descreva primeiro o que Otto quer construir."};
  const matches=Object.entries(kinds).filter(([word])=>new RegExp("\\b"+word+"s?\\b").test(q));
  if(!matches.length)return {ok:false,error:"Ainda não consigo gerar este formato. Experimente torre, casa, muro, escada ou plataforma. Nenhum modelo será inventado."};
  const kind=matches[0][1];
  const defaults={torre:[2,4,3],casinha:[4,4,2],muro:[8,2,2],escada:[6,2,3],plataforma:[4,4,2]};
  let [width,depth,height]=defaults[kind];
  const rect=q.match(/\b(\d{1,2})\s*(?:x|por)\s*(\d{1,2})(?:\s*(?:x|por)\s*(\d{1,2}))?\b/);
  if(rect){width=Number(rect[1]);depth=Number(rect[2]);if(rect[3])height=Number(rect[3]);}
  const size=(word)=>q.match(new RegExp("\\b"+word+"\\s*(?:de|com|:)?\\s*(\\d{1,2})\\b"));
  const w=size("largura"),d=size("comprimento"),h=size("altura|camadas?|andares?|niveis?");
  if(w)width=Number(w[1]);if(d)depth=Number(d[1]);if(h)height=Number(h[1]);
  const h2=q.match(/\b(\d{1,2})\s*(?:andares?|camadas?|niveis?)\b/);if(h2)height=Number(h2[1]);
  if(kind==="muro"&&width<depth)[width,depth]=[depth,width];
  if(!Number.isInteger(width)||!Number.isInteger(depth)||!Number.isInteger(height)||
     width<2||depth<2||height<1||width>12||depth>12||height>6||width*depth*height>240)
   return {ok:false,error:"Dimensões fora do intervalo seguro: largura e comprimento de 2 a 12 pinos, altura de 1 a 6 camadas, até 240 células."};
  if(kind==="casinha"&&(width<4||depth<4||height<2))
   return {ok:false,error:"Para uma casinha com porta e teto, use no mínimo 4×4 pinos e 2 camadas."};
  if(kind==="escada"&&width<height*2)
   return {ok:false,error:"A escada precisa de pelo menos 2 pinos de comprimento por degrau/camada."};
  if(kind==="muro"&&depth>4)return {ok:false,error:"Para o muro, use espessura de 2 a 4 pinos."};
  let color=null;
  for(const [word,canonical] of COLORS){
   if(new RegExp("\\b"+word+"\\b").test(q)){color=canonical;break;}
  }
  return {ok:true,kind,width,depth,height,color,idea:String(text).trim()};
 }
 function createTarget(spec){
  const levels=[];
  for(let y=0;y<spec.height;y++){
   const cells=new Set();
   for(let z=0;z<spec.depth;z++)for(let x=0;x<spec.width;x++){
    let use=true;
    if(spec.kind==="casinha"&&y<spec.height-1){
     const boundary=x===0||x===spec.width-1||z===0||z===spec.depth-1;
     const door=(z===0&&(x===Math.floor((spec.width-1)/2)||x===Math.floor(spec.width/2)));
     use=boundary&&!door;
    }
    if(spec.kind==="escada")use=x>=y*2;
    if(use)cells.add(cellsKey(x,z));
   }
   levels.push(cells);
  }
  return levels;
 }
 function overlaps(a,b){
  return a.x<b.x+b.w&&b.x<a.x+a.w&&a.z<b.z+b.d&&b.z<a.z+a.d;
 }
 function validate(project){
  const errors=[],ps=project?.pieces||[];
  const levels=new Map();
  for(let i=0;i<ps.length;i++){
   const p=ps[i],dims=dimensions(p);
   if(!dims||!Number.isInteger(p.x)||!Number.isInteger(p.y)||!Number.isInteger(p.z)||p.y<0||
      !Number.isInteger(p.w)||!Number.isInteger(p.d)||
      !((p.w===dims[0]&&p.d===dims[1])||(p.w===dims[1]&&p.d===dims[0])))
    errors.push("Peça ou dimensão incompatível na etapa "+(i+1));
   if(!levels.has(p.y))levels.set(p.y,[]);
   levels.get(p.y).push({...p,index:i});
  }
  if(errors.length)return {ok:false,errors};
  for(const [y,arr] of levels){
   for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++)
    if(overlaps(arr[i],arr[j]))errors.push("Colisão na camada "+(y+1));
  }
  const edges=ps.map(()=>[]);
  for(let i=0;i<ps.length;i++){
   const p=ps[i];if(p.y===0)continue;
   const below=levels.get(p.y-1)||[];
   const supports=[];
   for(const b of below){
    if(!overlaps(p,b))continue;
    const x1=Math.max(p.x,b.x),x2=Math.min(p.x+p.w,b.x+b.w);
    const z1=Math.max(p.z,b.z),z2=Math.min(p.z+p.d,b.z+b.d);
    for(let x=x1;x<x2;x++)for(let z=z1;z<z2;z++)supports.push([x,z]);
    edges[i].push(b.index);edges[b.index].push(i);
   }
   if(supports.length<Math.min(2,p.w*p.d))errors.push("Peça sem apoio suficiente na etapa "+(i+1));
   else{
    const xs=supports.map(v=>v[0]+.5),zs=supports.map(v=>v[1]+.5);
    const cx=p.x+p.w/2,cz=p.z+p.d/2;
    if(cx<Math.min(...xs)-.51||cx>Math.max(...xs)+.51||
       cz<Math.min(...zs)-.51||cz>Math.max(...zs)+.51)
      errors.push("Centro da peça fora da região de apoio na etapa "+(i+1));
   }
  }
  if(ps.length){
   const seen=new Set([0]),queue=[0];
   while(queue.length){const i=queue.shift();for(const j of edges[i])if(!seen.has(j)){seen.add(j);queue.push(j);}}
   if(seen.size!==ps.length)errors.push("Construção não conectada pelos encaixes entre camadas");
  }
  return {ok:errors.length===0,errors,connected:ps.length>0&&errors.length===0,studGridChecked:true,
   structuralCertified:false};
 }
 function generate(text,catalog,committed={},options={}){
  const spec=typeof text==="string"?parseRequest(text):text;
  if(!spec?.ok)return {ok:false,error:spec?.error||"Pedido inválido."};
  const all=Array.isArray(catalog)?catalog:[];
  const used=committed instanceof Map?committed:new Map(Object.entries(committed||{}));
  const stock=[];
  for(const p of all){
   const dim=dimensions(p);if(!dim||!p.color||!Number.isInteger(Number(p.quantity)))continue;
   if(spec.color&&p.color!==spec.color)continue;
   const remaining=Number(p.quantity)-Number(used.get(key(p))||0);
   if(remaining>0)stock.push({part:String(p.part),color:String(p.color),name:String(p.name||p.part),
    w:dim[0],d:dim[1],area:dim[0]*dim[1],left:remaining});
  }
  if(!stock.length)return {ok:false,error:spec.color?
   "Não há tijolos retangulares disponíveis na cor solicitada ("+spec.color+").":"Não há tijolos retangulares disponíveis no estoque catalogado."};
  const target=createTarget(spec),required=target.reduce((s,layer)=>s+layer.size,0);
  if(spec.height===1&&target[0].size>0&&!stock.some(p=>p.area===target[0].size&&
    ((p.w===spec.width&&p.d===spec.depth)||(p.w===spec.depth&&p.d===spec.width))))
   return {ok:false,error:"Uma construção de uma só camada precisa de uma peça única que cubra toda a base para permanecer conectada. Peça 2 camadas ou dimensões menores."};
  const capacity=stock.reduce((s,p)=>s+p.area*p.left,0);
  if(capacity<required)return {ok:false,error:"Estoque insuficiente: a construção ocupa "+required+" posições de pino, mas as peças livres cobrem no máximo "+capacity+"."};
  const occupied=target.map(()=>new Set()),pieces=[],maxNodes=Number(options.maxNodes)||35000;
  let nodes=0,hitLimit=false;
  const totalTarget=target.reduce((n,a)=>n+a.size,0);
  const candidates=(y,x,z)=>{
   const result=[];
   for(const item of stock)if(item.left>0){
    const shapes=item.w===item.d?[[item.w,item.d]]:[[item.w,item.d],[item.d,item.w]];
    for(const [w,d] of shapes)for(let dx=0;dx<w;dx++)for(let dz=0;dz<d;dz++){
     const ox=x-dx,oz=z-dz;
     if(ox<0||oz<0||ox+w>spec.width||oz+d>spec.depth)continue;
     let valid=true,contact=0,sx=0,sz=0,loX=Infinity,hiX=-Infinity,loZ=Infinity,hiZ=-Infinity;
     for(let xx=ox;xx<ox+w&&valid;xx++)for(let zz=oz;zz<oz+d;zz++){
      const cell=cellsKey(xx,zz);
      if(!target[y].has(cell)||occupied[y].has(cell)){valid=false;break;}
      if(y>0&&target[y-1].has(cell)){
       contact++;const cx=xx+.5,cz=zz+.5;sx+=cx;sz+=cz;
       loX=Math.min(loX,cx);hiX=Math.max(hiX,cx);loZ=Math.min(loZ,cz);hiZ=Math.max(hiZ,cz);
      }
     }
     if(!valid)continue;
     if(y>0&&(contact<Math.min(2,w*d)||ox+w/2<loX-.51||ox+w/2>hiX+.51||
       oz+d/2<loZ-.51||oz+d/2>hiZ+.51))continue;
     const center=ox+w/2,score=item.area*100+contact*3+(item.left>1?1:0);
     result.push({item,x:ox,y,z:oz,w,d,score});
    }
   }
   result.sort((a,b)=>b.score-a.score||a.item.part.localeCompare(b.item.part)||a.x-b.x||a.z-b.z);
   return result;
  };
  function findNext(){
   for(let y=0;y<target.length;y++){
    for(const cell of target[y])if(!occupied[y].has(cell)){
     const [x,z]=cell.split(",").map(Number);return {y,x,z};
    }
   }
   return null;
  }
  function recurse(filled){
   if(++nodes>maxNodes){hitLimit=true;return false;}
   if(filled===totalTarget){
    const audit=validate({pieces});
    return audit.ok;
   }
   const next=findNext();if(!next)return false;
   for(const candidate of candidates(next.y,next.x,next.z)){
    const {item,x,y,z,w,d}=candidate;
    item.left--;
    const placed={part:item.part,color:item.color,name:item.name,x,y,z,w,d,h:1};
    pieces.push(placed);
    for(let xx=x;xx<x+w;xx++)for(let zz=z;zz<z+d;zz++)occupied[y].add(cellsKey(xx,zz));
    if(recurse(filled+w*d))return true;
    for(let xx=x;xx<x+w;xx++)for(let zz=z;zz<z+d;zz++)occupied[y].delete(cellsKey(xx,zz));
    pieces.pop();item.left++;
    if(hitLimit)break;
   }
   return false;
  }
  if(!recurse(0))return {ok:false,error:hitLimit?
   "A busca atingiu o limite de combinações. Peça uma construção menor ou com menos camadas.":
   "Não encontrei uma montagem conectada, sem colisões e com apoio mínimo usando exatamente as peças disponíveis. Tente dimensões menores ou outras cores.",
   details:{requiredStuds:required,nodes}};
  const project={kind:spec.kind,name:options.name||({
   torre:"Torre",casinha:"Casa",muro:"Muro",escada:"Escada",plataforma:"Plataforma"
  }[spec.kind]+" do Otto"),idea:spec.idea,pieces:pieces.map(p=>({...p})),status:"planejado",
   generator:{version:2,method:"grade-retangular-exact-cover",width:spec.width,depth:spec.depth,
    height:spec.height,requestedColor:spec.color,geometry:"tijolos retangulares",structuralCertified:false}};
  return {ok:true,project,audit:{...validate(project),nodes,requiredStuds:required,pieceCount:pieces.length,
   exactStock:true,collisionsChecked:true,supportChecked:true,physicalCertification:false}};
 }
 return {DIMS,parseRequest,createTarget,validate,generate};
});
