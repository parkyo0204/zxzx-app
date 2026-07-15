var o=Object.defineProperty;var l=(i,e,t)=>e in i?o(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t;var s=(i,e,t)=>l(i,typeof e!="symbol"?e+"":e,t);class h{constructor(e,t,n,r={}){s(this,"files",[]);s(this,"dropzone");s(this,"fileInput");s(this,"previewContainer");s(this,"infoBar",null);s(this,"options");this.dropzone=document.getElementById(e),this.fileInput=document.getElementById(t),this.previewContainer=document.getElementById(n),this.options={maxFiles:r.maxFiles??30,maxFileSize:r.maxFileSize??20*1024*1024,onFilesChanged:r.onFilesChanged??(()=>{})},this.init()}init(){this.infoBar=document.createElement("div"),this.infoBar.className="file-info-bar",this.infoBar.style.display="none",this.previewContainer.before(this.infoBar),this.dropzone.addEventListener("click",e=>{e.target.closest("button")||this.fileInput.click()}),this.dropzone.addEventListener("dragover",e=>{e.preventDefault(),e.stopPropagation(),this.dropzone.classList.add("dragover")}),this.dropzone.addEventListener("dragleave",e=>{e.preventDefault(),e.stopPropagation(),this.dropzone.contains(e.relatedTarget)||this.dropzone.classList.remove("dragover")}),this.dropzone.addEventListener("drop",e=>{e.preventDefault(),e.stopPropagation(),this.dropzone.classList.remove("dragover"),this.dropzone.classList.add("drop-success"),setTimeout(()=>this.dropzone.classList.remove("drop-success"),600),this.addFiles(Array.from(e.dataTransfer.files))}),this.fileInput.addEventListener("change",()=>{this.addFiles(Array.from(this.fileInput.files)),this.fileInput.value=""}),window.addEventListener("dragover",e=>e.preventDefault()),window.addEventListener("drop",e=>e.preventDefault())}addFiles(e){const t=e.filter(n=>!(!n.type.startsWith("image/")||n.size>this.options.maxFileSize));this.files=[...this.files,...t].slice(0,this.options.maxFiles),this.render(),this.options.onFilesChanged(this.files)}removeFile(e){this.files.splice(e,1),this.render(),this.options.onFilesChanged(this.files)}clearAll(){this.files=[],this.render(),this.options.onFilesChanged(this.files)}getFiles(){return this.files}render(){this.renderInfoBar(),this.renderPreviews()}renderInfoBar(){if(!this.infoBar)return;if(this.files.length===0){this.infoBar.style.display="none";return}const e=this.files.reduce((t,n)=>t+n.size,0);this.infoBar.style.display="flex",this.infoBar.innerHTML=`
      <div class="file-info-stats">
        <span class="file-count">${this.files.length}개 파일</span>
        <span class="file-divider">·</span>
        <span class="file-size-total">${a(e)}</span>
      </div>
      <button class="btn-clear-all" title="전체 삭제">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z"/>
        </svg>
        전체 삭제
      </button>
    `,this.infoBar.querySelector(".btn-clear-all").addEventListener("click",()=>this.clearAll())}renderPreviews(){this.previewContainer.innerHTML=this.files.map((e,t)=>`
      <div class="preview-item" data-index="${t}">
        <div class="preview-img-wrap">
          <img src="${URL.createObjectURL(e)}" alt="${e.name}" loading="lazy">
          <button class="btn-remove" data-index="${t}" title="파일 제거" aria-label="파일 제거">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3l8 8M11 3l-8 8"/>
            </svg>
          </button>
        </div>
        <div class="info">
          <div class="info-name" title="${e.name}">${e.name}</div>
          <div class="info-meta">${a(e.size)}</div>
          <div class="info-result" id="result-${t}"></div>
        </div>
      </div>
    `).join(""),this.previewContainer.querySelectorAll(".btn-remove").forEach(e=>{e.addEventListener("click",t=>{t.stopPropagation();const n=parseInt(e.dataset.index);this.removeFile(n)})})}}function a(i){return i<1024?i+" B":i<1024*1024?(i/1024).toFixed(1)+" KB":(i/(1024*1024)).toFixed(2)+" MB"}class c{constructor(e){s(this,"container");s(this,"bar");s(this,"text");this.container=document.createElement("div"),this.container.className="progress-wrap",this.container.style.display="none",this.container.innerHTML=`
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <span class="progress-text">0%</span>
    `,document.getElementById(e).after(this.container),this.bar=this.container.querySelector(".progress-fill"),this.text=this.container.querySelector(".progress-text")}show(){this.container.style.display="flex",this.set(0)}hide(){this.container.style.display="none"}set(e){const t=Math.min(100,Math.max(0,e));this.bar.style.width=`${t}%`,this.text.textContent=`${Math.round(t)}%`}}export{h as F,c as P,a as f};
