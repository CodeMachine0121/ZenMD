---
title: Electron and Tauri, weighed
created_at: 2026-08-14T09:12:00+08:00
updated_at: 2026-08-21T16:04:11+08:00
status: active
tags:
  - electron
  - tauri
  - desktop
---

Picking a desktop shell. Laying the **trade** out side by side landed somewhere I did not expect.

## The short version

Trade **install size** for **correct text input**. For something used every day to write, that is not a close call.

## What each one actually is

| | Electron | Tauri |
| :--- | :--- | :--- |
| Renderer | Ships Chromium, one build everywhere | Whatever the platform provides |
| On macOS | Chromium | WKWebView (WebKit) |
| Install size | Over 100 MB | Around 10 MB |
| Input behaviour | **One** | **Three** |

## Why one engine matters

> The editor has a third state that plain typing never enters, and it lasts
> a few hundred milliseconds at a time.
> Touch the document during it and the state machine comes apart.

Which shows up as a real, filed bug:

```ts
// soft wrapping plus that third state is where it breaks
editor.dispatch({
  changes: { from, to, insert },
  filter: () => !view.composing,
})
```

## Still to do

- [x] Read the three forum threads end to end
- [x] Confirm the engine bug is still open
- [ ] Turn the checklist into twelve things anyone can verify
- [ ] Put it in the release checklist

## The costs, honestly

1. Install size goes from about 10 MB to over 100 MB
2. Memory use is several times higher
3. Startup is slower

All three are paid **once**, or are simply liveable. Broken text input is paid *every single day*.
