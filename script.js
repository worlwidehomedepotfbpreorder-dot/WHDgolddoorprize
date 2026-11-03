
(()=>{'use strict';const KEY='worldwide-door-prizes-empty-start-v2';const $=id=>document.getElementById(id);const colors={blue:'GRAND PRIZE',gold:'MAJOR PRIZE',red:'REGULAR PRIZE'};let state,spinning=false,interval=null,drawTimer=null;const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random();const emptyState=()=>({prizes:[],history:[],nextNumber:1});try{state=JSON.parse(localStorage.getItem(KEY));if(!state||!Array.isArray(state.prizes)||!Array.isArray(state.history))throw Error()}catch(e){state=emptyState()}// Migrate older saved prize lists to permanent sequential numbers. Preserve old IDs and draws.
if(!Number.isInteger(state.nextNumber)||state.nextNumber<1){state.prizes.forEach((p,i)=>p.number=i+1);state.nextNumber=state.prizes.length+1}else{const used=new Set();for(const p of state.prizes){if(!Number.isInteger(p.number)||p.number<1||used.has(p.number))p.number=state.nextNumber++;used.add(p.number)}state.nextNumber=Math.max(state.nextNumber,...state.prizes.map(p=>p.number+1),1)}
for(const h of state.history){if(!Number.isInteger(h.number)){const orig=state.prizes.find(p=>p.id===h.id);if(orig)h.number=orig.number}}
const normalizeEmptyNumbering=()=>{if(state.prizes.length===0){state.nextNumber=1;state.history=[];}};const save=()=>{normalizeEmptyNumbering();try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){toast('Storage full. Export a backup and reduce prize entries.')}};const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const remaining=(color='all')=>state.prizes.filter(p=>!p.drawn&&(color==='all'||p.color===color));const count=c=>remaining(c).length;const toast=s=>{const el=$('toast');el.textContent=s;el.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>el.style.display='none',3200)};function render(){const all=state.prizes,drawn=all.filter(p=>p.drawn).length;$('prizeList').innerHTML=all.length?all.map((p,i)=>`<div data-number="${p.number}" class="prize ${p.color} ${p.drawn?'drawn':''}" title="${esc(p.name||'Prize #'+p.number)} — ${p.color}${p.drawn?' — DRAWN':''}"><span class="dot"></span><span class="name">${p.number}.)${p.name?.trim()?' '+esc(p.name.trim()):''}</span></div>`).join(''):'<div class="empty-prizes">No door prizes yet. Click <b>MANAGE PRIZES</b> to add your Blue, Gold, and Red prize entries.</div>';$('listCounter').textContent=`(${drawn}/${all.length} drawn)`;$('grandLeft').textContent=count('blue');$('drawCount').textContent=state.history.length;const last=state.history.at(-1);$('previous').textContent=state.history.length>1?padPrize(state.history.at(-2).number):'—';if(last&&!spinning){$('winner').textContent=padPrize(last.number);$('winnerCategory').textContent=colors[last.color];}document.querySelectorAll('.reel').forEach(el=>el.classList.toggle('active',!spinning&&!!last));$('spin').disabled=spinning||!remaining($('category').value).length;$('slotLever').disabled=$('spin').disabled;$('undo').disabled=spinning||!state.history.length;$('managerSummary').textContent=`${all.length} total entries • ${remaining().length} remaining • ${drawn} drawn`;updateRemoveColorCount();renderManageList();if(!spinning){const hasWin=!!state.history.length;$('reels').classList.toggle('idle-glow',!hasWin);$('reels').classList.toggle('jackpot-flash',hasWin);$('winner').classList.toggle('ready-glow',!hasWin);$('winner').classList.toggle('winner-flash',hasWin);}}
const formatPrize=p=>p.name?.trim()?`${p.number??'?'}.) ${p.name.trim()}`:`${p.number??'?'}.)`;
function add(name,color,n,number=null){
 if(!colors[color]||!Number.isInteger(n)||n<1||n>10000)throw Error('Check color and quantity (1–10,000).');
 if(state.prizes.length+n>999)throw Error('Three-digit reels support a maximum of 999 prizes.');
 const used=new Set(state.prizes.map(p=>p.number));
 if(number!==null&&(!Number.isSafeInteger(number)||(number<1||number>999)))throw Error('Prize number must be between 1 and 999.');
 let candidate=number===null?state.nextNumber:number;
 for(let i=0;i<n;i++){
  while(used.has(candidate)){
   if(number!==null)throw Error('Prize #'+candidate+' already exists. Choose an unused number.');
   candidate++;
  }
  if(!Number.isSafeInteger(candidate)||candidate>999)throw Error('No available three-digit prize numbers remain (maximum #999).');
  used.add(candidate);
  state.prizes.push({id:uid(),number:candidate,name,color,drawn:false});candidate++;
 }
 state.nextNumber=Math.max(state.nextNumber,candidate);
}
// Three mechanical-style digit reels. Prize numbers 1–999 are displayed with leading zeroes.
const padPrize=n=>String(n||0).padStart(3,'0');
function showReels(color,number){
 const digits=padPrize(number).split('');
 document.querySelectorAll('.digit-reel').forEach((el,i)=>{
  el.classList.remove('blue','gold','red');
  el.classList.add(color||'blue');
  el.querySelector('.digit-number').textContent=digits[i];
 });
}
// Canvas confetti celebrates a completed draw without blocking controls or changing prize logic.
let confettiFrame=0, confettiCanvas=null;
function stopConfetti(){
 if(confettiFrame)cancelAnimationFrame(confettiFrame);
 confettiFrame=0;
 if(confettiCanvas){confettiCanvas.remove();confettiCanvas=null;}
}
let congratulationsTimer=0;
function hideCongratulations(){
 clearTimeout(congratulationsTimer);congratulationsTimer=0;
 const overlay=$('congratulationsOverlay');
 if(overlay){overlay.classList.remove('is-visible');overlay.setAttribute('aria-hidden','true');}
}
function showCongratulations(number){
 hideCongratulations();
 $('congratsNumber').textContent=padPrize(number);
 const overlay=$('congratulationsOverlay');
 // Force a fresh animation when consecutive draws happen quickly.
 void overlay.offsetWidth;
 overlay.classList.add('is-visible');overlay.setAttribute('aria-hidden','false');
 congratulationsTimer=setTimeout(hideCongratulations,5800);
}
function celebrateWin(){
 stopConfetti();
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
 const canvas=document.createElement('canvas');
 canvas.className='winning-confetti';
 canvas.setAttribute('aria-hidden','true');
 document.body.appendChild(canvas);confettiCanvas=canvas;
 const ctx=canvas.getContext('2d');
 if(!ctx){stopConfetti();return;}
 let width=0,height=0,dpr=1;
 function size(){
  width=window.innerWidth;height=window.innerHeight;dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
 }
 size();
 const rect=$('reels').getBoundingClientRect();
 const midX=rect.left+rect.width/2, originY=Math.min(rect.bottom,innerHeight*.72);
 const palette=['#ffd56b','#ffb92f','#fff0af','#ffffff','#4a95f6','#0d4cbd','#f15b64'];
 const particles=Array.from({length:210},(_,i)=>{
  const left=i%2===0;
  const x=left?rect.left+Math.min(60,rect.width*.12):rect.right-Math.min(60,rect.width*.12);
  const spread=(Math.random()-.5)*2;
  return {x,y:originY-30-Math.random()*40,vx:(left?1:-1)*(3+Math.random()*7)+spread*2,vy:-7-Math.random()*9,gravity:.16+Math.random()*.13,drag:.991+Math.random()*.006,rotation:Math.random()*6.28,spin:(Math.random()-.5)*.22,size:4+Math.random()*7,color:palette[Math.floor(Math.random()*palette.length)],shape:Math.random()<.24?'circle':'rect',phase:Math.random()*6.28};
 });
 const begun=performance.now();let last=begun;
 function frame(now){
  if(confettiCanvas!==canvas)return;
  const dt=Math.min(2.2,(now-last)/16.667||1);last=now;
  ctx.clearRect(0,0,width,height);
  for(const p of particles){
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gravity*dt;p.vx*=Math.pow(p.drag,dt);p.rotation+=p.spin*dt;
   if(p.y>height+30)continue;
   ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rotation);ctx.fillStyle=p.color;
   if(p.shape==='circle'){ctx.beginPath();ctx.arc(0,0,p.size*.55,0,Math.PI*2);ctx.fill();}
   else ctx.fillRect(-p.size/2,-p.size*.35,p.size,p.size*.7);
   ctx.restore();
  }
  if(now-begun<5800){confettiFrame=requestAnimationFrame(frame);}
  else stopConfetti();
 }
 confettiFrame=requestAnimationFrame(frame);
}
// One-by-one reveal: hundreds, tens, ones. Each settled digit stays fixed.
function spin(){
 if(spinning)return;
 const pool=remaining($('category').value);
 if(!pool.length){toast('No prizes left in this category.');return;}
 window.DoorPrizeAudio?.startSpin();
 stopConfetti();
 hideCongratulations();
 const chosen=pool[Math.floor(Math.random()*pool.length)];
 const targetDigits=padPrize(chosen.number).split('');
 const reels=[...document.querySelectorAll('.digit-reel')];
 const settled=[false,false,false];
 spinning=true;
 $('spin').disabled=true;$('slotLever').disabled=true;$('undo').disabled=true;
 $('slotLever').classList.add('pulled');
 $('reels').classList.remove('jackpot-flash','idle-glow');
 $('winner').classList.remove('winner-flash','ready-glow');
 reels.forEach(r=>{r.classList.remove('active','digit-stopped','digit-celebrate','blue','gold','red');r.classList.add('blue');});
 $('reels').classList.add('spinning');
 $('winner').textContent='DRAWING NUMBER…';
 $('winnerCategory').textContent='HUNDREDS → TENS → ONES';
 interval=setInterval(()=>{
  reels.forEach((r,i)=>{
   if(!settled[i])r.querySelector('.digit-number').textContent=Math.floor(Math.random()*10);
  });
 },70);
 function settleDigit(i){
  settled[i]=true;
  const reel=reels[i];
  reel.querySelector('.digit-number').textContent=targetDigits[i];
  reel.classList.add('digit-stopped');
  window.DoorPrizeAudio?.lockDigit(i);
  $('winnerCategory').textContent=['HUNDREDS LOCKED • WAIT FOR TENS','TENS LOCKED • WAIT FOR ONES','WINNING NUMBER REVEALED!'][i];
 }
 // The three digits stop separately, from left to right.
 [1550,2400,3250].forEach((delay,i)=>setTimeout(()=>settleDigit(i),delay));
 drawTimer=setTimeout(()=>{
  clearInterval(interval);interval=null;
  const actual=state.prizes.find(p=>p.id===chosen.id);
  if(!actual){window.DoorPrizeAudio?.returnToIdle();spinning=false;$('reels').classList.remove('spinning');$('slotLever').classList.remove('pulled');render();return;}
  actual.drawn=true;
  state.history.push({id:actual.id,number:actual.number,name:actual.name,color:actual.color,time:new Date().toISOString()});
  spinning=false;
  $('slotLever').classList.remove('pulled');
  $('reels').classList.remove('spinning');
  showReels(actual.color,actual.number);
  reels.forEach(r=>{r.classList.add('active','digit-stopped');r.classList.remove('digit-celebrate');});
  save();render();
  $('winner').textContent=padPrize(actual.number);
  $('winnerCategory').textContent=colors[actual.color]+' — '+actual.color.toUpperCase();
  // Keep the jackpot digits and marquee lights sparkling until the next draw.
  $('reels').classList.add('jackpot-flash');
  $('winner').classList.add('winner-flash');
  showCongratulations(actual.number); // Display and fade alongside confetti.
  celebrateWin(); // Burst right after the final digit stops.
  window.DoorPrizeAudio?.jackpot();
  const row=document.querySelector(`[data-number="${actual.number}"]`);
  row?.scrollIntoView({block:'nearest',behavior:'smooth'});
 },3400);
}
$('spin').onclick=spin;$('slotLever').onclick=spin;$('category').onchange=render;$('undo').onclick=()=>{if(spinning||!state.history.length)return;if(!confirm('Undo the most recent draw?'))return;stopConfetti();hideCongratulations();const h=state.history.pop();const p=state.prizes.find(p=>p.id===h.id);if(p)p.drawn=false;save();render();const prev=state.history.at(-1);showReels(prev?.color||'blue',prev?.number||0);$('reels').classList.toggle('jackpot-flash',!!prev);$('reels').classList.toggle('idle-glow',!prev);$('winner').classList.toggle('winner-flash',!!prev);$('winner').classList.toggle('ready-glow',!prev);if(!prev){$('winner').textContent='READY TO DRAW!';$('winnerCategory').textContent='Select a prize category and press SPIN';}toast('Last draw undone')};const open=id=>$(id).classList.add('open'),close=id=>$(id).classList.remove('open');$('manage').onclick=()=>{render();open('managerOverlay')};$('closeManager').onclick=()=>close('managerOverlay');$('historyBtn').onclick=()=>{const h=state.history;$('historyList').innerHTML=h.length?h.map((v,i)=>`<div class="history-item"><span>Draw #${i+1} · <b class="${v.color}-t">${esc(formatPrize(v))}</b> (${colors[v.color]})</span><span class="muted">${new Date(v.time).toLocaleString()}</span></div>`).reverse().join(''):'No draws yet.';open('historyOverlay')};$('closeHistory').onclick=()=>close('historyOverlay');let editingPrizeId=null,removingPrizeId=null;
function renderManageList(){
 const target=$('managePrizeList');if(!target)return;
 const q=($('prizeSearch')?.value||'').toLowerCase().trim(),filter=$('manageFilter')?.value||'all';
 const list=state.prizes.filter(p=>(filter==='all'||p.color===filter)&&(!q||String(p.number).includes(q)||(p.name||'').toLowerCase().includes(q)));
 target.innerHTML=list.length?list.map(p=>{
 const id=esc(String(p.id)),label=esc(p.name?.trim()||'(number only)'),isEditing=editingPrizeId===String(p.id),isRemoving=removingPrizeId===String(p.id);
 return `<div class="manage-row${isEditing?' row-editing':''}" data-prize-id="${id}">
 <span class="manage-number">#${p.number}</span><span class="manage-entry ${p.color}-t">${label} <small>· ${p.color.toUpperCase()} ${p.drawn?'· DRAWN':''}</small></span>
 <button type="button" class="secondary small-btn" data-action="edit" data-id="${id}" >EDIT</button>
 <button type="button" class="danger small-btn" data-action="remove" data-id="${id}" >REMOVE</button>
 </div>${isEditing?`<div class="manage-inline-form" data-prize-id="${id}"><label>Editing prize #${p.number} — leave blank for number only<input class="edit-name" type="text" maxlength="160" value="${esc(p.name||'')}" placeholder="Optional — number only" aria-label="Prize name (optional)"></label><label>Category<select class="edit-color" aria-label="Prize category"><option value="blue" ${p.color==='blue'?'selected':''}>🔵 Blue / Grand</option><option value="gold" ${p.color==='gold'?'selected':''}>🟡 Gold / Major</option><option value="red" ${p.color==='red'?'selected':''}>🔴 Red / Regular</option></select></label><button type="button" data-action="save" data-id="${id}">SAVE CHANGES</button><button type="button" class="secondary" data-action="cancel" data-id="${id}">CANCEL</button></div>`:''}
 ${isRemoving?`<div class="manage-remove-confirm" data-prize-id="${id}"><span>Remove <b>#${p.number}.) ${label}</b> permanently?</span><button type="button" class="danger" data-action="confirm-remove" data-id="${id}">YES, REMOVE</button><button type="button" class="secondary" data-action="cancel" data-id="${id}">CANCEL</button></div>`:''}`;
 }).join(''):'<p style="padding:12px">No matching prizes.</p>';
}
let pendingRemoveColor=null;
function updateRemoveColorCount(){
 const selected=$('removeColorSelect').value;
 const entries=state.prizes.filter(p=>p.color===selected);
 const drawn=entries.filter(p=>p.drawn).length;
 $('removeColorCount').textContent=`${entries.length} ${selected.toUpperCase()} prizes (${drawn} already drawn) will be removed. Other colors will remain untouched.`;
 $('removeColorPrizes').disabled=spinning||entries.length===0;
 if(pendingRemoveColor && pendingRemoveColor!==selected){pendingRemoveColor=null;$('colorRemoveConfirm').hidden=true;}
 if(!entries.length){pendingRemoveColor=null;$('colorRemoveConfirm').hidden=true;}
}
$('removeColorSelect').addEventListener('change',()=>{pendingRemoveColor=null;$('colorRemoveConfirm').hidden=true;updateRemoveColorCount();});
$('removeColorPrizes').addEventListener('click',()=>{
 if(spinning){toast('Finish the spin before removing prizes.');return;}
 const color=$('removeColorSelect').value;
 const entries=state.prizes.filter(p=>p.color===color);
 if(!entries.length){toast('No prizes left in this color.');return;}
 pendingRemoveColor=color;
 const drawn=entries.filter(p=>p.drawn).length;
 $('colorRemoveWarning').textContent=`Delete all ${entries.length} ${color.toUpperCase()} prizes${drawn?' (including '+drawn+' drawn prizes and their history)':''}? Other colors will remain. This cannot be undone without a backup.`;
 $('colorRemoveConfirm').hidden=false;
 $('confirmColorRemoval').focus();
});
$('cancelColorRemoval').addEventListener('click',()=>{pendingRemoveColor=null;$('colorRemoveConfirm').hidden=true;});
$('confirmColorRemoval').addEventListener('click',()=>{
 if(spinning||!pendingRemoveColor)return;
 const color=pendingRemoveColor;
 const entries=state.prizes.filter(p=>p.color===color);
 if(!entries.length){pendingRemoveColor=null;$('colorRemoveConfirm').hidden=true;updateRemoveColorCount();return;}
 const ids=new Set(entries.map(p=>String(p.id)));
 state.prizes=state.prizes.filter(p=>p.color!==color);
 state.history=state.history.filter(h=>!ids.has(String(h.id)));
 pendingRemoveColor=null;
 $('colorRemoveConfirm').hidden=true;
 editingPrizeId=null;removingPrizeId=null;
 save();render();
 const last=state.history.at(-1);
 if(last){showReels(last.color,last.number);$('winner').textContent=padPrize(last.number);$('winnerCategory').textContent=colors[last.color];}
 else{$('winner').textContent='READY TO DRAW!';$('winnerCategory').textContent='Select category and spin';showReels('blue',0);}
 toast(`Removed ${entries.length} ${color.toUpperCase()} prizes successfully`);
});
$('prizeSearch').oninput=renderManageList;$('manageFilter').onchange=renderManageList;
$('managePrizeList').addEventListener('click',e=>{
 const b=e.target.closest('button[data-action]');if(!b||spinning||b.disabled)return;
 const id=b.dataset.id,action=b.dataset.action,p=state.prizes.find(p=>String(p.id)===id);
 if(action==='cancel'){editingPrizeId=null;removingPrizeId=null;renderManageList();return;}
 if(!p){toast('Prize not found. Please refresh the list.');return;}
 
 if(action==='edit'){
  editingPrizeId=id;removingPrizeId=null;renderManageList();
  const form=[...$('managePrizeList').querySelectorAll('.manage-inline-form')].find(f=>f.dataset.prizeId===id);
  form?.querySelector('.edit-name')?.focus();form?.scrollIntoView({block:'nearest',behavior:'smooth'});return;
 }
 if(action==='remove'){removingPrizeId=id;editingPrizeId=null;renderManageList();const row=[...$('managePrizeList').querySelectorAll('.manage-remove-confirm')].find(f=>f.dataset.prizeId===id);row?.scrollIntoView({block:'nearest',behavior:'smooth'});return;}
 if(action==='save'){
  const form=[...$('managePrizeList').querySelectorAll('.manage-inline-form')].find(f=>f.dataset.prizeId===id);
  if(!form)return;
  const name=form.querySelector('.edit-name').value.trim(),color=form.querySelector('.edit-color').value;
  
  if(!colors[color]){toast('Choose a valid category.');return;}
  p.name=name; p.color=color;if(p.drawn){state.history.forEach(h=>{if(h.id===p.id){h.name=name;h.color=color;}})}editingPrizeId=null;save();render();toast(name?`Prize #${p.number} updated successfully`:`Prize #${p.number} saved as number only`);return;
 }
 if(action==='confirm-remove'){
  state.prizes=state.prizes.filter(item=>String(item.id)!==id);
  state.history=state.history.filter(h=>String(h.id)!==id);
  removingPrizeId=null;save();render();if(!state.history.length){showReels('blue',0);$('winner').textContent='READY TO DRAW!';$('winnerCategory').textContent='Select category and spin'}toast(`Prize #${p.number} removed successfully`);
 }
});
$('addPrize').onclick=()=>{try{const raw=$('prizeNumber').value.trim(),number=raw===''?null:Number(raw);add($('prizeName').value.trim(),$('prizeColor').value,Number($('quantity').value),number);save();render();$('prizeName').value='';$('prizeNumber').value='';toast('Prize entries added')}catch(e){toast(e.message)}};$('import').onclick=()=>{const lines=$('bulk').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(!lines.length){toast('Enter prizes to import');return}const entries=[];try{for(const [i,line] of lines.entries()){const parts=line.split(',').map(s=>s.trim());if(parts.length<2||parts.length>3)throw Error('Line '+(i+1)+': use Prize Name, Color, Quantity');const [name,colorRaw,nRaw]=parts;const color=colorRaw.toLowerCase();const n=nRaw?Number(nRaw):1;if(!colors[color]||!Number.isInteger(n)||n<1||n>10000)throw Error('Invalid data on line '+(i+1));entries.push({name,color,n})}if(state.prizes.length+entries.reduce((s,e)=>s+e.n,0)>999)throw Error('Maximum 999 entries for three-digit reels');entries.forEach(e=>add(e.name,e.color,e.n));save();render();$('bulk').value='';toast('Imported '+lines.length+' prize types')}catch(e){toast(e.message)}};function download(name,data,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([data],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}$('export').onclick=()=>download('door-prizes-backup.json',JSON.stringify(state,null,2),'application/json');$('restore').onclick=()=>$('backupFile').click();$('backupFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const v=JSON.parse(await file.text());if(!Array.isArray(v.prizes)||!Array.isArray(v.history)||v.prizes.length>999||!v.prizes.every(p=>typeof p.id==='string'&&typeof p.name==='string'&&colors[p.color]&&typeof p.drawn==='boolean'))throw Error('Invalid backup');if(!confirm('Replace current prize list and draw history with this backup?'))return;state=v;if(!Number.isInteger(state.nextNumber))state.nextNumber=Math.max(0,...state.prizes.map(p=>Number(p.number)||0))+1;const existing=new Set();state.prizes.forEach(p=>{if(!Number.isInteger(p.number)||p.number<1||existing.has(p.number))p.number=state.nextNumber++;existing.add(p.number)});state.nextNumber=Math.max(state.nextNumber,...state.prizes.map(p=>p.number+1),1);save();render();toast('Backup restored')}catch(err){toast(err.message)}e.target.value=''};function removeEverything(){
 hideCongratulations();
 stopConfetti();
 if(spinning){toast('Finish the spin before removing prizes.');return;}
 state={prizes:[],history:[],nextNumber:1};
 editingPrizeId=null;removingPrizeId=null;pendingRemoveColor=null;
 $('colorRemoveConfirm').hidden=true;
 $('removeAllConfirm').hidden=true;
 $('prizeSearch').value='';$('manageFilter').value='all';
 save();render();showReels('blue',0);$('reels').classList.remove('jackpot-flash');$('reels').classList.add('idle-glow');$('winner').classList.remove('winner-flash');$('winner').classList.add('ready-glow');
 $('winner').textContent='READY TO DRAW!';$('winnerCategory').textContent='Add prizes to begin';
 toast('All prizes removed. New numbering starts at #1.');
}
$('removeAllPrizes').onclick=()=>{
 if(spinning){toast('Finish the spin before removing prizes.');return;}
 $('removeAllWarning').textContent=`Remove ALL ${state.prizes.length} prizes and ${state.history.length} draw records? The next added prize will start at #1. This cannot be undone without a backup.`;
 $('removeAllConfirm').hidden=false;
 $('confirmRemoveAll').focus();
};
$('confirmRemoveAll').onclick=removeEverything;
$('cancelRemoveAll').onclick=()=>{$('removeAllConfirm').hidden=true;};
$('clear').onclick=()=>{
 if(spinning){toast('Finish the spin before resetting.');return;}
 $('removeAllWarning').textContent='RESET ALL DATA? Delete ALL prizes and draw history. New numbering starts at #1. Export your backup first if needed.';
 $('removeAllConfirm').hidden=false;
 $('confirmRemoveAll').focus();
};
$('downloadHistory').onclick=()=>{const rows=[['Draw #','Prize Number','Prize','Category','Date/Time'],...state.history.map((h,i)=>[i+1,h.number||'',h.name,h.color,h.time])];download('door-prize-draw-history.csv',rows.map(row=>row.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\r\n'),'text/csv')};$('full').onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};document.addEventListener('keydown',e=>{if(e.key==='Escape'){close('managerOverlay');close('historyOverlay')}if(e.code==='Space'&&!e.repeat&&!document.querySelector('.overlay.open')&&!['INPUT','TEXTAREA','SELECT','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();spin()}});save();render();const startupLast=state.history.at(-1);showReels(startupLast?.color||'blue',startupLast?.number||0);$('reels').classList.toggle('jackpot-flash',!!startupLast);$('reels').classList.toggle('idle-glow',!startupLast);$('winner').classList.toggle('winner-flash',!!startupLast);if(!state.prizes.length){$('winner').textContent='NO PRIZES YET';$('winnerCategory').textContent='Open Manage Prizes to add your first prize';}})();
