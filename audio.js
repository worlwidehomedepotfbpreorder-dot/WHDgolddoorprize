/* Original, synthesized slot-machine sounds. No external audio downloads or licensed tracks. */
(()=>{'use strict';
 const AudioContextClass=window.AudioContext||window.webkitAudioContext;
 const toggle=document.getElementById('soundToggle');
 const slider=document.getElementById('soundVolume');
 const label=document.getElementById('volumeLabel');
 if(!toggle||!slider||!label)return;
 let ctx=null,master=null,enabled=false,mode='idle',timer=null,returnTimer=null,sequence=0,started=false;
 let volume=Number(slider.value)/100;
 try{const pref=JSON.parse(localStorage.getItem('worldwide-slot-audio-preferences-v1')||'{}');if(typeof pref.volume==='number'&&pref.volume>=0&&pref.volume<=1)volume=pref.volume;if(pref.enabled===true)enabled=true;}catch{}
 slider.value=String(Math.round(volume*100));
 const savePrefs=()=>{try{localStorage.setItem('worldwide-slot-audio-preferences-v1',JSON.stringify({enabled,volume}));}catch{}};
 function updateUI(){toggle.textContent=enabled?'🔊 SOUND ON':'🔇 ENABLE SOUND';toggle.setAttribute('aria-pressed',String(enabled));label.textContent=Math.round(volume*100)+'%';}
 function setup(){
  if(!AudioContextClass){toggle.textContent='🔇 SOUND UNAVAILABLE';toggle.disabled=true;return false;}
  if(!ctx){ctx=new AudioContextClass();master=ctx.createGain();master.gain.value=volume*.25;master.connect(ctx.destination);}
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  return true;
 }
 function note(freq,duration=.13,type='sine',level=.20,when=0){
  if(!ctx||!master||!enabled)return;
  const now=ctx.currentTime+when;
  const oscillator=ctx.createOscillator(),envelope=ctx.createGain();
  oscillator.type=type;oscillator.frequency.setValueAtTime(Math.max(30,freq),now);
  envelope.gain.setValueAtTime(.0001,now);
  envelope.gain.exponentialRampToValueAtTime(Math.max(.0002,level),now+.015);
  envelope.gain.exponentialRampToValueAtTime(.0001,now+duration);
  oscillator.connect(envelope);envelope.connect(master);oscillator.start(now);oscillator.stop(now+duration+.025);
 }
 function clear(){if(timer!==null){clearInterval(timer);timer=null;}if(returnTimer!==null){clearTimeout(returnTimer);returnTimer=null;}}
 // An original upbeat arcade-attract-mode loop (not a recording or copyrighted melody).
 // 120 BPM, 4 bars of 16th notes; chip lead, arpeggio, bass, kick, and hi-hat.
 const midi=n=>440*Math.pow(2,(n-69)/12);
 const arcadeLead=[
  76,null,79,83, 81,null,79,76, 74,null,76,79, 81,79,76,null,
  76,79,83,null, 86,83,81,79, 76,null,74,76, 79,null,74,null,
  74,null,78,81, 83,null,81,78, 76,null,74,71, 74,76,78,null,
  79,83,86,83, 81,null,79,76, 78,76,74,null, 71,74,76,null
 ];
 const chordRoots=[48,45,50,43]; // C, A, D, G: a looping arcade progression.
 function arcadeStep(){
  if(!enabled||!started||mode!=='idle')return;
  const index=sequence%64,bar=Math.floor(index/16),pos=index%16,root=chordRoots[bar];
  const lead=arcadeLead[index];
  if(lead!==null){
   note(midi(lead),.105,'square',.115);
   note(midi(lead+12),.078,'sine',.045,.012);
  }
  if(pos%2===0){
   const arpeggio=[0,7,12,7,4,7,12,7][(pos/2)%8];
   note(midi(root+12+arpeggio),.105,'triangle',.067);
  }
  if(pos%4===0){
   const bass=[0,0,7,0][pos/4];
   note(midi(root-12+bass),.205,'triangle',.17);
   note(68,.085,'sine',.22);
  }
  if(pos===4||pos===12){
   note(205,.055,'triangle',.080);
  }
  if(pos%2===0){
   note(6000,.022,'square',.018);
  }
  sequence++;
 }
 function startIdle(){
  clear();mode='idle';if(!enabled||!started)return;
  // Attract-mode music loops while the kiosk is waiting, even with no prizes.
  sequence=0;arcadeStep();timer=setInterval(arcadeStep,125);
 }
 function startSpin(){
  if(!enabled){ // First press of SPIN also counts as a gesture and enables audio unless explicitly muted.
   if(!explicitlyMuted){enabled=true;updateUI();savePrefs();}
  }
  if(!enabled||!setup())return;
  started=true;clear();mode='spin';let tick=0;
  note(261.63,.18,'triangle',.24);note(392,.20,'triangle',.15,.07);
  timer=setInterval(()=>{
   if(mode!=='spin'||!enabled)return;
   const pitches=[392,466.16,523.25,587.33,659.26,698.46,783.99,880];
   note(pitches[tick%pitches.length],.065,'square',.12);
   if(tick%3===0)note(196,.075,'triangle',.10);
   tick++;
  },102);
 }
 function lockDigit(index){
  if(!enabled||!started)return;
  // A crisp mechanical stop + chime on each settled reel.
  note(260+index*105,.11,'triangle',.26);
  note([523.25,659.26,783.99][index],.30,'sine',.30,.06);
 }
 function jackpot(){
  if(!enabled||!started)return;
  clear();mode='win';
  // Original short rising fanfare, then resume the quiet standby melody.
  const notes=[523.25,659.26,783.99,1046.5,1318.51,1567.98];
  notes.forEach((f,i)=>note(f,.30,'triangle',.30,i*.16));
  [523.25,659.26,783.99,1046.5].forEach(f=>note(f,1.25,'sine',.20,1.05));
  [1046.5,1318.51,1567.98,2093].forEach((f,i)=>note(f,.27,'sine',.16,2.15+i*.22));
  returnTimer=setTimeout(startIdle,4000);
 }
 function returnToIdle(){if(enabled&&started)startIdle();}
 let explicitlyMuted=false;
 toggle.addEventListener('click',()=>{
  if(enabled){enabled=false;explicitlyMuted=true;clear();updateUI();savePrefs();if(master&&ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.04);return;}
  enabled=true;explicitlyMuted=false;if(!setup()){enabled=false;return;}
  master.gain.setTargetAtTime(volume*.25,ctx.currentTime,.04);started=true;updateUI();savePrefs();startIdle();
 });
 slider.addEventListener('input',()=>{volume=Number(slider.value)/100;label.textContent=Math.round(volume*100)+'%';if(master&&ctx)master.gain.setTargetAtTime(enabled?volume*.25:0,ctx.currentTime,.035);savePrefs();});
 // Browser autoplay restrictions: do not attempt to start audio on page load.
 // If sound was enabled previously, the user's first interaction resumes it.
 document.addEventListener('pointerdown',e=>{
  if(started||!enabled||e.target===toggle)return;
  if(setup()){started=true;updateUI();startIdle();}
 },{capture:true});
 document.addEventListener('keydown',()=>{if(!started&&enabled&&setup()){started=true;startIdle();}},{capture:true});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){clear();if(ctx)ctx.suspend().catch(()=>{});}
  else if(enabled&&started&&ctx){ctx.resume().catch(()=>{});if(mode!=='spin')startIdle();}
 });
 // Sound is off by default on first visit; it can be enabled with the sound button or SPIN.
 updateUI();
 window.DoorPrizeAudio={startSpin,lockDigit,jackpot,returnToIdle};
})();
