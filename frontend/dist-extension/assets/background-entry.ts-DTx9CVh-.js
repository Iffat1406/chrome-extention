async function e(e,r,i,a,o){let s=((e,t,n,r)=>{let i=`\nContext: "${n||`general writing`}"`,a=r?`\nReply to: "${r}"`:``,o={grammar:`You are a writing assistant helping the user improve their message.

User is writing a message.
Typed text: "${t}"${i}${a}

Tasks:
1. Fix any grammar or spelling errors.
2. Improve clarity without changing the tone.
3. Suggest a better version if needed.
4. Keep the tone natural.

Return JSON only (no markdown, no prose), with this schema:
{
  "suggestions": [
    {
      "originalText": "string",
      "suggestion": "string",
      "reason": "grammar|spelling|clarity|tone|completion",
      "confidence": 0.0
    }
  ],
  "analysis": {
    "grammarScore": 0,
    "spellingErrors": 0,
    "clarityScore": 0,
    "toneAnalysis": "string",
    "suggestedImprovements": ["string"],
    "readingLevel": "basic|intermediate|advanced"
  }
}`,comprehensive:`You are an advanced writing coach helping the user improve their message.

User is writing a message.
Typed text: "${t}"${i}${a}

Analyze for:
1. Grammar and spelling errors.
2. Clarity improvements.
3. Tone analysis.
4. Better word choices.
5. Message completeness.
6. Suggested complete reply if appropriate.

Return JSON only (no markdown, no prose), with this schema:
{
  "suggestions": [
    {
      "originalText": "string",
      "suggestion": "string",
      "reason": "grammar|spelling|clarity|tone|completion",
      "confidence": 0.0
    }
  ],
  "analysis": {
    "grammarScore": 0,
    "spellingErrors": 0,
    "clarityScore": 0,
    "toneAnalysis": "string",
    "suggestedImprovements": ["string"],
    "readingLevel": "basic|intermediate|advanced"
  }
}`,completion:`You are a writing completion assistant.

User is writing a message.
Typed text: "${t}"${i}${a}

Tasks:
1. Suggest next words or sentences to complete the thought.
2. Keep the tone consistent.
3. Provide 2-3 completion options.

Return JSON only (no markdown, no prose), with this schema:
{
  "suggestions": [
    {
      "originalText": "string",
      "suggestion": "string",
      "reason": "completion",
      "confidence": 0.0
    }
  ],
  "analysis": {
    "grammarScore": 0,
    "spellingErrors": 0,
    "clarityScore": 0,
    "toneAnalysis": "string",
    "suggestedImprovements": ["string"],
    "readingLevel": "basic|intermediate|advanced"
  }
}`};return o[e]||o.grammar})(r,e,a,o),c=JSON.stringify({contents:[{parts:[{text:s}]}],generationConfig:{temperature:.4,maxOutputTokens:800,responseMimeType:`application/json`}}),l=[`gemini-1.5-flash-latest`,`gemini-1.5-flash`,`gemini-2.0-flash`],u=null;for(let r of l){let a=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${r}:generateContent?key=${i}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:c});if(!a.ok){u=`${r}: ${a.status} ${a.statusText}`;continue}let o=(await a.json()).candidates?.[0]?.content?.parts?.[0]?.text||``,s=n(o,e);return s.suggestions.length>0?s:{suggestions:t(o,e),analysis:f(o)}}throw Error(u??`Gemini API request failed`)}function t(e,t=``){let n=[],r=e.split(`
`),i=0;for(let e of r){let r=e.trim(),a=r.match(/^[-*]\s*\[([^\]]+)\]:\s*(.+?)\s*->\s*(.+?)$/);if(a){if(i++,i>8)break;let[,e,r,o]=a;n.push({id:`sugg-${i}`,position:c(t,r.trim()),length:r.trim().length,originalText:r.trim(),suggestion:o.trim(),reason:l(e),confidence:.85,applied:!1});continue}if(r.includes(`should be`)||r.includes(`instead of`)||r.includes(`replace with`)||r.includes(`->`)){if(i++,i>8)break;n.push({id:`sugg-${i}`,position:0,length:0,originalText:`text`,suggestion:r,reason:r.toLowerCase().includes(`grammar`)?`grammar`:`clarity`,confidence:.75,applied:!1})}}return n}function n(e,t){let n=r(i(e));if(!n)return{suggestions:[],analysis:p()};let u=(n.suggestions??[]).filter(e=>e.originalText&&e.suggestion).slice(0,8).map((e,n)=>{let r=(e.originalText??``).trim(),i=(e.suggestion??``).trim();return{id:`sugg-${n+1}`,position:c(t,r),length:r.length,originalText:r,suggestion:i,reason:l(e.reason??`clarity`),confidence:s(e.confidence??.82),applied:!1}}),d=f(e),m=n.analysis??{};return{suggestions:u,analysis:{grammarScore:a(m.grammarScore,d.grammarScore),spellingErrors:o(m.spellingErrors,d.spellingErrors),clarityScore:a(m.clarityScore,d.clarityScore),toneAnalysis:m.toneAnalysis??d.toneAnalysis,suggestedImprovements:Array.isArray(m.suggestedImprovements)&&m.suggestedImprovements.length>0?m.suggestedImprovements.slice(0,3):d.suggestedImprovements,readingLevel:m.readingLevel??d.readingLevel}}}function r(e){try{return JSON.parse(e)}catch{return null}}function i(e){let t=e.trim();if(t.startsWith(`{`)&&t.endsWith(`}`))return t;let n=t.match(/```json\s*([\s\S]*?)```/i);if(n?.[1])return n[1].trim();let r=t.indexOf(`{`),i=t.lastIndexOf(`}`);return r>=0&&i>r?t.slice(r,i+1):t}function a(e,t){return typeof e!=`number`||Number.isNaN(e)?t:Math.max(0,Math.min(100,Math.round(e)))}function o(e,t){return typeof e!=`number`||Number.isNaN(e)?t:Math.max(0,Math.round(e))}function s(e){return Number.isNaN(e)?.8:Math.max(.1,Math.min(1,e))}function c(e,t){if(!e||!t)return 0;let n=e.toLowerCase().indexOf(t.toLowerCase());return n>=0?n:0}function l(e){let t=e.toLowerCase();return t.includes(`grammar`)?`grammar`:t.includes(`clarity`)?`clarity`:t.includes(`spelling`)?`spelling`:t.includes(`tone`)?`tone`:t.includes(`completion`)?`completion`:`clarity`}function u(e){for(let t of[/^(?:in response to|replying to|regarding|about|re:)\s+(.+?)$/im,/^(?:you|they|someone)\s+(?:said|mentioned|asked|wrote):\s*"?(.+?)"?$/im]){let n=e.match(t);if(n)return d(n[1])}}function d(e){if(!e)return;let t=e.replace(/\s+/g,` `).trim();if(!(t.length<6))return t.slice(0,280)}function f(e){let t=e.toLowerCase(),n=/error|incorrect|wrong/.test(t),r=/spell|typo/.test(t),i=/unclear|confus|improve clarity/.test(t);return{grammarScore:n?50:85,spellingErrors:r?1:0,clarityScore:i?60:80,toneAnalysis:`formal`,suggestedImprovements:e.split(`
`).slice(0,3),readingLevel:`intermediate`}}function p(){return{grammarScore:75,spellingErrors:0,clarityScore:75,toneAnalysis:`neutral`,suggestedImprovements:[],readingLevel:`intermediate`}}function m(e,t,n){let r=[],i=e.replace(/\s+/g,` `).trim(),a=1,o=(t,n,i,o)=>{!t||!n||r.length>=8||r.push({id:`local-${a++}`,position:c(e,t),length:t.length,originalText:t,suggestion:n,reason:i,confidence:o,applied:!1})};for(let[e,t,n,a]of[[/\bdont\b/gi,`don't`,`grammar`,.9],[/\bcant\b/gi,`can't`,`grammar`,.9],[/\bdidnt\b/gi,`didn't`,`grammar`,.9],[/\bwont\b/gi,`won't`,`grammar`,.9],[/\bim\b/gi,`I'm`,`grammar`,.85],[/\bi\b/g,`I`,`grammar`,.7],[/\bteh\b/gi,`the`,`spelling`,.92],[/\brecieve\b/gi,`receive`,`spelling`,.92],[/\bdefinately\b/gi,`definitely`,`spelling`,.92]]){let s=i.match(e);if(s?.[0]&&o(s[0],t,n,a),r.length>=8)break}/\s{2,}/.test(e)&&o(`extra spaces`,`Use single spaces between words.`,`clarity`,.8),i.length>25&&!/[.!?]$/.test(i)&&o(i.slice(Math.max(0,i.length-20)),`${i}.`,`clarity`,.76),t===`completion`&&i.length>=8&&o(i,`${i}${/[.!?]$/.test(i)?``:`.`} Let me know your thoughts.`,`completion`,.7),n&&i.length>0&&i.length<18&&o(i,`${i} Thanks for sharing this.`,`tone`,.68);let s=r.filter(e=>e.reason===`spelling`).length,l=r.filter(e=>e.reason===`grammar`).length,u=r.filter(e=>e.reason===`clarity`).length;return{suggestions:r,analysis:{grammarScore:Math.max(45,90-l*12),spellingErrors:s,clarityScore:Math.max(50,88-u*10),toneAnalysis:n?`conversational`:`neutral`,suggestedImprovements:r.map(e=>e.suggestion).slice(0,3),readingLevel:`intermediate`}}}console.log(`[Background Worker] Service worker starting...`);var h=[],g=new Map;console.log(`[Background Worker] Loading sessions from storage on startup...`),chrome.storage.local.get(`sessions`,({sessions:e})=>{e&&Array.isArray(e)?(h.push(...e),console.log(`[Background Worker] ✅ Loaded`,h.length,`sessions from storage`)):console.log(`[Background Worker] 📭 No sessions in storage yet`)});var _={enabled:!0,aiEnabled:!0,geminiApiKey:``,model:`gemini`,analysisMode:`comprehensive`,autoSuggest:!0,suggestionDelay:1e3,minTextLength:10,excludedSites:[],cloudSyncEnabled:!1,backendUrl:`http://localhost:4000`};try{console.log(`[Background Worker] 📋 Registering onMessage listener...`),chrome.runtime.onMessage.addListener((e,t,n)=>{if(console.log(`[Background Worker] 📨 MESSAGE RECEIVED:`,{type:e.type,from:t?.url,timestamp:new Date().toISOString()}),e.type===`PING`)return console.log(`[Background Worker] 🏓 PING received, responding...`),n({pong:!0,timestamp:Date.now()}),!0;if(e.type===`CONTENT_SCRIPT_READY`)return console.log(`[Background Worker] Content script ready:`,{url:e.url,title:e.title,frameUrl:e.frameUrl}),n({success:!0}),!0;if(e.type===`ANALYZE_TEXT`)return console.log(`[Background Worker] 🔍 Analyzing text:`,e.text?.substring(0,50)),S(e.text,e.sessionId,e.context,e.replyContext).then(e=>{console.log(`[Background Worker] ✅ Analysis complete, sending response with`,e.suggestions.length,`suggestions`),n(e)}).catch(e=>{console.error(`[Background Worker] ❌ Analysis failed:`,e);let t=p();n({error:e.message,suggestions:[],analysis:t})}),!0;if(e.type===`UPDATE_SESSION_DRAFT`)return y(e.sessionId,e.text,e.context,e.replyContext),n({success:!0}),!0;if(e.type===`GET_SESSIONS`)return console.log(`[Background Worker] 📋 GET_SESSIONS - returning`,h.length,`sessions`),n(h),!0;if(e.type===`CREATE_SESSION`){console.log(`[Background Worker] 🆕 CREATE_SESSION for:`,e.siteName);let t={id:crypto.randomUUID(),siteUrl:e.siteUrl,siteName:e.siteName,startTime:Date.now(),content:``,replyContext:void 0,suggestions:[],appliedCount:0,textAnalysis:{grammarScore:75,spellingErrors:0,clarityScore:75,toneAnalysis:`neutral`,suggestedImprovements:[],readingLevel:`intermediate`}};return console.log(`[Background Worker] 📝 Session created:`,t.id),h.push(t),console.log(`[Background Worker] 💾 Added to cache. Total sessions:`,h.length),console.log(`[Background Worker] ✅ SENDING RESPONSE NOW`),n({success:!0,sessionId:t.id}),chrome.storage.local.set({sessions:h},()=>{if(chrome.runtime.lastError){console.error(`[Background Worker] ❌ Storage save failed:`,chrome.runtime.lastError);return}console.log(`[Background Worker] ✅ Persisted to storage successfully`)}),!0}return e.type===`UPDATE_SETTINGS`?(console.log(`[Background Worker] ⚙️ Updating settings`),chrome.storage.sync.set({settings:e.settings},()=>{console.log(`[Background Worker] ✅ Settings updated`),n({success:!0})}),!0):e.type===`GET_SETTINGS`?(console.log(`[Background Worker] ⚙️ GET_SETTINGS requested`),chrome.storage.sync.get(`settings`,({settings:e})=>{console.log(`[Background Worker] ✅ Returning settings`),n(e??_)}),!0):e.type===`CLEAR_HISTORY`?(console.log(`[Background Worker] 🗑️ Clearing history`),h.length=0,chrome.storage.local.remove(`sessions`,()=>{console.log(`[Background Worker] ✅ History cleared`),n({success:!0})}),!0):(console.warn(`[Background Worker] ⚠️ Unknown message type:`,e.type),n({error:`Unknown message type`}),!0)}),console.log(`[Background Worker] ✅ Message listener registered successfully`)}catch(e){console.error(`[Background Worker] ❌ CRITICAL ERROR - Failed to register message listener:`,e)}async function v(){return new Promise(e=>{chrome.storage.sync.get(`settings`,({settings:t})=>{e(t??_)})})}function y(e,t,n,r){let i=h.find(t=>t.id===e);if(!i){console.warn(`[Background Worker] ⚠️ Session not found:`,e);return}i.content=t,n&&(i.context=n),i.replyContext=d(r),chrome.storage.local.set({sessions:h},()=>{if(chrome.runtime.lastError){console.error(`[Background Worker] ❌ Storage save failed:`,chrome.runtime.lastError);return}console.log(`[Background Worker] ✅ Session content stored immediately`)})}function b(e,t,n){let r=h.find(t=>t.id===e);if(!r){console.warn(`[Background Worker] ⚠️ Session not found for analysis update:`,e);return}r.suggestions=t||[],r.textAnalysis=n,chrome.storage.local.set({sessions:h},()=>{if(chrome.runtime.lastError){console.error(`[Background Worker] ❌ Storage update failed:`,chrome.runtime.lastError);return}console.log(`[Background Worker] ✅ Session analysis stored after AI response`)})}function x(e,t){let n=g.get(e),r=Date.now();return n?n.text===t&&r-n.timestamp<2e3?(console.log(`[Background Worker] ⏭️ Skipping analysis - text unchanged`),!1):Math.abs(t.length-n.text.length)<10&&r-n.timestamp<3e3?(console.log(`[Background Worker] ⏭️ Skipping analysis - minimal text change`),!1):!0:!0}async function S(t,n,r,i){let a=await v();if(console.log(`[Background Worker] 💾 Storing text immediately (before AI call)`),y(n,t,r,i),!a.aiEnabled||!a.geminiApiKey){if(!a.aiEnabled)return console.log(`[Background Worker] AI disabled, returning default analysis`),{suggestions:[],analysis:p()};console.log(`[Background Worker] API key missing, using local fallback suggestions`);let e=m(t,a.analysisMode,i);return b(n,e.suggestions,e.analysis),e}if(!x(n,t))return console.log(`[Background Worker] ⏭️ Skipping AI call - text not significantly changed`),{suggestions:[],analysis:p()};try{let o=d(i)??u(t);console.log(`[Background Worker] 🚀 Calling Gemini API with context detection...`);let s=await e(t,a.analysisMode,a.geminiApiKey,r,o);return g.set(n,{text:t,timestamp:Date.now()}),console.log(`[Background Worker] 💾 Storing AI suggestions (after AI response)`),b(n,s.suggestions,s.analysis),{suggestions:s.suggestions||[],analysis:s.analysis||p()}}catch(e){console.error(`[Background Worker] AI analysis failed, using local fallback:`,e);let r=m(t,a.analysisMode,i);return b(n,r.suggestions,r.analysis),r}}