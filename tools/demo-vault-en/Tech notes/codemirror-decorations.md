---
title: Notes on CodeMirror decorations
created_at: 2026-08-16T21:40:00+08:00
updated_at: 2026-08-18T10:22:00+08:00
status: onHold
tags:
  - codemirror
---

Replacing widgets is where things come apart. Mark decorations are comparatively safe.

One rule: **do not rebuild DOM near the cursor while the editor is mid-composition.**
