const http=require("node:http"),fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require("playwright"),base=path.resolve(__dirname,"..");
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css",".json":"application/json",".webmanifest":"application/manifest+json",".svg":"image/svg+xml"};
const server=http.createServer((req,res)=>{
 const part=decodeURIComponent((req.url||"/").split("?")[0]);
 const file=path.resolve(base,"."+(part==="/"?"/index.html":part));
 if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
 fs.readFile(file,(error,buf)=>{if(error){res.writeHead(404);res.end("404");return;}res.writeHead(200,{"content-type":mime[path.extname(file)]||"application/octet-stream","cache-control":"no-store"});res.end(buf);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 let browser;
 try{
  const url="http://127.0.0.1:"+server.address().port+"/";
  browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  for(const viewport of [{width:1280,height:800},{width:390,height:844}]){
   const page=await browser.newPage({viewport,deviceScaleFactor:1});
   const errors=[];page.on("pageerror",e=>errors.push(e.message));page.on("dialog",d=>d.accept());
   await page.goto(url,{waitUntil:"domcontentloaded"});
   assert.equal(await page.locator("#catalogNumber").textContent(),"12");
   assert.equal(await page.locator(".build").count(),12);
   await page.locator('[data-view3d="lego-sapo"]').click();
   await page.waitForSelector("#model3dDetail.open",{timeout:10000});
   await page.waitForFunction(()=>{
     const s=document.querySelector("#model3dStatus")?.textContent||"";
     return s.includes("3D carregado")||s.includes("Não foi possível")||s.includes("indisponível:");
   },null,{timeout:20000});
   const cadStatus=await page.locator("#model3dStatus").textContent();
   assert.match(cadStatus,/3D carregado:/,"Modelo do sapo não carregou malhas LDraw reais");
   console.log("Modelo Sapo v7:",cadStatus);
   await page.locator("#model3dClose").click();

   assert.equal(await page.locator("#prompt").count(),0,"Deve retirar criação livre");
   await page.fill("#search","castelo");
   assert.equal(await page.locator(".build").count(),1);
   await page.locator(".build [data-open]").click();
   const frame=await page.locator("#manualFrame iframe").getAttribute("src");
   assert.match(frame,/10698_X_Castle\.pdf/,"PDF real LEGO deve ser usado");
   assert.match(await page.locator("#openManual").getAttribute("href"),/10698_X_Castle\.pdf/);
   await page.locator("#addToCity").click();
   assert.equal(await page.locator("#cityNumber").textContent(),"1");
   await page.locator("#closeDetail").click();
   await page.locator("#cityRows [data-next]").click();
   assert.match(await page.locator("#cityRows").textContent(),/Montando/);
   await page.locator("#cityRows [data-next]").click();
   assert.match(await page.locator("#cityRows").textContent(),/Concluído/);
   await page.reload({waitUntil:"domcontentloaded"});
   assert.equal(await page.locator("#cityNumber").textContent(),"1","Cidade deve persistir no navegador");
   await page.locator('[data-filter="comunidade"]').click();
   assert.equal(await page.locator(".build").count(),3);
   const external=await page.locator(".build [data-open]").first().getAttribute("data-open");
   await page.locator(".build [data-open]").first().click();
   assert.match(await page.locator("#openManual").getAttribute("href"),/rebrickable\.com/);
   assert.equal(await page.locator("#manualFrame iframe").count(),0,"MOC deve abrir fonte original, não PDF inventado");
   await page.locator("#closeDetail").click();
   const preserved=await page.evaluate(()=>localStorage.getItem("otto3d:v1"));
   assert.equal(preserved,null,"Versão v6 não deve inventar ou recriar estoque antigo");
   assert.deepEqual(errors,[],"Erros de JavaScript: "+errors.join("; "));
   if(viewport.width<500){const horizontal=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3);assert.equal(horizontal,false,"Scroll horizontal no celular");}
   console.log("Browser v6 PASS:",viewport.width+"×"+viewport.height,"12 fontes reais, PDF LEGO, MOC externo, cidade e persistência");
   await page.close();
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
