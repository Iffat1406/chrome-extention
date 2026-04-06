# AI Writing Assistant Extension - Testing Guide

## How to Test the Extension on ChatGPT

### Step 1: Reload the Extension in Chrome

1. Open `chrome://extensions/` in your browser
2. Toggle **Developer mode** ON (top right corner)
3. Find "AI Writing Assistant" extension
4. Click the **refresh icon** to reload the extension with latest build

### Step 2: Open Chrome DevTools to See Debug Logs

You need to view logs from:
- **Content Script** (runs on ChatGPT page)
- **Background Worker** (processes messages)
- **Popup** (displays sessions)

#### View Content Script Logs (on ChatGPT):
1. Open ChatGPT website
2. Right-click on page → **Inspect** or press **F12**
3. Go to **Console** tab
4. Look for messages starting with `[AI Writing Assistant]`

#### View Background Worker Logs:
1. Go to `chrome://extensions/`
2. Find your extension
3. Click **Service Worker** link to open debugger
4. Look for messages starting with `[Background Worker]`

#### View Popup Logs (optional):
1. Click extension icon in Chrome toolbar
2. Right-click popup → **Inspect**
3. Go to **Console** tab

### Step 3: Test Text Capture on ChatGPT

1. Go to [chat.openai.com](https://chat.openai.com)
2. Click in the message input box
3. Type a few words (at least 3 characters): **"Hello world"**
4. **Wait 1.5 seconds** (debounce timeout)
5. Check the **Console** for these logs:

```
[AI Writing Assistant] Captured text: Hello world
[AI Writing Assistant] Session saved: {...}
[Background Worker] Received message: ANALYZE_TEXT
```

### Step 4: Check Dashboard for Writing Sessions

1. Click the extension icon in Chrome toolbar
2. You should see the session in the **Dashboard** tab
3. If you don't see it, the session data isn't being stored

## Troubleshooting

### Issue: No logs appearing on ChatGPT

**Possible Causes:**
1. Content script not loaded
2. Event listener not triggering
3. Session creation failed

**Debug Steps:**
```javascript
// Paste in Console on ChatGPT page:
console.log("Testing content script");
document.addEventListener("keyup", (e) => {
  console.log("Keyup event fired! Target:", e.target.tagName, e.target.className);
});
```

Then type in the chat box and see if "Keyup event fired!" appears.

### Issue: "Session not found" message

**Possible Causes:**
1. CREATE_SESSION message not reaching background worker
2. Background worker not responding with sessionId

**Debug Steps:**
1. Check **Service Worker** console for: `[Background Worker] Creating session: ...`
2. If no message appears, the content script didn't send it
3. Check Content Script console for errors

### Issue: Showing all sessions from before (not just new ones)

This is expected! The Dashboard shows **all sessions since extension was installed**. To clear history:
1. Go to Settings tab
2. Click **Clear History** button
3. This deletes all sessions from storage

### Issue: Sessions not updating in Dashboard

The Dashboard refreshes every 2 seconds. If still not showing:
1. Open Service Worker console
2. Manually run: `chrome.storage.local.get("sessions", console.log)`
3. Check if sessions exist in storage

## What Each Log Message Means

### Content Script Messages `[AI Writing Assistant]`

| Log Message | Meaning |
|---|---|
| `Captured text: ...` | Text was successfully extracted from input |
| `Session created: {...}` | A new writing session was created |
| `Session not found, creating new one...` | Content script created session automatically |
| `Session saved: {...}` | Session data was written to chrome.storage |

### Background Worker Messages `[Background Worker]`

| Log Message | Meaning |
|---|---|
| `Received message: CREATE_SESSION` | Content script asked to create a session |
| `Creating session: {...}` | Background worker created the session |
| `Session created and saved, returning: ...` | Session was stored and response sent back |
| `Received message: ANALYZE_TEXT` | Content script sent text for AI analysis |
| `Analysis complete: {...}` | Gemini API analysis finished |

## Testing on Other Platforms

### Gmail:
1. Go to [Gmail.com](https://Gmail.com)
2. Click "Compose" to create new email
3. Type in the message body

### Google Docs:
1. Go to [docs.google.com](https://docs.google.com)
2. Create new document
3. Type in the document

If text capture is not working on these, you'll see different console output. Report the error message and we can fix the DOM detection logic.

## Expected Flow When Typing on ChatGPT

```
User types: "Hello world"
   ↓
[Content Script] Keyup event fires
   ↓
[Content Script] Extracts text via innerText
   ↓
[Content Script] Waits 1.5 seconds (debounce)
   ↓
[Content Script] Sends "ANALYZE_TEXT" message to background
   ↓
[Background Worker] Receives message
   ↓
[Background Worker] Calls Gemini API (if API key set)
   ↓
[Background Worker] Returns analysis + suggestions
   ↓
[Content Script] Saves session to chrome.storage.local
   ↓
[Popup] Detects storage change via listener
   ↓
Dashboard refreshes and shows new session
```

## Enable AI Suggestions (Gemini API Setup)

Currently, if no Gemini API key is set, the extension:
- ✅ Creates sessions
- ✅ Captures text
- ✅ Stores data
- ❌ Shows generic placeholder analysis (no real AI suggestions)

To get real AI suggestions:

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikeys)
2. Click **Create API Key**
3. Copy the key
4. In extension Settings → paste into **Gemini API Key** field
5. Make sure **AI Assistant Enabled** toggle is ON
6. Click Save

Now when you type on ChatGPT, it will show real grammar/clarity suggestions from Gemini.

## File Locations in Extension

When debugging, remember the extension has these key components:

```
dist/
  ├── manifest.json          (permissions, content script injection)
  ├── assets/index.ts-*.js   (content script - runs on pages)
  ├── assets/index.ts-*.js   (background worker - handles messages)
  └── assets/popup.html-*.js (popup UI)
```

The content script is injected into **every page** due to `matches: ["<all_urls>"]` in manifest.json.

## Common Issues & Solutions

| Issue | Solution |
|---|---|
| Popup shows "0 writing sessions" | Sessions might be in chrome.storage.sync instead of .local. Go to DevTools → Application → Storage |
| Text isn't being captured | Content script keyup listener might not be detecting your input element. Check console logs. |
| No Gemini API response | API key might be wrong, invalid, or not set. Check Settings in popup. Try regenerating key. |
| Extension crashes on ChatGPT | Check Service Worker console for errors. Look for TypeError or ReferenceError. |
| Same session keeps getting updated | Expected behavior! Each time you type, it updates the same session. New sessions only when you reload page. |

## Next Steps if Problems Persist

1. **Collect all console logs** from:
   - Content Script (on ChatGPT page)
   - Service Worker (background)
   - Popup

2. **Check chrome.storage**:
   - Go to DevTools → Application → Local Storage → `chrome-extension://[ID]/`
   - Look for `sessions` key

3. **Restart extension**:
   - `chrome://extensions/` → disable/enable AI Writing Assistant

4. **Clear all data**:
   - Go to Settings → Clear History
   - Or manually: DevTools → Application → Storage → Clear All

5. **Check manifest**:
   - Go to `chrome://extensions/` → Details
   - Make sure it lists:
     - `Declare manifest file location`
     - `Permissions: storage, runtime`
     - `Host permissions: <all_urls>`
