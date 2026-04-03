# Auto-Snippet Features Guide

## How It Works: 3 Ways to Create Snippets WITHOUT Typing

This extension now uses **automatic learning** to create snippets without manual entry. Users simply type naturally, and snippets appear automatically.

---

## 1. Pattern Learning (Most Automatic)

### How It Works
- User types the same text **3 or more times** on websites
- Extension detects the pattern and learns it
- Pattern appears in Quick-Open modal marked as "LEARN"
- User clicks "Create Snippet" → Done!

### Example Flow
```
1. User types "Dear Sir or Madam," on email site
2. Types it again on another email form
3. Types it again on a contact form
4. Extension detects: Pattern seen 3× 

5. User opens Quick-Open (Ctrl+Shift+P)
6. Sees "LEARN: Dear Sir or Madam, (seen 3 times)"
7. Clicks it → Auto shortcut: "/dsm" created
8. Next time: Type /dsm + space → Text auto-inserts!
```

### Benefits
- ✅ Zero manual entry
- ✅ Learns from natural typing
- ✅ Auto-generates relevant shortcuts
- ✅ User controls when to save

---

## 2. Auto-Shortcut Generation (Smart Defaults)

When creating any snippet (pattern or manual), shortcuts are **auto-generated**:

### Generation Strategies

**Strategy 1: First Letters of Words** (Priority)
```
"Hello World" → /hw
"Your Company Name" → /ycn
"Federal Tax ID" → /fti
```

**Strategy 2: Consonant Compression** (Single words)
```
"Programming" → /prgrm
"Email" → /ml
"Development" → /dvl
```

**Strategy 3: Beginning Characters** (Fallback)
```
"asynchronous" → /asy
"documentation" → /doc
```

**Strategy 4: Auto-Conflict Resolution**
```
/hw already exists? → System suggests /hw2
Both taken? → Suggests /hw3
All taken? → Generates unique ID-based shortcut
```

### User Options
- ✅ Accept auto-generated shortcut
- ✅ Choose from 3 alternatives
- ✅ Create custom shortcut manually

---

## 3. Quick-Open Search + Create (Cmd+K Style)

### Press Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)

Opens IDE-style command palette:

```
Search snippets or create from patterns... 
├─ Existing Snippets (shown as suggestions)
│  ├─ /hw | Hello World (shortcut match)
│  ├─ /ea | Email Address (label match)
│  └─ /ap | API Key (content match)
│
└─ Learning Patterns (shown as "LEARN" badge)
   ├─ LEARN Dear Sir or Madam, (seen 3×)
   ├─ LEARN Best regards, (seen 4×)
   └─ LEARN Sincerely, (seen 5×)
```

### Quick-Open Features
- **Type to filter**: Search snippets and patterns simultaneously
- **Arrow keys**: Navigate results (`↑` `↓`)
- **Enter**: Select snippet or create from pattern
- **Escape**: Close modal

---

## User Journeys

### Journey 1: Email Signature (Pattern Learning)
```
Day 1:
├─ User writes email with signature: "John Smith, CEO"
└─ Extension records pattern

Day 2:
├─ User writes same signature on contact form
└─ Extension count: 2

Day 3:
├─ User writes signature on another site
├─ Extension count: 3 ✓
└─ Pattern ready for creation!

User opens Quick-Open (Ctrl+Shift+P):
├─ Sees pattern: "LEARN: John Smith, CEO (seen 3 times)"
├─ Clicks it
├─ Auto shortcut generated: "/jsm"
└─ ✓ Snippet created instantly!

Day 4 onward:
├─ User types /jsm on any website
├─ Presses Tab or Space
└─ Full signature auto-inserts!
```

### Journey 2: Company Boilerplate (Mixed)
```
Scenario: Need recurring company tagline

Option A - Manual Entry:
├─ Click "Add Snippet" in popup
├─ Paste: "© 2026 TechCorp Inc. All rights reserved."
├─ See 3 auto-generated shortcuts: /tc, /tcr, /tta
├─ Select /tc
└─ Done! Type /tc → Auto-insert

Option B - Pattern Learning:
├─ Type tagline naturally 3× on different sites
├─ Extension learns it
├─ Open Quick-Open (Ctrl+Shift+P)
├─ Click "LEARN: © 2026 TechCorp Inc..."
└─ Auto shortcut: /cti created!
```

### Journey 3: Code Template (Quick Search)
```
Scenario: Need Python docstring

Current workflow:
├─ Press Ctrl+Shift+P (Quick-Open)
├─ Type "docstring"
├─ See results with /doc shortcut
├─ Hit Enter → Copied to clipboard
└─ Paste into code

Or type shortcut:
├─ Type /doc + Space in code field
├─ Template auto-inserts
```

---

## Key Differences from Original

| Feature | Before | Now |
|---------|--------|-----|
| **Create Snippets** | Manual entry | Automatic learning + manual |
| **Shortcuts** | User types manually | Auto-generated from text |
| **Discovery** | Browse Home tab | Quick-Open (Cmd+K) + auto-suggest |
| **Learning** | None | Learns from repeated typing |
| **Setup Time** | High (type everything) | Low (natural typing) |
| **Customization** | User control required | Defaults with override option |

---

## Settings for Auto-Features

In Settings tab:

```
Auto-Learning
├─ ☑ Learn from repeated text (toggle)
├─ Min occurrences: 3 (before suggesting)
└─ Pattern expiry: 30 days

Quick-Open
├─ ☑ Show patterns in search (toggle)
├─ ☑ Show learning suggestions (toggle)
└─ Show top N patterns: 10

Shortcuts
├─ ☑ Auto-generate shortcuts (toggle)
├─ ☑ Suggest alternatives (toggle)
└─ ☑ Auto-resolve conflicts (toggle)
```

---

## Examples of Auto-Generated Shortcuts

### Email Templates
```
"Dear [Name]," → /dn
"Best regards, John Smith" → /brjs
"Looking forward to your response" → /lftr
"Sincerely, [Name]" → /sn
```

### Code Comments
```
"TODO: Fix this later" → /tfl
"FIXME: Handle edge case" → /fhec
"NOTE: This assumes X is valid" → /ntxiv
```

### Business Boilerplate
```
"ABC Company © 2026 All Rights Reserved" → /accar
"Tax ID: 12-3456789" → /ti
"Contact: support@example.com" → /cse
```

### Customer Service
```
"Thank you for contacting us!" → /tfcu
"We'll get back to you within 24 hours" → /wgbu24
"Your order number is: [#]" → /yon
```

---

## Privacy & Storage

**Where patterns are stored:**
- Chrome Storage (Local) - NOT synced across devices
- Contains only: {text, count, lastSeen}
- No content analysis, no cloud send (unless sync enabled)

**Pattern Expiry:**
- 30 days of inactivity = removed
- User can manually clear all patterns in Settings
- User can exclude specific sites

**What's NOT tracked:**
- User identity (anonymous)
- Website content (only pattern text)
- User behavior (only repetition count)

---

## Troubleshooting

### Pattern not appearing in Quick-Open
- **Issue**: Text is < 5 characters (too short)
- **Solution**: System only learns substantial text
- **Example**: "ok" won't become snippet, but "Thank you" will

### Pattern not appearing after 3 times
- **Issue**: Text shows slightly different each time (capitalization, punctuation)
- **Solution**: System normalizes text, but "Hello World" ≠ "hello world " (extra space)
- **Fix**: Type consistently

### Shortcut looks weird (e.g., `/p6x`)
- **Issue**: All intelligent shortcuts taken
- **Solution**: System fell back to random generation
- **Fix**: Edit snippet and set custom shortcut

### Too many patterns in Quick-Open
- **Issue**: Learning enabled on very chatty sites
- **Solution**: Disable learning for specific sites in Settings
- **Prevention**: Patterns auto-expire after 30 days unused

---

## Best Practices

✅ **DO:**
- Let the extension learn naturally over time
- Use Quick-Open (Cmd+K) to find snippets
- Accept auto-generated shortcuts (usually smart)
- Clear old patterns occasionally (Settings)

❌ **DON'T:**
- Manually type snippets if pattern learning works
- Force custom shortcuts when defaults are good
- Exclude too many sites (defeats learning)
- Delete patterns you might want later (30-day auto-expiry instead)

---

## Future Enhancements

Planned features for even smarter auto-creation:

- **AI-Named Shortcuts**: Claude suggests shortcut names based on content
- **Context-Aware Patterns**: Learn patterns per website type
- **Suggestion Notifications**: Toast notifications when pattern hits threshold
- **Hotkey to Create**: Select text + keyboard shortcut → instant snippet
- **Duplicate Detection**: Auto-merge similar patterns
- **Pattern Rankings**: Show most useful patterns first

