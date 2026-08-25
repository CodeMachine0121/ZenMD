---
title: CodeMirror 的 decoration 心得
created_at: 2026-08-16T21:40:00+08:00
updated_at: 2026-08-18T10:22:00+08:00
status: on_hold
tags:
  - codemirror
  - ime
---

替換式 widget 是組字被打斷的溫床，mark decoration 相對安全。

重點只有一句：**組字中不要重建游標附近的 DOM 節點。**
