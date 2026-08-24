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

1. **送一筆測試訂閱，確認欄位有進去。** Buttondown 已經接好了
   （帳號 `coding_afternoon`，取自後台給的內嵌表單）。

   但**後台那段程式碼只有 email 欄位**，`tag` 與 `metadata__wants_cloud`
   是我們自己加上去的——Buttondown 收不收、怎麼呈現，**沒實測過就不算數**。

   所以上線前一定要自己送一筆，**而且要把勾選框勾起來**，然後到後台確認：

   | 檢查 | 沒過的話 |
   | :--- | :--- |
   | 收到這筆訂閱 | 網址或欄位名稱有問題，回頭比對後台的內嵌表單 |
   | 訂閱者有 `wants_cloud` 這個 metadata | 改用 tag：勾選框的 `name` 換成 `tag`、`value` 換成 `wants-cloud` |
   | 標籤 `landing` 有帶上 | 之後在別處放表單就分不出流量來源了 |

   **順便把 double opt-in（二次確認）打開**，並且只採計「已確認」的數字。
   那個端點是公開的，任何人都能對它 POST；二次確認擋不住灌進來的垃圾，
   但會讓它們不算數——量測的時候，乾淨的小數字遠比髒的大數字有用。

   表單是 POST 進一個看不見的 iframe，所以**送出後人不會被帶離這一頁**，
   會直接看到「收到了」。跨來源讀不到那個 iframe 的內容，所以分不出成功或失敗——
   文案因此寫「收到了」而不是「訂閱成功」。**關掉 JavaScript 也還是送得出去**，
   只是會落到 Buttondown 自己的確認頁。

2. **確認價格。** 目前的方案是 **App 永久免費、雲端服務 NT$149／月（或 NT$1,490／年）**。
   三個數字都在 `<div class="tiers">` 裡，各出現一次。

   這一頁同時收兩個訊號，不要把它們混在一起看：

   | 訊號 | 來源 | 意思 |
   | :--- | :--- | :--- |
   | **想要這個 App** | 留了 email | 漏斗頂端有多寬 |
   | **願意為雲端付費** | 勾了「同步上線也通知我」 | **這才是變現訊號** |

   > ⚠️ App 免費之後，留 email 的成本變低了，所以第一個數字會比標價時漂亮很多。
   > **判讀要看勾選率**，不要看總數就開心。

## 還要一個分母

**部署的時候一定要開分析。** 「收到 100 封」本身不代表任何事：

| 100 封來自 | 轉換率 | 結論 |
| :--- | :--- | :--- |
| 200 次瀏覽 | 50% | 市場在尖叫，趕快做 |
| 20,000 次瀏覽 | 0.5% | 文章傳開了，但沒人想要這個東西 |

同一個分子，兩個相反的結論，而且**事後補不回來**。
Cloudflare Pages 的 Web Analytics 是免費的，也不放 cookie（所以不用同意橫幅）。

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
