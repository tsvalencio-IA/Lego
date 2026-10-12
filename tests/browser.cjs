const http=require("node:http"),fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require("playwright");
const base=path.resolve(__dirname,"..");
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css",".json":"application/json",".webmanifest":"application/manifest+json",".svg":"image/svg+xml"};
const server=http.createServer((req,res)=>{
 const relative=decodeURIComponent((req.url||"/").split("?")[0]),name=relative==="/"?"/index.html":relative;
 const file=path.resolve(base,"."+name);
 if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
 fs.readFile(file,(error,buf)=>{if(error){res.writeHead(404);res.end("404");return;}
 res.writeHead(200,{"content-type":mime[path.extname(file)]||"application/octet-stream","cache-control":"no-store"});
 res.end(buf);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 let browser;
 try{
  const address="http://127.0.0.1:"+server.address().port+"/";
  browser=await chromium.launch({channel:"chrome",headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  for(const viewport of [{width:1280,height:800},{width:390,height:844}]){
   const page=await browser.newPage({viewport,deviceScaleFactor:1});
   const errors=[];page.on("pageerror",error=>errors.push(error.message));
   page.on("dialog",dlg=>dlg.accept());
   await page.goto(address,{waitUntil:"domcontentloaded"});
   await page.fill("#prompt","torre de 3 camadas");
   await page.click("#create");
   await page.waitForSelector("#sketch canvas",{timeout:10000});
   await page.waitForTimeout(200);
   const check=await page.evaluate(()=>{
    const sk=document.querySelector("#sketch"),cv=sk.querySelector("canvas");
    return {canvas:!!cv,width:cv?.width||0,height:cv?.height||0,n:document.querySelector("#stepCount")?.textContent||"",
      message:document.querySelector("#notice")?.textContent||"",saveDisabled:document.querySelector("#save")?.disabled};
   });
   assert(check.canvas&&check.width>0&&check.height>0,"3D Canvas didn't appear: "+JSON.stringify(check));
   assert.match(check.message,/Projeto calculado/);
   assert.equal(check.saveDisabled,false);
   const shot1=await page.locator("#sketch").screenshot();
   await page.click("#turn");await page.waitForTimeout(300);
   const shot2=await page.locator("#sketch").screenshot();
   assert(!shot1.equals(shot2),"3D image did not rotate on button interaction.");
   await page.click("#zoomIn");await page.click("#zoomOut");
   await page.click("#next");assert.match(await page.locator("#instruction").textContent(),/Passo 1/);
   await page.click("#previous");
   await page.click("#save");assert(Number(await page.locator("#busy").textContent())>0);
   await page.locator('#city button[data-action="switch"]').first().click();
   await page.locator('#city button[data-action="switch"]').first().click();
   assert.equal(Number(await page.locator("#busy").textContent()),0);
   await page.fill("#prompt","Quero um caminhão com rodas");
   await page.click("#create");
   assert.match(await page.locator("#notice").textContent(),/não constrói/);
   assert.equal(await page.locator("#save").isDisabled(),true);
   if(viewport.width<500){
    const exceeds=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3);
    assert.equal(exceeds,false,"Scroll horizontal detected on Android viewport");
   }
   assert.deepEqual(errors,[],"Runtime exceptions: "+errors.join("; "));
   console.log("Visual browser PASS:",viewport.width+"×"+viewport.height,check.width+"×"+check.height);
   await page.close();
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
