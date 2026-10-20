(function(){
var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var NS = 'http://www.w3.org/2000/svg';

/* ---------- nav: solid, progress, active ---------- */
var nav=$('#nav'), bar=$('#bar'), links=$$('.nav ul a');
var secs=links.map(function(a){return $(a.getAttribute('href'))});
function onScroll(){
  var y=scrollY, h=document.documentElement.scrollHeight-innerHeight;
  nav.classList.toggle('solid', y>30);
  bar.style.width=(h>0?y/h*100:0)+'%';
  var cur=-1; secs.forEach(function(s,i){ if(s && s.getBoundingClientRect().top<innerHeight*.4) cur=i });
  links.forEach(function(a,i){a.classList.toggle('on',i===cur)});
}
addEventListener('scroll',onScroll,{passive:true}); onScroll();

/* ---------- counters ---------- */
function count(el,delay){
  var v=parseFloat(el.dataset.v),p=el.dataset.p||'',s=el.dataset.s||'',d=(el.dataset.v.split('.')[1]||'').length;
  function set(x){el.textContent=p+(d?x.toFixed(d):Math.round(x).toLocaleString('en'))+s}
  if(RM){set(v);return}
  var t0=null;
  function f(t){if(!t0)t0=t+delay;var k=Math.min(Math.max((t-t0)/1300,0),1);set(v*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)}
  set(0);requestAnimationFrame(f);
}
$$('[data-v]').forEach(function(el,i){count(el,700+i*180)});

/* ---------- reveal ---------- */
var io=new IntersectionObserver(function(es){es.forEach(function(e){
  if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}
})},{threshold:.12});
$$('.reveal').forEach(function(el){io.observe(el)});
var gio=new IntersectionObserver(function(es){es.forEach(function(e){
  if(!e.isIntersecting)return;
  if(e.target.id==='grade')e.target.classList.add('in');
  if(e.target.id==='langs')$$('.meter i',e.target).forEach(function(i){i.style.width=i.dataset.w+'%'});
  gio.unobserve(e.target);
})},{threshold:.4});
gio.observe($('#grade')); gio.observe($('#langs'));

/* ---------- tabs ---------- */
var tabs=$$('.tabs button'), panels=$$('.panel');
function showTab(n){
  tabs.forEach(function(b,i){b.classList.toggle('on',i===n)});
  panels.forEach(function(p,i){p.classList.toggle('on',i===n)});
  if(n===3 && !aiStarted){aiStarted=true;typeAI()}
}
tabs.forEach(function(b,i){b.addEventListener('click',function(){showTab(i)})});

/* ---------- 01 before/after flow ---------- */
var FLOW={
  before:{steps:[['Export from SAP & HFM','Manual download, each month','≈ 1 day'],['Clean in Excel','Fix formats, reconcile','≈ 2 days'],['Build charts by hand','Copy-paste into slides','≈ 1 day'],['Email to managers','Static file, already dated','stale'],['Correction found','Start again from step 1','↺ repeat']],
          verdict:'Slow, error-prone, and out of date on arrival.'},
  after:{steps:[['Enter or import data','Four structured categories','minutes'],['Validated in PostgreSQL','One source of truth','instant'],['KPIs computed by the API','Documented formulas','instant'],['Dashboards by role','Managers see what they need','live'],['AI commentary','Risks flagged, stored for review','on demand']],
         verdict:'One pipeline; a correction updates every dashboard at once.'}
};
function renderFlow(k){
  var box=$('#steps'); box.className='steps '+k; box.innerHTML='';
  FLOW[k].steps.forEach(function(s,i){
    var d=document.createElement('div'); d.className='step'; d.style.animationDelay=(i*.08)+'s';
    d.innerHTML='<span class="dot">'+(i+1)+'</span><div><b>'+s[0]+'</b><small>'+s[1]+'</small></div><span class="t">'+s[2]+'</span>';
    box.appendChild(d);
  });
  $('#verdict').textContent=FLOW[k].verdict;
}
$$('.switch button').forEach(function(b){b.addEventListener('click',function(){
  $$('.switch button').forEach(function(x){x.classList.toggle('on',x===b)}); renderFlow(b.dataset.f);
})});
renderFlow('before');

/* ---------- 02 dashboards ---------- */
var DASH=[
  ['Profitability','Margins, ROA, ROE',[30,34,31,38,36,42,45],'line'],
  ['Balance sheet','Working capital, structure',[50,48,52,55,54,58,60],'bar'],
  ['Liquidity','Current & cash ratios, FCF',[40,36,42,38,44,47,50],'line'],
  ['Receivables & payables','DSO and DPO',[60,55,58,50,48,46,44],'bar']
];
$('#dashes').innerHTML=DASH.map(function(d){
  var pts=d[2], w=160, h=46, svg='';
  if(d[3]==='line'){
    var p=pts.map(function(v,i){return (i/(pts.length-1)*w).toFixed(1)+' '+(h-v/70*h).toFixed(1)}).join(' L');
    svg='<path d="M'+p+'" fill="none" stroke="#2E6A4E" stroke-width="2"/>';
  } else {
    svg=pts.map(function(v,i){var bh=v/70*h;return '<rect x="'+(i*23)+'" y="'+(h-bh)+'" width="15" height="'+bh+'" fill="#33557F" opacity="'+(.45+i*.08)+'"/>'}).join('');
  }
  return '<div class="dash"><svg viewBox="0 0 160 46" preserveAspectRatio="none">'+svg+'</svg><b>'+d[0]+'</b><small>'+d[1]+'</small></div>';
}).join('');

/* ---------- 03 GIMSI explorer ---------- */
var GIMSI=[
  {o:'Stay profitable',k:[
    ['Gross margin','Gross margin = (<i>Revenue</i> − <i>Cost of sales</i>) ÷ <i>Revenue</i>','How much of each euro of revenue is left after direct costs.','revenue_expenses'],
    ['ROA','ROA = <i>Net income</i> ÷ <i>Total assets</i>','How efficiently assets generate profit.','revenue_expenses · assets_liabilities'],
    ['ROE','ROE = <i>Net income</i> ÷ <i>Shareholders\u2019 equity</i>','Return generated on the owners\u2019 capital.','revenue_expenses · assets_liabilities']]},
  {o:'Keep enough cash',k:[
    ['Current ratio','Current ratio = <i>Current assets</i> ÷ <i>Current liabilities</i>','Ability to cover short-term obligations.','assets_liabilities'],
    ['Cash ratio','Cash ratio = <i>Cash & equivalents</i> ÷ <i>Current liabilities</i>','The strictest liquidity test: cash only.','assets_liabilities · cash_flow'],
    ['Free cash flow','FCF = <i>Operating cash flow</i> − <i>Capex</i>','Cash left after keeping the business running.','cash_flow']]},
  {o:'Fund operations',k:[
    ['Working capital','WC = <i>Current assets</i> − <i>Current liabilities</i>','The cushion financing day-to-day activity.','assets_liabilities']]},
  {o:'Collect & pay on time',k:[
    ['DSO','DSO = <i>Trade receivables</i> ÷ <i>Revenue</i> × <i>365</i>','Average days to collect from clients.','clients · revenue_expenses'],
    ['DPO','DPO = <i>Trade payables</i> ÷ <i>Purchases</i> × <i>365</i>','Average days taken to pay suppliers.','assets_liabilities · revenue_expenses']]}
];
var objBox=$('#objs'), kBox=$('#kpiList'), fBox=$('#formula');
GIMSI.forEach(function(g,gi){
  var b=document.createElement('button'); b.textContent=g.o; b.onclick=function(){pickObj(gi)}; objBox.appendChild(b);
  g.k.forEach(function(k,ki){
    var kb=document.createElement('button'); kb.textContent=k[0]; kb.dataset.g=gi; kb.onclick=function(){pickKpi(gi,ki)}; kBox.appendChild(kb);
  });
});
function pickObj(gi){
  $$('button',objBox).forEach(function(b,i){b.classList.toggle('on',i===gi)});
  $$('button',kBox).forEach(function(b){b.classList.toggle('show',+b.dataset.g===gi)});
  pickKpi(gi,0);
}
function pickKpi(gi,ki){
  var all=$$('button',kBox).filter(function(b){return +b.dataset.g===gi});
  $$('button',kBox).forEach(function(b){b.classList.remove('on')}); all[ki].classList.add('on');
  var k=GIMSI[gi].k[ki];
  fBox.innerHTML='<h4>'+k[0]+'</h4><div class="eq">'+k[1]+'</div><p>'+k[2]+'</p><p class="mono" style="margin-top:8px;font-size:.7rem">Source · '+k[3]+'</p>';
}
pickObj(1);

/* ---------- 04 AI commentary (simulated) ---------- */
var AI=[
  [['ok','Profitability'],'Gross margin holds at 31.4%, slightly above the prior month. Cost of sales grew more slowly than revenue.'],
  [['risk','Receivables'],'DSO has risen to 46 days while DPO sits at 52. The gap is narrowing, which may put pressure on cash in the coming months.'],
  [['risk','Liquidity'],'A cash ratio of 0.42 covers less than half of current liabilities with cash alone. Watch it alongside the current ratio.'],
  ['rec',['Review the ten largest overdue client balances and agree collection dates.','Check whether supplier terms can be aligned with client terms.','Track the cash ratio weekly until DSO is back under 40 days.']]
];
var aiStarted=false, aiTimer=null;
function typeAI(){
  clearTimeout(aiTimer);
  var out=$('#aiOut'); out.innerHTML='';
  var queue=[];
  AI.forEach(function(b){
    if(b[0]==='rec'){queue.push({html:'<p style="margin-top:14px;color:#9CC8AE" class="mono">Recommendations</p>'});
      var ol=document.createElement('ol'); queue.push({el:ol});
      b[1].forEach(function(t){queue.push({li:t,ol:ol})});
    } else queue.push({flag:b[0],text:b[1]});
  });
  var caret=document.createElement('span'); caret.className='caret';
  function next(){
    if(!queue.length){out.appendChild(caret);return}
    var q=queue.shift();
    if(q.html){out.insertAdjacentHTML('beforeend',q.html);return next()}
    if(q.el){out.appendChild(q.el);return next()}
    var target,text;
    if(q.li){target=document.createElement('li');q.ol.appendChild(target);text=q.li}
    else{target=document.createElement('p');target.innerHTML='<span class="flag'+(q.flag[0]==='ok'?' ok':'')+'">'+(q.flag[0]==='ok'?'OK':'RISK')+' · '+q.flag[1]+'</span>';out.appendChild(target);text=q.text}
    var span=document.createElement('span');target.appendChild(span);target.appendChild(caret);
    if(RM){span.textContent=text;return next()}
    var i=0;(function t(){span.textContent=text.slice(0,i+=3);if(i<text.length)aiTimer=setTimeout(t,14);else aiTimer=setTimeout(next,220)})();
  }
  next();
}
$('#regen').onclick=typeAI;

/* ---------- treasury BvA ---------- */
var M=['Jan','Feb','Mar','Apr','May','Jun'], BUD=[300,310,320,330,340,350], ACT=[288,322,305,352,331,371];
var bva=$('#bva'), bvaMode='abs';
bva.innerHTML=M.map(function(m){return '<div class="col"><div class="bud"></div><div class="act"></div><div class="var"></div><span class="vtxt"></span><span class="lab">'+m+'</span></div>'}).join('')+'<div class="zero"></div>';
function drawBva(){
  var cols=$$('.col',bva); bva.classList.toggle('variance',bvaMode==='var');
  cols.forEach(function(c,i){
    var a=$('.act',c),b=$('.bud',c),v=$('.var',c),t=$('.vtxt',c),diff=ACT[i]-BUD[i],pct=diff/BUD[i]*100;
    t.textContent=(pct>0?'+':'')+pct.toFixed(1)+'%'; t.style.color=diff>=0?'#2E6A4E':'#D2582A';
    if(bvaMode==='abs'){
      a.style.height=(ACT[i]/400*100)+'%'; b.style.bottom=(BUD[i]/400*100)+'%'; b.style.opacity=1;
      v.style.height='0'; v.style.top='50%'; t.style.bottom=(Math.max(ACT[i],BUD[i])/400*100+3)+'%'; t.style.top='auto';
    } else {
      a.style.height='0'; b.style.opacity=0;
      var hp=Math.abs(pct)/8*45; v.style.height=hp+'%'; v.style.background=diff>=0?'#2E6A4E':'#D2582A';
      v.style.top=diff>=0?(50-hp)+'%':'50%';
      t.style.top=diff>=0?(50-hp-12)+'%':(50+hp+3)+'%'; t.style.bottom='auto';
    }
  });
  $('#bvaLegend').innerHTML=bvaMode==='abs'
    ?'<span><i style="background:#33557F"></i>Actual (€k)</span><span><i style="border-top:2px dashed #15171C;height:0"></i>Budget</span>'
    :'<span><i style="background:#2E6A4E"></i>Above budget</span><span><i style="background:#D2582A"></i>Below budget</span>';
}
$$('#bvaSeg button').forEach(function(b){b.onclick=function(){$$('#bvaSeg button').forEach(function(x){x.classList.toggle('on',x===b)});bvaMode=b.dataset.m;drawBva()}});
drawBva();

/* ---------- scaling comparison ---------- */
var PAY=[14,16,17,18,19,20,21,22,24,25,27,62]; // invented, one outlier
var sc=$('#scale');
var n=PAY.length, mean=PAY.reduce(function(a,b){return a+b})/n;
var sd=Math.sqrt(PAY.reduce(function(a,b){return a+(b-mean)*(b-mean)},0)/n);
var sorted=PAY.slice().sort(function(a,b){return a-b});
function q(p){var i=(n-1)*p,lo=Math.floor(i),hi=Math.ceil(i);return sorted[lo]+(sorted[hi]-sorted[lo])*(i-lo)}
var med=q(.5), iqr=q(.75)-q(.25), mn=sorted[0], mx=sorted[n-1];
var SC={
  raw:{f:function(x){return x},r:[0,70],t:[0,20,40,60],note:'Raw hourly pay (invented). The IQR rule flags the value far above the rest.'},
  minmax:{f:function(x){return (x-mn)/(mx-mn)},r:[-.1,1.1],t:[0,.5,1],note:'MinMax squeezes everything into 0–1 — the outlier pushes the other points together.'},
  std:{f:function(x){return (x-mean)/sd},r:[-1.5,3.5],t:[-1,0,1,2,3],note:'Standard scaling centres on the mean; the outlier still inflates the spread.'},
  robust:{f:function(x){return (x-med)/iqr},r:[-1.5,7],t:[-1,0,2,4,6],note:'Robust scaling uses median and IQR, so typical values keep their shape.'},
  maxabs:{f:function(x){return x/mx},r:[0,1.1],t:[0,.5,1],note:'MaxAbs divides by the largest value; useful for sparse data, sensitive to outliers.'}
};
var thr=q(.75)+1.5*iqr;
sc.innerHTML='<div class="axis"></div>'+PAY.map(function(v,i){return '<div class="pt'+(v>thr?' out':'')+'" style="top:'+(30+(i%3)*18)+'px"></div>'}).join('');
function drawScale(k){
  var s=SC[k], pts=$$('.pt',sc);
  $$('.tick',sc).forEach(function(t){t.remove()});
  function pos(x){return ((x-s.r[0])/(s.r[1]-s.r[0])*100)}
  pts.forEach(function(p,i){p.style.left=pos(s.f(PAY[i]))+'%'});
  s.t.forEach(function(t){var d=document.createElement('span');d.className='tick';d.style.left=pos(t)+'%';d.textContent=t;sc.appendChild(d)});
  $('#scaleNote').textContent=s.note;
}
$$('#scaleSeg button').forEach(function(b){b.onclick=function(){$$('#scaleSeg button').forEach(function(x){x.classList.toggle('on',x===b)});drawScale(b.dataset.s)}});
drawScale('raw');

/* ---------- liquidity demo ---------- */
var MM=['Jan','Feb','Mar','Apr','May','Jun'], IN=[420,455,430,510,480,540], OUT=[390,410,445,440,455,430];
var S={g:$('#sG'),d:$('#sD'),p:$('#sP'),c:$('#sC')};
var BASE={g:0,d:46,p:52,c:0};
function model(v){
  var fi=(1+v.g/100)*(1-(v.d-46)*.006), fo=(1+v.c/100)*(1-(v.p-52)*.005);
  var ins=IN.map(function(x){return x*fi}), outs=OUT.map(function(x){return x*fo});
  var fcf=ins.reduce(function(a,b,i){return a+b-outs[i]},0);
  var cash=155+fcf, cr=cash/1000;
  return {ins:ins,outs:outs,fcf:fcf,cr:cr,dso:v.d,dpo:v.p};
}
var base=model(BASE);
var svg=$('#cd'), tip=$('#tip'), W=700, H=300, L=44, T=20, PH=230, YMAX=700;
function y(v){return T+PH-v/YMAX*PH}
(function initChart(){
  var h='';
  for(var g=0;g<=7;g+=1){if(g%1)continue;var yy=y(g*100);h+='<line x1="'+L+'" x2="'+W+'" y1="'+yy+'" y2="'+yy+'" stroke="#33363E"/>';if(g%2===0)h+='<text x="'+(L-8)+'" y="'+(yy+4)+'" text-anchor="end" font-size="11" fill="#6E727A" font-family="IBM Plex Mono">'+g*100+'</text>'}
  MM.forEach(function(m,i){var x=L+30+i*108;
    h+='<rect class="b bi" data-i="'+i+'" x="'+x+'" width="34" fill="#2E6A4E" rx="2"/>';
    h+='<rect class="b bo" data-i="'+i+'" x="'+(x+38)+'" width="34" fill="#33557F" rx="2"/>';
    h+='<text x="'+(x+36)+'" y="'+(T+PH+22)+'" text-anchor="middle" font-size="12" fill="#9A9EA6" font-family="IBM Plex Mono">'+m+'</text>'});
  h+='<path id="netLine" fill="none" stroke="#F09A73" stroke-width="2.5" stroke-linejoin="round"/>';
  h+='<g id="netDots"></g>';
  h+='<g font-size="11" fill="#ECE6D8" font-family="Hanken Grotesk"><rect x="'+(W-330)+'" y="0" width="10" height="10" fill="#2E6A4E"/><text x="'+(W-315)+'" y="9">Cash in</text><rect x="'+(W-250)+'" y="0" width="10" height="10" fill="#33557F"/><text x="'+(W-235)+'" y="9">Cash out</text><line x1="'+(W-165)+'" x2="'+(W-150)+'" y1="5" y2="5" stroke="#F09A73" stroke-width="2.5"/><text x="'+(W-145)+'" y="9">Net × 5 (€k, invented)</text></g>';
  svg.innerHTML=h;
  $$('rect.b',svg).forEach(function(r){
    r.addEventListener('mousemove',function(e){
      var i=+r.dataset.i, m=cur, box=$('#chartD').getBoundingClientRect();
      tip.innerHTML=MM[i]+' · in <b>€'+Math.round(m.ins[i])+'k</b> · out <b>€'+Math.round(m.outs[i])+'k</b>';
      tip.style.left=(e.clientX-box.left)+'px'; tip.style.top=(e.clientY-box.top)+'px'; tip.style.opacity=1;
      $$('rect.b',svg).forEach(function(o){o.style.opacity=+o.dataset.i===i?1:.35});
    });
    r.addEventListener('mouseleave',function(){tip.style.opacity=0;$$('rect.b',svg).forEach(function(o){o.style.opacity=1})});
  });
})();
var cur=base, shown=null, raf=null;
function lerp(a,b,k){return a+(b-a)*k}
function animateTo(target){
  var from=shown||target, t0=null; cancelAnimationFrame(raf);
  function f(t){if(!t0)t0=t;var k=RM?1:Math.min((t-t0)/450,1),e=1-Math.pow(1-k,3);
    var m={ins:target.ins.map(function(v,i){return lerp(from.ins[i],v,e)}),outs:target.outs.map(function(v,i){return lerp(from.outs[i],v,e)}),fcf:lerp(from.fcf,target.fcf,e),cr:lerp(from.cr,target.cr,e),dso:target.dso,dpo:target.dpo};
    paint(m); shown=m; if(k<1)raf=requestAnimationFrame(f)}
  raf=requestAnimationFrame(f);
}
function paint(m){
  $$('rect.bi',svg).forEach(function(r,i){r.setAttribute('y',y(m.ins[i]));r.setAttribute('height',T+PH-y(m.ins[i]))});
  $$('rect.bo',svg).forEach(function(r,i){r.setAttribute('y',y(m.outs[i]));r.setAttribute('height',T+PH-y(m.outs[i]))});
  var pts=MM.map(function(_,i){var net=(m.ins[i]-m.outs[i])*5;return [L+68+i*108, y(Math.max(0,Math.min(YMAX,net+0)))]});
  // net line around a zero baseline at 0; clamp negatives visually to bottom
  $('#netLine').setAttribute('d','M'+pts.map(function(p){return p[0]+' '+p[1]}).join(' L'));
  $('#netDots').innerHTML=pts.map(function(p){return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="4" fill="#15171C" stroke="#F09A73" stroke-width="2"/>'}).join('');
  $('#kFcf').textContent=(m.fcf<0?'−€':'€')+Math.abs(Math.round(m.fcf))+'k';
  $('#kCr').textContent=m.cr.toFixed(2);
  $('#kDso').textContent=m.dso+' d';
  $('#kDpo').textContent=m.dpo+' d';
  delta('#dFcf',m.fcf-base.fcf,'k',true,0);
  delta('#dCr',m.cr-base.cr,'',true,2);
  delta('#dDso',m.dso-base.dso,' d',false,0);
  delta('#dDpo',m.dpo-base.dpo,' d',true,0);
}
function delta(sel,d,u,upGood,dp){
  var el=$(sel), r=+d.toFixed(dp);
  if(r===0){el.className='';el.style.color='#6E727A';el.textContent='baseline';return}
  el.style.color='';el.className=((r>0)===upGood)?'up':'down';
  el.textContent=(r>0?'▲ +':'▼ ')+(dp?r.toFixed(dp):Math.round(r))+u+' vs base';
}
function readout(m){
  var items=[];
  if(m.fcf<0)items.push(['risk','Free cash flow turns negative: the period consumes more cash than it generates.']);
  else if(m.fcf<base.fcf*.6)items.push(['risk','Free cash flow drops sharply versus baseline.']);
  else items.push(['ok','Free cash flow stays positive at €'+Math.round(m.fcf)+'k over six months.']);
  if(m.cr<.3)items.push(['risk','Cash ratio of '+m.cr.toFixed(2)+' leaves thin cover for short-term liabilities.']);
  else if(m.cr>.5)items.push(['ok','Cash ratio of '+m.cr.toFixed(2)+' gives comfortable short-term cover.']);
  else items.push(['ok','Cash ratio of '+m.cr.toFixed(2)+' is in line with baseline.']);
  var gap=m.dso-m.dpo;
  if(gap>0)items.push(['risk','Clients pay '+gap+' days slower than we pay suppliers — the business finances its clients.']);
  else items.push(['ok','Suppliers are paid '+(-gap)+' days after clients pay — the cycle funds itself.']);
  $('#readout').innerHTML=items.map(function(i){return '<li><span class="flag'+(i[0]==='ok'?' ok':'')+'">'+(i[0]==='ok'?'OK':'RISK')+'</span><span>'+i[1]+'</span></li>'}).join('');
}
function update(){
  var v={g:+S.g.value,d:+S.d.value,p:+S.p.value,c:+S.c.value};
  $('#vG').textContent=(v.g>0?'+':'')+v.g+'%'; $('#vC').textContent=(v.c>0?'+':'')+v.c+'%';
  $('#vD').textContent=v.d+' d'; $('#vP').textContent=v.p+' d';
  cur=model(v); animateTo(cur); readout(cur);
}
Object.keys(S).forEach(function(k){S[k].addEventListener('input',update)});
$('#reset').onclick=function(){Object.keys(S).forEach(function(k){S[k].value=BASE[k]});update()};
// start bars at zero, animate in when visible
shown={ins:IN.map(function(){return 0}),outs:OUT.map(function(){return 0}),fcf:0,cr:0,dso:46,dpo:52};
paint(shown); readout(base);
var dio=new IntersectionObserver(function(es){if(es[0].isIntersecting){update();dio.disconnect()}},{threshold:.3});
dio.observe($('#chartD'));

/* ---------- copy email ---------- */
$('#mail').addEventListener('click',function(e){
  if(navigator.clipboard){e.preventDefault();navigator.clipboard.writeText('jtldouaa@gmail.com').then(function(){
    var t=$('#toast');t.classList.add('show');setTimeout(function(){t.classList.remove('show')},1800);
  },function(){location.href='mailto:jtldouaa@gmail.com'})}
});
})();
