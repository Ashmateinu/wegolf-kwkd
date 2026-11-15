/* WeGolf 快问快答 · 海报全屏弹出（替代礼盒开盖）
   全屏遮罩 + pcard 原框完整海报，弹出：缩放/淡入；点按关闭回到原页（网格不动）。
   减少动态 = 即显/即关。
   API：WGPoster.open({src,alt,instant}) · close(instant) · isOpen() · bind(el, getSrc, {ignore})
*/
(function(){
"use strict";
var RM=matchMedia("(prefers-reduced-motion: reduce)").matches, ov=null, img=null, opened=false, timer=0;
function css(){
  if(document.getElementById("wg-poster-ov-css"))return;
  var s=document.createElement("style"); s.id="wg-poster-ov-css";
  s.textContent=[
    ".wg-poster-ov{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;",
    "padding:24px;background:rgba(4,0,0,.4);-webkit-tap-highlight-color:transparent;cursor:pointer;opacity:0;",
    "transition:opacity .32s ease}",
    ".wg-poster-ov[hidden]{display:none}",
    ".wg-poster-ov.is-on{opacity:1}",
    ".wg-poster-ov .pcard{background:#fff;padding:5px;border-radius:14px 3px 14px 3px;",
    "box-shadow:0 2px 6px rgba(4,0,0,.10),0 8px 20px rgba(4,0,0,.08);",
    "max-width:100%;max-height:100%;transform:scale(.92);opacity:0;",
    "transition:transform .32s cubic-bezier(.2,.8,.2,1),opacity .32s ease}",
    ".wg-poster-ov.is-in .pcard{transform:none;opacity:1}",
    ".wg-poster-ov img{display:block;width:auto;height:auto;max-width:100%;max-height:calc(100vh - 48px - 10px);border-radius:0}",
    "@media (prefers-reduced-motion: reduce){.wg-poster-ov,.wg-poster-ov .pcard{transition:none;transform:none;opacity:1}}",
    ".wg-poster-ov.is-on.is-in{opacity:1}"
  ].join("");
  document.head.appendChild(s);
}
function mount(){
  css();
  if(ov)return ov;
  ov=document.createElement("div");
  ov.className="wg-poster-ov"; ov.id="poster-ov"; ov.hidden=true;
  ov.setAttribute("role","dialog"); ov.setAttribute("aria-modal","true");
  ov.innerHTML='<div class="pcard"><img alt=""></div>';
  img=ov.querySelector("img");
  document.body.appendChild(ov);
  ov.addEventListener("click",function(){ close(RM); });
  return ov;
}
function open(opts){
  opts=opts||{};
  if(!opts.src)return;
  mount();
  clearTimeout(timer);
  img.src=opts.src; img.alt=opts.alt||"";
  ov.hidden=false;
  var instant=!!(opts.instant||RM);
  if(instant){
    ov.classList.add("is-on","is-in"); opened=true;
  }else{
    ov.classList.remove("is-on","is-in");
    void ov.offsetWidth;
    requestAnimationFrame(function(){
      ov.classList.add("is-on");
      requestAnimationFrame(function(){ ov.classList.add("is-in"); opened=true; });
    });
  }
}
function close(instant){
  if(!ov||ov.hidden)return;
  clearTimeout(timer);
  var now=!!(instant||RM);
  function hide(){ ov.hidden=true; ov.classList.remove("is-on","is-in"); opened=false; }
  if(now) hide();
  else{ ov.classList.remove("is-in"); ov.classList.remove("is-on"); timer=setTimeout(hide,320); }
}
function isOpen(){ return !!(ov&&!ov.hidden&&opened); }
function bind(el, getSrc, opt){
  if(!el)return;
  opt=opt||{};
  el.addEventListener("click",function(e){
    if(opt.ignore&&e.target.closest&&e.target.closest(opt.ignore))return;
    e.stopPropagation();
    var a=typeof getSrc==="function"?getSrc():getSrc;
    if(a&&a.src) open(a);
  });
}
window.WGPoster={open:open,close:close,isOpen:isOpen,bind:bind,mount:mount};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);
else mount();
})();
