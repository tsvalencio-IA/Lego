const assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("index.html"),script=read("catalogo-app.js"),source=read("catalogo-reais.js");
const ctx={window:{}};
vm.runInNewContext(source,ctx,{filename:"catalogo-reais.js"});
const models=ctx.window.OTTO_CATALOGO_REAL;
assert.equal(models.length,12,"9 manuais LEGO e 3 projetos Rebrickable");
assert.equal(models.filter(p=>p.origem==="LEGO oficial").length,9);
assert.equal(models.filter(p=>p.origem.includes("Rebrickable")).length,3);
assert.equal(new Set(models.map(x=>x.id)).size,models.length);
const safe=url=>{const u=new URL(url);return u.protocol==="https:"&&["www.lego.com","www.rebrickable.com","rebrickable.com"].includes(u.hostname)};
for(const p of models){
 assert(p.id&&p.titulo&&p.autor&&p.origem&&p.categoria&&p.manual&&p.fonte,p.id);
 assert(safe(p.manual)&&safe(p.fonte),p.id+" aponta fonte inesperada");
 assert(p.origem!=="LEGO oficial"||p.tipoManual==="pdf",p.id);
 if(p.totalPecas!==null)assert(Number.isSafeInteger(p.totalPecas)&&p.totalPecas>0,p.id);
}
assert(!html.includes('id="prompt"'),"O campo de inventar precisa ser removido");
assert(!html.includes('id="create"'),"O botão de geração precisa ser removido");
assert(!html.includes('src="./generator.js"'),"O gerador não pode ser carregado");
for(const file of ["catalogo-reais.js?v=7.0.0","catalogo-app.js?v=9.0.0","viewer3d.js?v=7.0.0"])assert(html.includes(file),file);
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
for(const m of script.matchAll(/\$\("([^"]+)"\)/g))assert(ids.has(m[1]),"Falta id "+m[1]);
assert(script.includes('otto3d:v1'),"Histórico original não pode ser apagado");
assert(script.includes('otto-lego-reais:v1'),"Nova cidade precisa de chave separada");
console.log("OTTO LEGO v7 PASS: modelos reais, 9 PDFs LEGO, 3 MOCs, sem gerador, UI consistente, dados preservados");
