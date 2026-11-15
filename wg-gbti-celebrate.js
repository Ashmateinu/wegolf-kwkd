/* WeGolf 快问快答 · GBTI（≥99）庆祝加强动效 v1 —— 独立模块，零依赖（有 WGSfx 就出声）
   只在结果页原有元素上「叠加」位移/缩放（不改布局），外加一个临时全屏 canvas；END 之后全部复位、canvas 移除 → 定格画面与静态版逐像素一致。
   节拍 = 音效 gbti（WGSfx.meta.gbti_beats_s），声音在视觉时间 SOFF=200ms 起播（前 200ms 是球落下的画面）：
     0–200 球从上方落向分数 · 200 进洞「咚」：整块轻震 + 分数压扁回弹 + 第一圈 WE 波纹
     420–1100 看台欢呼渐强：光芒放大加速 + 左右两侧彩带向上喷（密度跟欢呼包络）
     1400 铜管进：分数大回弹 + 第二圈波纹 + 中心大爆彩带 + 6% 橙色闪
     1760 和弦：标题回弹 + 第三圈大波纹 + 顶部彩带雨（到 ~3900）· 2450 GBTI 旗落位时旗子加一次弹跳
     4050 声音收尾 · END 4600 全部复位
   API：
     WGGbti.frame(t)   —— 宿主结果页 render(t) 末尾调用（同一时间轴，可逐帧录制/拖动）；t 回退会重置
     WGGbti.play(root) —— 宿主没有时间轴时用：自带 rAF 跑一遍（root 默认 document）
     WGGbti.reset() / WGGbti.BEATS / WGGbti.END
   选择器（结果页 v3.18 现有）：#stage #num #cheer #rays #f99 ；减少动态：不做任何位移/叠层，只播声音 */
(function(){
"use strict";
var SOFF=200, END=4600, B={clunk:200,roar_in:420,roar_peak:1100,brass:1400,chord:1760,flag:2450,sound_end:4050};
var RM=matchMedia("(prefers-reduced-motion: reduce)").matches, root=document, cv=null, cx=null, dpr=1, parts=[], played=false, last=-1, seed=99;
function q(s){return root.querySelector(s)}
function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}
function seg(t,a,b){return Math.max(0,Math.min(1,(t-a)/(b-a)))}
function ease(x){return 1-Math.pow(1-x,3)}
function back(x){var c=2.2;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)}
function bump(t,at,dur){var k=seg(t,at,at+dur);return k>0&&k<1?Math.sin(k*Math.PI)*Math.pow(1-k,0.6):0}
var COLS=["#EB521A","#EB521A","#EB521A","#FFFFFF","#C6A15B","#053331"];
function build(){parts=[];seed=99;
  function P(o){parts.push(o)}
  /* 两侧喷射（欢呼）：420–1300，按包络分布 */
  for(var i=0;i<70;i++){var side=i%2?1:-1,t0=420+Math.pow(rnd(),0.7)*880;P({k:"j",t0:t0,side:side,a:(-Math.PI/2)+side*(0.18+rnd()*0.35),v:620+rnd()*380,c:COLS[(rnd()*COLS.length)|0],w:4+rnd()*4,h:7+rnd()*8,r0:rnd()*6,vr:(rnd()-.5)*16,life:1.3+rnd()*.7})}
  /* 铜管中心大爆 */
  for(i=0;i<64;i++){var a=rnd()*Math.PI*2,v=260+rnd()*520;P({k:"b",t0:B.brass+rnd()*40,vx:Math.cos(a)*v,vy:Math.sin(a)*v-180,c:COLS[(rnd()*COLS.length)|0],w:5+rnd()*5,h:8+rnd()*9,r0:rnd()*6,vr:(rnd()-.5)*18,life:1.4+rnd()*.8})}
  /* 和弦：顶部彩带雨 */
  for(i=0;i<46;i++)P({k:"r",t0:B.chord+rnd()*1500,x:rnd(),c:COLS[(rnd()*COLS.length)|0],w:4+rnd()*4,h:10+rnd()*10,r0:rnd()*6,vr:(rnd()-.5)*8,sw:20+rnd()*30,life:1.6+rnd()*.6,vy:220+rnd()*160})}
function ensure(){if(cv)return;cv=document.createElement("canvas");cv.setAttribute("aria-hidden","true");cv.className="wg-gbti-fx";
  cv.style.cssText="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60";document.body.appendChild(cv);cx=cv.getContext("2d");size();addEventListener("resize",size)}
function size(){if(!cv)return;dpr=window.devicePixelRatio||1;cv.width=innerWidth*dpr;cv.height=innerHeight*dpr}
function remove(){if(cv){removeEventListener("resize",size);cv.remove();cv=null;cx=null}}
function center(el){var r=el.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,r]}
var WE="M 44.850 38.597 C 46.818 27.119 57.719 17.814 69.197 17.814 L 208.741 17.814 C 212.020 17.814 214.223 20.473 213.661 23.752 L 187.187 178.141 C 185.219 189.619 174.318 198.924 162.840 198.924 L 23.297 198.924 C 20.017 198.924 17.814 196.265 18.377 192.986 Z", WEP=null;
function ring(t,at,c,base,grow,dur,lw){var k=seg(t,at,at+dur);if(k<=0||k>=1)return;if(!WEP&&window.Path2D)WEP=new Path2D(WE);
  var s=(base+grow*ease(k))/195;cx.save();cx.translate(c[0],c[1]);cx.scale(s,s);cx.translate(-116,-108.4);cx.globalAlpha=0.7*(1-k);cx.strokeStyle="#EB521A";cx.lineWidth=lw/s;cx.stroke(WEP);cx.restore()}
var touched=[];
function add(el,tf){if(!el)return;var cur=el.style.transform;if(cur!==el.__wgLast){el.__wgBase=cur==="none"?"":cur}   /* 宿主本帧重写过 → 以它为底；否则沿用上次的底（独立 play 模式不累加） */
  if(touched.indexOf(el)<0)touched.push(el);el.style.transform=(el.__wgBase||"")+" "+tf;el.__wgLast=el.style.transform}
function sound(t){if(t<last){played=false}  /* 回退 = 重播 */
  if(!played&&t>=SOFF&&(last<SOFF||RM)){played=true;if(window.WGSfx)WGSfx.play("gbti")}
  last=t}
function settle(){var st=q("#stage");if(st)st.style.transform="";touched.forEach(function(el){if(el.style.transform===el.__wgLast)el.style.transform=el.__wgBase||"";el.__wgLast=null});touched=[];remove()}
function frame(t){
  if(RM){if(!played){played=true;if(window.WGSfx)WGSfx.play("gbti")}settle();return}
  sound(t);
  if(t>=END){settle();return}
  if(!parts.length)build();ensure();
  var num=q("#num"),cheer=q("#cheer"),rays=q("#rays"),stage=q("#stage"),f99=q("#f99");
  /* 元素叠加：都在宿主本帧写入的 transform 后面追加，END 后宿主写回原值即复位 */
  var sh=t>=B.clunk?5*Math.exp(-(t-B.clunk)/120)*Math.sin((t-B.clunk)/1000*2*Math.PI*14):0;
  if(stage)stage.style.transform=Math.abs(sh)>0.05?"translateY("+sh.toFixed(2)+"px)":"";
  var sq=bump(t,B.clunk,240), pop=bump(t,B.brass,420);
  add(num,"scale("+(1+0.06*sq+0.18*pop).toFixed(4)+","+(1-0.1*sq+0.18*pop).toFixed(4)+")");
  add(cheer,"scale("+(1+0.08*bump(t,B.chord,360)).toFixed(4)+")");
  var roar=seg(t,B.roar_in,B.roar_peak)*(1-seg(t,3000,B.sound_end));
  add(rays,"rotate("+(roar*28+seg(t,B.brass,3000)*40).toFixed(2)+"deg) scale("+(1+0.28*ease(roar)).toFixed(4)+")");
  if(f99)add(f99,"scale("+(1+0.35*bump(t,B.flag,420)).toFixed(4)+")");
  /* 叠层 canvas */
  cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,innerWidth,innerHeight);
  var c=num?center(num):[innerWidth/2,innerHeight/3];
  var fl=bump(t,B.brass,180);if(fl>0){cx.globalAlpha=0.06*fl/0.8;cx.fillStyle="#EB521A";cx.fillRect(0,0,innerWidth,innerHeight)}
  ring(t,B.clunk,c,90,160,700,2);ring(t,B.brass,c,110,260,800,2.5);ring(t,B.chord,c,140,420,1000,3);
  if(f99&&t>=B.flag){ring(t,B.flag,center(f99),14,60,600,1.5)}
  var W=innerWidth,H=innerHeight;
  parts.forEach(function(p){var s=(t-p.t0)/1000;if(s<0||s>p.life)return;var x,y,al=Math.max(0,Math.min(1,(p.life-s)/0.4));
    if(p.k==="j"){var x0=p.side<0?-10:W+10,y0=H*0.78;x=x0+Math.cos(p.a)*p.v*s*0.6;y=y0+Math.sin(p.a)*p.v*s+0.5*900*s*s;}
    else if(p.k==="b"){x=c[0]+p.vx*s*.6;y=c[1]+p.vy*s*.6+0.5*700*s*s;}
    else{x=p.x*W+Math.sin(s*3+p.r0)*p.sw;y=-20+p.vy*s;}
    cx.save();cx.globalAlpha=al;cx.translate(x,y);cx.rotate(p.r0+p.vr*s);cx.fillStyle=p.c;
    if(p.c==="#FFFFFF"){cx.strokeStyle="rgba(4,0,0,.08)";cx.lineWidth=.5}
    var hh=p.h*Math.abs(Math.cos(p.vr*s*.7));cx.fillRect(-p.w/2,-hh/2,p.w,hh);if(p.c==="#FFFFFF")cx.strokeRect(-p.w/2,-hh/2,p.w,hh);cx.restore()});
  if(t<B.clunk+40){var k=Math.min(1,t/B.clunk),y=-20+(c[1]+10)*k*k,r=7*(1-0.5*seg(t,B.clunk,B.clunk+40));   /* 落球：最后画，压在第一波彩带之上 */
    cx.globalAlpha=1;cx.fillStyle="#fff";cx.strokeStyle="#E6E3DD";cx.lineWidth=1;cx.beginPath();cx.arc(c[0],y,r,0,7);cx.fill();cx.stroke();}
}
function reset(){played=false;last=-1;parts=[];settle()}
function play(r){root=r||document;reset();var t0=null;(function loop(ts){if(t0===null)t0=ts;var t=ts-t0;frame(t);if(t<END)requestAnimationFrame(loop);else frame(END)})(performance.now())}
window.WGGbti={frame:frame,play:play,reset:reset,BEATS:B,END:END,SOUND_OFFSET:SOFF,attach:function(r){root=r||document;return window.WGGbti}};
})();
