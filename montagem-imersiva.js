/* OTTO LEGO — controles da oficina imersiva; não altera a cidade nem os dados do usuário. */
(()=>{
 "use strict";
 const el=id=>document.getElementById(id),modal=el("model3dDetail");
 const toggle=el("model3dManualToggle"),panel=el("model3dCompare"),iframe=el("model3dManualFrame");
 const more=el("model3dMore"),info=el("model3dExtra");
 function manual(show){
  const visible=Boolean(show)&&modal.classList.contains("open");
  panel.classList.toggle("is-visible",visible);
  toggle.setAttribute("aria-expanded",String(visible));
  toggle.textContent=visible?"Voltar ao 3D":"Manual";
  let mobileHint=el("model3dMobileHint");
  if(!mobileHint){
   mobileHint=document.createElement("p");
   mobileHint.id="model3dMobileHint";
   mobileHint.className="pdf-mobile-note";
   mobileHint.textContent="No celular, o PDF original abre em outra aba para evitar tela preta. Use o botão abaixo e volte ao OTTO para continuar a montagem na mesma etapa.";
   mobileHint.hidden=true;
   panel.insertBefore(mobileHint,el("model3dManualStep"));
  }
  if(visible){
   const nativeMobile=window.matchMedia?.("(max-width: 700px)")?.matches||/\bAndroid\b/i.test(navigator.userAgent);
   if(nativeMobile){
    panel.dataset.noIframe="true";iframe.hidden=true;iframe.removeAttribute("src");
    delete iframe.dataset.current;mobileHint.hidden=false;
   }else{
    delete panel.dataset.noIframe;iframe.hidden=false;mobileHint.hidden=true;
    const href=el("model3dManualStep").href;
    if(href&&iframe.src!==href){iframe.src=href;iframe.dataset.current=href;}
   }
  }else{
   iframe.removeAttribute("src");delete iframe.dataset.current;
   mobileHint.hidden=true;delete panel.dataset.noIframe;
  }
 }
 function details(show){
  info.classList.toggle("is-visible",Boolean(show));
  more.setAttribute("aria-expanded",String(Boolean(show)));
  more.textContent=show?"Ocultar":"Detalhes";
  if(show){
   el("model3dExtraText").textContent=[el("model3dAudit").textContent,el("model3dNote").textContent].filter(Boolean).join(" ");
   const url=el("model3dManual").getAttribute("href");
   el("model3dManualQuick").href=url||"#";
  }
 }
 toggle.addEventListener("click",()=>manual(!panel.classList.contains("is-visible")));
 el("model3dBack3D").addEventListener("click",()=>manual(false));
 more.addEventListener("click",()=>details(!info.classList.contains("is-visible")));
 document.addEventListener("click",event=>{
  if(event.target.closest("[data-view3d]")){manual(false);details(false);}
  if(event.target.closest("#model3dClose")){manual(false);details(false);}
 },true);
 window.addEventListener("orientationchange",()=>{setTimeout(()=>window.dispatchEvent(new Event("resize")),120);});
})();
