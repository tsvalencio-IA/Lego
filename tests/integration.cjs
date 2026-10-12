/* Static integration checks — no dependency installation required. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const page=read("index.html"),app=read("app.js"),sw=read("sw.js"),css=read("styles.css");
for(const name of ["generator.js","oraculo.js","app.js","ldraw-view.js"]){
 assert(fs.existsSync(path.join(root,name)),name+" is missing");
}
const idList=[...page.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
const ids=new Set(idList);
assert.equal(idList.length,ids.size,"duplicate IDs in index.html");
const appIds=[...app.matchAll(/\bel\("([^"]+)"\)/g)].map(x=>x[1]);
const missing=[...new Set(appIds.filter(x=>!ids.has(x)))];
assert.deepEqual(missing,[],"app references missing DOM controls");
assert(page.indexOf("generator.js?v=3.0.0")<page.indexOf("oraculo.js?v=3.0.0"));
assert(page.indexOf("oraculo.js?v=3.0.0")<page.indexOf("app.js?v=3.0.0"));
for(const script of ["generator.js?v=3.0.0","oraculo.js?v=3.0.0","app.js?v=3.0.0"]){
 assert(page.includes(script),"required browser script not included: "+script);
 assert(sw.includes(script),"service worker missing current script: "+script);
}
assert(page.includes('id="realGeometry"'));
assert(page.includes('id="oracleVerdict"'));
assert(css.includes(".oracle-verdict"));
assert(read("ldraw-view.js").includes("setPartsLibraryPath"));
console.log("ORÁCULO v3 integration: PASS (DOM IDs, script ordering, service worker, viewer assets)");
