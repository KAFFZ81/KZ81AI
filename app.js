const $ = (s) => document.querySelector(s);
const state = { mode: "chat", messages: [], busy: false, image: null };
const modeInfo = {
  chat: ["Chat AI", "✦ Tanyakan apa saja kepada KZ81 AI"],
  summary: ["Ringkas Materi", "▤ Ringkas teks panjang menjadi poin penting"],
  solver: ["Pemecah Soal", "∑ Dapatkan penjelasan dan langkah penyelesaian"],
  writer: ["Penulis Tugas", "✎ Buat draft tulisan yang rapi dan terstruktur"],
  quiz: ["Kuis & Flashcard", "▣ Ubah materi menjadi soal latihan"]
};
const prompts = {
  chat: "Kamu adalah KZ81 AI, asisten belajar dan kreativitas yang ramah, jelas, teliti, dan menjawab dalam bahasa Indonesia kecuali diminta lain.",
  summary: "Kamu adalah asisten belajar. Ringkas materi berikut dalam bahasa Indonesia. Berikan inti materi, poin-poin penting, istilah kunci, dan kesimpulan. Jangan mengarang informasi yang tidak ada di materi.",
  solver: "Kamu adalah tutor yang sabar. Selesaikan soal berikut dengan langkah-langkah runtut, rumus yang dipakai, substitusi angka bila ada, dan jawaban akhir. Jelaskan dengan bahasa Indonesia yang mudah dipahami.",
  writer: "Kamu adalah asisten penulisan. Buat draft tugas yang orisinal, terstruktur, sesuai instruksi, dan berbahasa Indonesia yang baik. Jangan mengarang sumber atau kutipan.",
  quiz: "Buat kuis belajar dari materi yang diberikan. Buat 5 soal pilihan ganda dengan 4 opsi, kunci jawaban, dan penjelasan singkat di bagian akhir."
};
const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function switchMode(mode){
  state.mode=mode;
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
  $("#pageName").textContent=modeInfo[mode]?.[0] || (mode==="poster"?"Studio Poster":"Editor Gambar");
  const chat=mode in modeInfo;
  $("#chatWorkspace").classList.toggle("hidden",!chat);
  $("#toolWorkspace").classList.toggle("hidden",chat);
  if(chat){$("#modeHint").textContent=modeInfo[mode][1];$("#promptInput").placeholder=mode==="chat"?"Tulis pesan untuk KZ81 AI...":"Tempel materi atau tulis instruksi di sini...";}
  else renderTool(mode);
  $("#sidebar").classList.remove("open");
}
function renderMessages(){
  const box=$("#messages");box.innerHTML="";
  state.messages.forEach(m=>{
    const row=document.createElement("div");row.className="message "+m.role;
    row.innerHTML=`<div class="message-avatar">${m.role==="user"?"K":"✦"}</div><div class="message-body">${escapeHTML(m.text)}</div>`;
    box.appendChild(row);
  });
  box.classList.toggle("has-messages",state.messages.length>0);
  $("#welcome").classList.toggle("hidden",state.messages.length>0);
  box.scrollTop=box.scrollHeight;
}
function saveHistory(){
  try{localStorage.setItem("kz81_current",JSON.stringify(state.messages));localStorage.setItem("kz81_history",JSON.stringify(state.messages.length?[{title:state.messages.find(m=>m.role==="user")?.text.slice(0,42)||"Percakapan",messages:state.messages}]:[]));}catch(e){}
  renderHistory();
}
function renderHistory(){
  let list=[];try{list=JSON.parse(localStorage.getItem("kz81_history")||"[]")}catch(e){}
  $("#historyList").innerHTML=list.length?list.slice(0,8).map((x,i)=>`<button class="history-entry" data-index="${i}">◦ ${escapeHTML(x.title)}</button>`).join(""):'<p class="empty-history">Belum ada percakapan.</p>';
}
async function askAI(text, mode=state.mode){
  if(state.busy)return;
  state.messages.push({role:"user",text});renderMessages();saveHistory();
  state.busy=true;$("#sendBtn").disabled=true;
  const loading=document.createElement("div");loading.className="message";loading.id="loading";
  loading.innerHTML='<div class="message-avatar">✦</div><div class="message-body typing">KZ81 AI sedang berpikir...</div>';$("#messages").appendChild(loading);
  try{
    const recent=state.messages.slice(-14).map(m=>({role:m.role==="assistant"?"model":"user",parts:[{text:m.text}]}));
    const response=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode,instruction:prompts[mode]||prompts.chat,messages:recent})});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"Permintaan AI gagal.");
    state.messages.push({role:"assistant",text:data.text||"Tidak ada jawaban dari AI."});
  }catch(err){state.messages.push({role:"assistant",text:"Maaf, belum bisa menghubungi AI.\n\n"+err.message+"\n\nPastikan secret GEMINI_API_KEY sudah ditambahkan di Cloudflare Pages, lalu deploy ulang."});}
  finally{state.busy=false;$("#sendBtn").disabled=false;renderMessages();saveHistory();}
}
$("#chatForm").addEventListener("submit",e=>{e.preventDefault();const t=$("#promptInput").value.trim();if(!t)return;$("#promptInput").value="";$("#promptInput").style.height="auto";askAI(t);});
$("#promptInput").addEventListener("input",e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,160)+"px";});
$("#newChat").onclick=()=>{state.messages=[];renderMessages();saveHistory();};
$("#clearHistory").onclick=()=>{localStorage.removeItem("kz81_history");localStorage.removeItem("kz81_current");state.messages=[];renderMessages();renderHistory();toast("Riwayat dihapus.");};
$("#historyList").addEventListener("click",e=>{const b=e.target.closest("[data-index]");if(!b)return;const h=JSON.parse(localStorage.getItem("kz81_history")||"[]")[Number(b.dataset.index)];if(h){state.messages=h.messages||[];renderMessages();switchMode("chat");}});
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>switchMode(b.dataset.mode));
document.querySelectorAll(".quick-card").forEach(b=>b.onclick=()=>{if(b.dataset.mode)switchMode(b.dataset.mode);$("#promptInput").value=b.dataset.prompt||"";$("#promptInput").focus();});
$("#menuToggle").onclick=()=>$("#sidebar").classList.toggle("open");
function renderTool(mode){
  const titles={poster:"Studio Poster",image:"Editor Gambar"};
  const desc={poster:"Rancang poster sederhana dan simpan sebagai PNG.",image:"Edit foto langsung di browser. Gambar tidak diunggah ke server."};
  $("#toolTitle").textContent=titles[mode];$("#toolDescription").textContent=desc[mode];
  if(mode==="poster"){
    $("#toolContent").innerHTML=`<div class="tool-card"><label>Judul poster</label><input id="posterTitle" value="MAKE IT HAPPEN"><label style="margin-top:14px">Teks pendukung</label><textarea id="posterText">Belajar hari ini, sukses di masa depan.\nTetap fokus dan terus berkembang.</textarea><div class="tool-actions"><button class="primary-btn" id="posterUpdate">Perbarui desain</button><button class="secondary-btn" id="posterDownload">Unduh PNG</button></div><div class="poster-preview" id="posterPreview"><div><div class="poster-tag">KAFFZ81 • CREATIVE STUDIO</div><h2>MAKE IT HAPPEN</h2><p>Belajar hari ini, sukses di masa depan.\nTetap fokus dan terus berkembang.</p></div></div></div>`;
    const update=()=>{$("#posterPreview").querySelector("h2").textContent=$("#posterTitle").value;$("#posterPreview").querySelector("p").textContent=$("#posterText").value;};
    $("#posterUpdate").onclick=update;$("#posterDownload").onclick=()=>downloadPoster();
  }else{
    $("#toolContent").innerHTML=`<div class="tool-card"><label>Pilih gambar dari perangkat</label><input type="file" id="imageFile" accept="image/*"><div id="imageControls" class="hidden"><div class="range-row"><span>Kecerahan</span><input type="range" id="bright" min="0" max="200" value="100"><b id="brightVal">100%</b></div><div class="range-row"><span>Kontras</span><input type="range" id="contrast" min="0" max="200" value="100"><b id="contrastVal">100%</b></div><div class="range-row"><span>Saturasi</span><input type="range" id="saturate" min="0" max="200" value="100"><b id="saturateVal">100%</b></div><div class="tool-actions"><button class="secondary-btn" id="gray">Grayscale</button><button class="secondary-btn" id="sepia">Sepia</button><button class="secondary-btn" id="resetImage">Reset</button><button class="primary-btn" id="saveImage">Unduh PNG</button></div><canvas id="imageCanvas" class="editor-canvas"></canvas></div></div>`;
    $("#imageFile").onchange=loadImage;
  }
}
function downloadPoster(){
  const canvas=document.createElement("canvas");canvas.width=900;canvas.height=1125;const c=canvas.getContext("2d");
  const g=c.createLinearGradient(0,0,900,1125);g.addColorStop(0,"#28204f");g.addColorStop(1,"#080d1c");c.fillStyle=g;c.fillRect(0,0,900,1125);
  c.strokeStyle="#d8b86d";c.lineWidth=3;c.strokeRect(42,42,816,1041);
  c.textAlign="center";c.fillStyle="#b9a9ff";c.font="600 22px sans-serif";c.fillText("KAFFZ81 • CREATIVE STUDIO",450,250);
  c.fillStyle="#f1d18b";c.font="bold 76px sans-serif";wrapCanvas(c,$("#posterTitle").value,450,470,760,92);
  c.fillStyle="#d5d8e7";c.font="30px sans-serif";wrapCanvas(c,$("#posterText").value,450,660,700,48);
  const a=document.createElement("a");a.download="KZ81-poster.png";a.href=canvas.toDataURL("image/png");a.click();
}
function wrapCanvas(c,text,x,y,maxWidth,lineHeight){let lines=[];String(text).split("\n").forEach(part=>{let words=part.split(" "),line="";words.forEach(w=>{let test=line?line+" "+w:w;if(c.measureText(test).width>maxWidth&&line){lines.push(line);line=w}else line=test});lines.push(line)});let yy=y-(lines.length-1)*lineHeight/2;lines.forEach(l=>{c.fillText(l,x,yy);yy+=lineHeight})}
let imgObj=null,filterExtra="";
function loadImage(e){const f=e.target.files[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{imgObj=new Image();imgObj.onload=()=>{$("#imageControls").classList.remove("hidden");filterExtra="";drawImage()};imgObj.src=reader.result};reader.readAsDataURL(f)}
function drawImage(){if(!imgObj)return;const canvas=$("#imageCanvas");const scale=Math.min(1,1200/imgObj.width,700/imgObj.height);canvas.width=Math.round(imgObj.width*scale);canvas.height=Math.round(imgObj.height*scale);const c=canvas.getContext("2d");c.filter=`brightness(${$("#bright").value}%) contrast(${$("#contrast").value}%) saturate(${$("#saturate").value}%) ${filterExtra}`;c.drawImage(imgObj,0,0,canvas.width,canvas.height);["bright","contrast","saturate"].forEach(id=>$("#"+id+"Val").textContent=$("#"+id).value+"%")}
["bright","contrast","saturate"].forEach(id=>document.addEventListener("input",e=>{if(e.target.id===id)drawImage()}));
["gray","sepia"].forEach(id=>document.addEventListener("click",e=>{if(e.target.id===id){filterExtra=id==="gray"?"grayscale(1)":"sepia(1)";drawImage()}}));
document.addEventListener("click",e=>{if(e.target.id==="resetImage"){["bright","contrast","saturate"].forEach(id=>$("#"+id).value=100);filterExtra="";drawImage()}if(e.target.id==="saveImage"){const a=document.createElement("a");a.download="KZ81-edit.png";a.href=$("#imageCanvas").toDataURL("image/png");a.click()}});
renderHistory();