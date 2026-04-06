# Quick Test Checklist (< 2 minutes)

## Before Testing

- [ ] Built: `npm run build` completed successfully ✓

## Step-by-Step

### 1️⃣ Reload Extension
- [ ] Open `chrome://extensions/`
- [ ] Find "AI Writing Assistant"
- [ ] Click the refresh icon (circular arrow)
- [ ] Wait for "Updated" notification

### 2️⃣ Open Debug Console
- [ ] Go to ChatGPT (chat.openai.com)
- [ ] Press `F12` on keyboard
- [ ] Click **Console** tab
- [ ] You should see GREEN text starting with `[`

### 3️⃣ Type Test Message
- [ ] Click in ChatGPT message input
- [ ] Type: `hello world` (or any 3+ character text)
- [ ] **Wait 2 seconds** (don't send the message)

### 4️⃣ Check Console for Logs

**Expected logs (in this order):**

```
⚙️ [AI Writing Assistant] Session created: {id: "...", siteUrl: "https://chat.openai.com/...", ...}
📝 [AI Writing Assistant] Captured text: hello world
💾 [AI Writing Assistant] Session saved: {id: "...", content: "hello world", ...}
```

**If you see these → ✅ FIX WORKED!**

### 5️⃣ Check Dashboard
- [ ] Click the extension icon (top right of Chrome)
- [ ] Click **Dashboard** tab (left icon)
- [ ] You should see:
  - ✅ "1 writing sessions"
  - ✅ One session listed under "Recent Sessions"
  - ✅ Shows the text you typed: "hello world"

**If yes → ✅ DATA PERSISTED CORRECTLY!**

### 6️⃣ (Optional) Check Service Worker Logs
- [ ] Open `chrome://extensions/`
- [ ] Find "AI Writing Assistant"
- [ ] Click the **Service Worker** link
- [ ] You should see logs:
  ```
  [Background Worker] Received message: ANALYZE_TEXT
  [Background Worker] Analysis complete: {suggestions: [...], analysis: {...}}
  ```

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| No `[AI Writing Assistant]` logs | Content script not loaded. Try **disabling/enabling** the extension in chrome://extensions |
| Only 1st log appears, not 2nd/3rd | Text is too short. Try typing at least 10 characters. |
| Console shows ERROR | Take screenshot of error, message me the exact error text |
| Dashboard shows 0 sessions | Popup didn't refresh. Try closing and reopening the extension popup. |
| Blank console on ChatGPT | Try **reload page** (Ctrl+R) then type again |

## Success Indicators

✅ All of these should be true:

```
[ ] Logs appear when typing on ChatGPT
[ ] Console shows your typed text in [AI Writing Assistant] message
[ ] Dashboard shows "1 writing sessions" 
[ ] Dashboard lists the session with your text
[ ] No error messages in console
```

## If Everything Works

Great! The extension is now:
- ✅ Capturing text from ChatGPT
- ✅ Creating sessions automatically
- ✅ Persisting data to storage
- ✅ Updating the dashboard in real-time

Next: Try on **Gmail** and **Google Docs** to test other platforms.

## If Something Broke

1. Open `chrome://extensions/`
2. Toggle expansion arrow next to "AI Writing Assistant"
3. Look for **Errors** section - take a screenshot
4. Close DevTools (`F12`)
5. Disable/enable the extension
6. Try the test again

---

**Report the exact error message from console and I can fix it immediately!**
