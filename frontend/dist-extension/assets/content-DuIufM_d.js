var e=class{lastTrigger=0;onKeydown(e,t){let n=Date.now();if(n-this.lastTrigger<200)return;let r=e.target,i=r.value||r.innerText||``;e.key===`Enter`&&t&&(this.lastTrigger=n,t(i))}},t=`ai-suggestions-overlay`,n=null;function r(e){i(),a(),n=document.createElement(`div`),n.id=t,n.className=`ai-overlay`;let r=`
    <div class="ai-overlay-content">
      <div class="ai-header">
        <span class="ai-title">✨ Writing Suggestions</span>
        <button class="ai-close" onclick="removeOverlay()">×</button>
      </div>
      
      <div class="ai-analysis">
        <div class="ai-metric">
          <span>Grammar: <strong>${e.analysis.grammarScore}%</strong></span>
          <div class="ai-bar" style="width: ${e.analysis.grammarScore}%"></div>
        </div>
        <div class="ai-metric">
          <span>Clarity: <strong>${e.analysis.clarityScore}%</strong></span>
          <div class="ai-bar" style="width: ${e.analysis.clarityScore}%"></div>
        </div>
      </div>

      <div class="ai-suggestions">
        ${e.suggestions.slice(0,3).map((e,t)=>`
          <div class="ai-suggestion" data-index="${t}">
            <div class="ai-reason">${e.reason}</div>
            <div class="ai-text">"${e.originalText}" → "${e.suggestion}"</div>
          </div>
        `).join(``)}
      </div>

      <div class="ai-footer">
        <p class="ai-tone">Tone: <strong>${e.analysis.toneAnalysis}</strong></p>
      </div>
    </div>
  `;n.innerHTML=r,n.style.position=`fixed`,n.style.left=e.position.x+`px`,n.style.top=e.position.y+`px`,n.style.zIndex=`999999`,document.body.appendChild(n),n.querySelectorAll(`.ai-suggestion`).forEach(e=>{e.addEventListener(`click`,()=>{i()})})}function i(){n&&=(n.remove(),null)}function a(){if(document.getElementById(`ai-overlay-styles`))return;let e=document.createElement(`style`);e.id=`ai-overlay-styles`,e.textContent=`
    #ai-suggestions-overlay {
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #1f2937;
      max-width: 400px;
      padding: 0;
      animation: slideUp 0.2s ease-out;
    }

    .ai-overlay-content {
      padding: 16px;
    }

    .ai-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .ai-title {
      font-weight: 600;
      font-size: 14px;
    }

    .ai-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #6b7280;
    }

    .ai-analysis {
      margin-bottom: 12px;
    }

    .ai-metric {
      margin-bottom: 8px;
      font-size: 12px;
    }

    .ai-bar {
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      margin-top: 4px;
      background: linear-gradient(90deg, #10b981, #3b82f6);
    }

    .ai-suggestions {
      margin-bottom: 12px;
    }

    .ai-suggestion {
      padding: 8px;
      background: #f9fafb;
      border-radius: 4px;
      margin-bottom: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .ai-suggestion:hover {
      background: #e5e7eb;
    }

    .ai-reason {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
    }

    .ai-text {
      font-size: 13px;
      margin-top: 4px;
      color: #1f2937;
    }

    .ai-footer {
      font-size: 11px;
      color: #6b7280;
    }

    .ai-tone {
      margin: 0;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,document.head.appendChild(e)}console.log(`[AI Writing Assistant] Content script loaded on:`,window.location.hostname),new e;var o=null,s=null,c=null,l=!1;function u(e,t,n=5e3){console.log(`[AI Writing Assistant] Preparing to send message:`,e.type);let r=null,i=!1,a=e=>{i||(i=!0,r&&clearTimeout(r),t(e))};r=window.setTimeout(()=>{i||(i=!0,console.error(`[AI Writing Assistant] Background worker timeout for`,e.type),t(null))},n);try{chrome.runtime.sendMessage(e,a)}catch(e){r&&clearTimeout(r),i=!0,console.error(`[AI Writing Assistant] sendMessage failed:`,String(e?.message||e)),t(null)}}function d(){let e=window.location.hostname.replace(/^www\./,``).split(`.`)[0];o||u({type:`CREATE_SESSION`,siteUrl:window.location.href,siteName:e},t=>{if(!t?.success||!t.sessionId){console.error(`[AI Writing Assistant] CREATE_SESSION failed:`,t);return}o={id:t.sessionId,siteUrl:window.location.href,siteName:e,startTime:Date.now(),endTime:void 0,content:``,context:void 0,replyContext:void 0,suggestions:[],appliedCount:0,textAnalysis:{grammarScore:0,spellingErrors:0,clarityScore:0,toneAnalysis:`neutral`,suggestedImprovements:[],readingLevel:`intermediate`}},l&&c&&(l=!1,x(c))})}function f(){chrome.runtime.sendMessage({type:`PING`},e=>{if(chrome.runtime.lastError){console.error(`[AI Writing Assistant] PING failed:`,chrome.runtime.lastError);return}e&&console.log(`[AI Writing Assistant] PING successful`)})}function p(){u({type:`CONTENT_SCRIPT_READY`,url:window.location.href,title:document.title,frameUrl:window.location.href},()=>{})}function m(e){if(!(e instanceof HTMLElement))return null;if(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement||e.isContentEditable)return e;let t=e.closest(`[contenteditable="true"], [role="textbox"]`);return t instanceof HTMLElement?t:null}function h(e){let t=typeof e.composedPath==`function`?e.composedPath():[];for(let e of t){let t=m(e);if(t)return t}return m(e.target)}function g(){let e=m(document.activeElement);if(e)return e;for(let e of[`[contenteditable="true"]`,`[role="textbox"]`,`textarea`,`input[type="text"]`,`input:not([type])`,`[data-lexical-editor="true"]`,`.ProseMirror`]){let t=m(document.querySelector(e));if(t)return t}return null}function _(e){return e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement?e.value:e.innerText||e.textContent||``}function v(e){let t=[e.getAttribute(`aria-label`),e.getAttribute(`placeholder`),e.getAttribute(`name`),e.id,e.className].filter(Boolean).join(` `).toLowerCase();return/reply|respond/.test(t)||e.closest(`[class*="reply"], [data-testid*="reply"]`)?`reply`:/comment/.test(t)||e.closest(`[class*="comment"], [data-testid*="comment"]`)?`comment`:e instanceof HTMLTextAreaElement||/subject|email|mail|compose/.test(t)?`email`:`general`}function y(e){let t=_(e).replace(/\s+/g,` `).trim(),n=[e.closest(`[class*="reply"]`),e.closest(`[class*="comment"]`),e.closest(`[role="dialog"]`),e.closest(`article`),e.parentElement,e.parentElement?.parentElement].filter(Boolean),r=[];for(let i of n){let n=[...Array.from(i.querySelectorAll(`blockquote, [class*="quoted"], [class*="reply"], [class*="comment"], [class*="message"], [data-testid*="reply"], [data-testid*="comment"], [role="article"]`)),i.previousElementSibling].filter(Boolean);for(let i of n){if(i===e||i.contains(e))continue;let n=(i.textContent||``).replace(/\s+/g,` `).trim();!n||n===t||n.length<12||r.push(n.slice(0,280))}if(r.length>0)break}return r[0]}function b(e,t,n){if(!o){l=!0,d();return}o.content=e,o.context=t,o.replyContext=n,u({type:`UPDATE_SESSION_DRAFT`,sessionId:o.id,text:e,context:t,replyContext:n},()=>{})}function x(e){let t=_(e),n=t.replace(/\s+/g,` `).trim(),a=v(e),c=y(e);if(o||(l=!0,d()),b(t,a,c),n.length<3){i();return}s!==null&&clearTimeout(s),s=window.setTimeout(()=>{if(!o){l=!0;return}u({type:`ANALYZE_TEXT`,text:t,sessionId:o.id,context:a,siteUrl:window.location.href,replyContext:c},n=>{if(!n){console.error(`[AI Writing Assistant] No response from ANALYZE_TEXT`);return}if(o&&={...o,content:t,context:a,replyContext:c,suggestions:n.suggestions||[],textAnalysis:n.analysis??o.textAnalysis},n.suggestions&&n.suggestions.length>0){r({text:t,suggestions:n.suggestions,analysis:n.analysis,position:S(e)});return}i()})},1200)}console.log(`[AI Writing Assistant] Page loaded, testing connectivity...`),f(),p(),setTimeout(()=>{d();let e=g();e&&(c=e)},500),window.addEventListener(`load`,d),document.addEventListener(`visibilitychange`,()=>{document.visibilityState===`visible`&&!o&&d()}),document.addEventListener(`focusin`,e=>{let t=h(e);t&&(c=t,o||d())},!0),document.addEventListener(`beforeinput`,e=>{let t=h(e);t&&(c=t,x(t))},!0),document.addEventListener(`input`,e=>{let t=h(e);t&&(c=t,x(t))},!0),document.addEventListener(`keyup`,e=>{let t=h(e);t&&(c=t,x(t))},!0),document.addEventListener(`selectionchange`,()=>{let e=g();e&&(c=e)}),document.addEventListener(`keydown`,e=>{e.key===`Escape`&&i()});function S(e){let t=e.getBoundingClientRect();return{x:t.left,y:t.bottom+10}}