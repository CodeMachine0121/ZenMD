# ZenMDLanding

ZenMD 的 landing page，以及產生它那三張截圖的工具。

這一頁的**唯一目的是量測意願**：一週之內有多少人願意留下 email。
它不是官網、不是說明文件，所以不要往裡面加功能列表——每多一段，訊號就少一分。

| 判讀 | 意思 |
| :--- | :--- |
| 一週 **100 封以上** email | 漏斗有東西，App 這條路可以繼續 |
| **勾選率 30% 以上** | 有人真的想付錢，雲端值得做 |
| 一週 **20 封以下** | 市場給答案了，別再往 App 裡投時間 |

## 檔案

```
index.html                        landing page 本體（單檔，無建置步驟）
screenshots/                      截自實際執行的 App
  01-editor-and-preview.png
  02-snippet-menu.png
  03-zen-theme.png
tools/
  captureScreenshots.mjs          用 Playwright 驅動 Electron 取截圖
  previewLanding.mjs              用 Chromium 把 index.html 渲染出來看
  demo-vault/                     示範用的假 vault（版控這一份）
  demo-home/                      每次跑截圖時從 demo-vault 複製產生（不必版控）
```

## 上線前一定要做的兩件事

1. **接上表單。** `index.html` 裡的 `action="REPLACE_WITH_YOUR_FORM_ENDPOINT"`
   換成你的表單服務（Formspree / Buttondown / ConvertKit 都行）。
   **沒換之前按「通知我」不會送到任何地方。**

2. **確認價格。** 目前的方案是 **App 永久免費、雲端服務 NT$149／月（或 NT$1,490／年）**。
   三個數字都在 `<div class="tiers">` 裡，各出現一次。

   這一頁同時收兩個訊號，不要把它們混在一起看：

   | 訊號 | 來源 | 意思 |
   | :--- | :--- | :--- |
   | **想要這個 App** | 留了 email | 漏斗頂端有多寬 |
   | **願意為雲端付費** | 勾了「同步上線也通知我」 | **這才是變現訊號** |

   > ⚠️ App 免費之後，留 email 的成本變低了，所以第一個數字會比標價時漂亮很多。
   > **判讀要看勾選率**，不要看總數就開心。

## 重新產生截圖

```bash
node tools/captureScreenshots.mjs            # 產生三張
node tools/captureScreenshots.mjs --inspect  # 只截一張並 dump DOM，用來寫選擇器
```

需要：

- 全域安裝的 `playwright`（腳本自己會從 `npm root -g` 找，不必設 `NODE_PATH`）
- **ZenMD 已經 build 過**：`cd ../ZenMD && npm run build`
  （截圖用的是 `out/` 裡的建置產物，不是 dev server——所以新功能要先 build 才截得到）

### 它不會碰到你真實的 vault

App 把 vault 寫死在 `~/ZenMD`，但腳本啟動 Electron 時把 `HOME` 指向 `tools/demo-home`，
所以它開的是示範用的假 vault。**你自己的文章不會出現在任何一張截圖裡**，
production code 也完全沒有被改動。

每次執行都會先把 `demo-home/ZenMD` 砍掉、從 `demo-vault/` 重新複製一份——
因為擷取過程會往文章裡打字，而 App 的自動儲存會把它寫進檔案。

## 本機預覽

```bash
open index.html                  # 直接開
node tools/previewLanding.mjs    # 或渲染成 PNG 檢查（含 full page）
```

## 設計

- 紙白底 `#FBFAF8` + 墨黑 `#16181B`，唯一重點色是硃砂紅 `#BF3B2E`（印章與圈重點的那個紅）。
- 標題 `Noto Serif TC`、內文 `Noto Sans TC`、小標籤 `DM Mono`。
- **深淺色主題都畫過**：色彩全部走 CSS 變數，深色在 `prefers-color-scheme` 與 `[data-theme]` 各定義一次。
- Hero 刻意**不放截圖**，放「組字中」的字體標本——先讓人認出自己每天在受的折磨，再給看畫面。
