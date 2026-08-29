# 《Codex UI 開發啟動指令 v1》

版本：v1.0  
用途：作為《星星戀愛日記》V1 正式進入 Codex UI 開發階段時的啟動指令與工作規範。  
建議放置：`docs/codex-ui-development-start-v1.md`

---

# 1. 開發目標

本階段目標不是一次完成全部 App 功能，而是先依正式 UI 定稿圖與規格文件，建立：

1. V1 專案 UI 骨架
2. 5 個底部主頁
3. 設定頁
4. 共用元件
5. 基礎 routing
6. Design Tokens
7. 六語 i18n 架構
8. 手機 safe area
9. 可後續接入 Local First 資料層的 UI 結構

本階段優先：

> **先把畫面做對、結構做穩，再逐步接資料與互動。**

---

# 2. Codex 開工前必讀文件

每次開始新的 UI 任務前，Codex 必須先閱讀：

## 第一優先
`docs/00-v1-source-of-truth.md`

用途：
- 確認哪些規格有效
- 確認哪些舊功能已取消
- 確認文件衝突優先順序

---

## 第二優先
`docs/data-model.md`

用途：
- 確認資料來源
- 欄位名稱
- Local First
- Day N
- 星心值
- 測驗歷史
- 圖片資料
- Migration

---

## 第三優先
`docs/starry-love-diary-ui-component-page-list-v1.md`

用途：
- 共用 UI 元件
- 視覺系統
- 5 個主頁架構
- 共用卡片／按鈕／Header／BottomNav

---

## 第四優先
本次正在開發頁面的專屬規格。

例如 Today Page 必讀：

`docs/today-page-ui-spec-v1.md`

---

# 3. UI 原型圖片參考

Codex 應同時參考：

```text
design/ui-reference/
├─ 01-today.png
├─ 02-star-bottle.png
├─ 03-footprints.png
├─ 04-our.png
├─ 05-clear.png
└─ 06-settings.png
```

圖片用途：

- 看整體構圖
- 卡片比例
- 視覺層級
- 色彩氛圍
- 區塊位置
- 留白
- 元件大致風格

但：

> **功能、資料限制與互動邏輯，以 md 規格為準。**

Codex 不可自行把原型圖中的示意數字、示意日期、示意文字，當成固定資料。

---

# 4. UI 原型圖與規格檔對應

| UI 圖 | 對應規格 |
|---|---|
| `01-today.png` | `docs/today-page-ui-spec-v1.md` |
| `02-star-bottle.png` | `docs/star-bottle-page-ui-spec-v1.md` |
| `03-footprints.png` | `docs/footprints-page-ui-spec-v1.md` |
| `04-our.png` | `docs/our-page-ui-spec-v1.md` |
| `05-clear.png` | `docs/clear-page-ui-spec-v1.md` |
| `06-settings.png` | `docs/settings-page-ui-spec-v1.md` |

---

# 5. 正式 UI 開發順序

## Phase UI-0：基礎骨架

先建立：

- App shell
- Routing
- 5 個底部 tabs
- 設定頁 route
- Page container
- Safe area
- Scroll behavior
- Design tokens
- Typography tokens
- Spacing tokens
- Radius tokens
- Shadow tokens
- 共用 Header
- 共用 Card
- 共用 Button
- 共用 BottomNavigation
- 共用 EmptyState
- 共用 ConfirmDialog
- i18n skeleton

此階段不急著接完整資料。

---

## Phase UI-1：Today Page

依：

- `docs/today-page-ui-spec-v1.md`
- `design/ui-reference/01-today.png`

先完成靜態版：

- 品牌區
- 設定入口
- 我的照片
- 對方照片
- 暱稱
- 星心值
- 戀愛星語
- 今日心情
- 一句心話
- 七句心話・照片顯影
- 近期重要日子
- BottomNav active state

---

## Phase UI-2：Star Bottle

依：

- `docs/star-bottle-page-ui-spec-v1.md`
- `design/ui-reference/02-star-bottle.png`

完成：

- 星星瓶主視覺
- 今日／本月／本年／全部
- 總星數
- 心情星星
- 清醒星星
- 搜尋
- 星星列表
- 查看全部星星
- BottomNav active state

---

## Phase UI-3：Footprints

依：

- `docs/footprints-page-ui-spec-v1.md`
- `design/ui-reference/03-footprints.png`

完成：

- 月曆
- 當月統計
- 搜尋
- 篩選
- 今天的日記
- 3 張照片版型
- 最近足跡
- BottomNav active state

---

## Phase UI-4：Our

依：

- `docs/our-page-ui-spec-v1.md`
- `design/ui-reference/04-our.png`

完成：

- 大面積回憶牆
- 1～6 張拼貼
- 統計卡
- 重要日子
- 我們的時刻
- 想對你說
- 我記得的你
- BottomNav active state

特別注意：

> 回憶牆必須是此頁最大視覺區塊。

---

## Phase UI-5：Clear

依：

- `docs/clear-page-ui-spec-v1.md`
- `design/ui-reference/05-clear.png`

完成：

- 今天，我需要哪一種清醒？
- 5 個導引入口
- 開始整理心情
- 暈船法典
- 戀愛腦檢測
- 喜歡？習慣？
- 最近一次整理
- 最近清醒紀錄
- 清醒星語
- 小提醒
- BottomNav active state

---

## Phase UI-6：Settings

依：

- `docs/settings-page-ui-spec-v1.md`
- `design/ui-reference/06-settings.png`

完成：

- 返回
- 基本資料
- 重要日子
- 照片與回憶
- 日記與星星
- 清醒
- 通知
- 語言
- 隱私與資料
- 關於

設定頁：

> **不顯示底部 5 導覽。**

---

# 6. 第一輪只做「靜態 UI」

第一輪 Codex 任務：

- 不接正式 SQLite
- 不接完整 Repository
- 不做複雜資料同步
- 不做完整通知
- 不做匯出／備份
- 不做真實分享
- 不做測驗計分

可以先使用：

- mock data
- fake local state
- placeholder image
- static list

目的：

> **先讓六個主要頁面的 UI 與導覽完全跑起來。**

---

# 7. 第二輪再接互動

UI 靜態版通過後，再加入：

## Today
- mood 點選
- 一句心話編輯
- 七句顯影入口
- 分享按鈕
- 設定跳轉

## Star Bottle
- filter 切換
- 搜尋
- 星星詳情

## Footprints
- 月份切換
- 日期選擇
- 新增日記
- 編輯日記
- 刪除日記
- 圖片選取

## Our
- 回憶牆切換
- 時刻 carousel
- 想對你說編輯
- 我記得的你搜尋／愛心

## Clear
- 導引跳轉
- 清醒流程
- 測驗入口
- 最近紀錄

## Settings
- 修改暱稱
- 修改照片
- 日期選擇
- toggle
- 語言切換

---

# 8. 第三輪才接 Local First 資料

當 UI 與互動穩定後：

- SQLite
- Repository layer
- Local storage
- PhotoAsset
- App sandbox
- Day N service
- Star Heart Event
- Search indexes
- Backup
- Migration

資料層必須依：

`docs/data-model.md`

---

# 9. Design Tokens 原則

Codex 不可在每個頁面散落大量硬編碼樣式。

至少建立：

```text
src/theme/
├─ colors
├─ spacing
├─ radius
├─ typography
├─ shadows
└─ sizes
```

建議主要視覺：

- 奶油白背景
- 柔和粉紅
- 淡藍
- 淡紫
- 淡綠
- 淡黃星光色

要求：

- 不使用高飽和 neon
- 不使用大量純黑
- 不使用警告紅做一般 UI

---

# 10. 共用元件優先

Codex 應優先建立 reusable components：

- `PageHeader`
- `BottomNavigation`
- `SectionHeader`
- `SoftCard`
- `PrimaryButton`
- `SecondaryButton`
- `IconButton`
- `SearchBar`
- `FilterChip`
- `EmptyStateCard`
- `ConfirmDialog`
- `PhotoFrame`
- `SettingsRow`

如果兩個以上頁面使用類似 UI：

> 優先抽成共用元件，不複製貼上。

---

# 11. Bottom Navigation 規格

固定 5 頁：

1. 今天
2. 星星瓶
3. 足跡
4. 我們
5. 清醒

要求：

- 固定底部
- iOS safe area 正常
- Android navigation bar 正常
- active state 清楚
- icon + label
- 不因頁面捲動消失

Settings 不顯示 BottomNav。

---

# 12. Responsive / Mobile 原則

V1 主要目標：

- iPhone
- Android phone

要求：

- 不以桌面版為主
- 不固定整頁 pixel 高度
- 所有長頁可垂直 scroll
- 卡片高度依內容自動
- 小手機仍可操作
- 大手機不過度拉伸

---

# 13. i18n UI 原則

從第一輪 UI 就必須使用 i18n key。

禁止：

```text
<button>今天</button>
```

應使用類似：

```text
t("nav.today")
```

第一階段：

- zh-TW
- en
- ja
- ko
- es
- fr

要求：

- 西班牙文／法文長字串不破版
- 按鈕可延展
- 卡片高度可變
- 日期 locale 化

---

# 14. 圖片與插畫原則

UI 參考圖中的角色、花園、裝飾只作視覺方向。

實作時：

- 優先使用正式 assets
- 若正式素材未備齊，可先 placeholder
- 不可把整張 UI 原型圖直接當背景
- 不可把按鈕文字燒死在圖片內
- 所有可互動元件必須是真實 HTML / React 元件

---

# 15. 禁止「截圖式 UI」

Codex 不可：

- 把整張 UI mockup 當成一張圖片直接鋪滿手機
- 用 hotspot 假裝按鈕
- 把文字固定在圖片裡

目標必須是：

> **真正可操作、可 i18n、可維護的 UI 元件。**

---

# 16. 每完成一頁的回報格式

Codex 每完成一頁後，必須回報：

## A. 已修改檔案

例如：

```text
src/pages/TodayPage.tsx
src/components/DailyLoveQuoteCard.tsx
src/components/MoodSelector.tsx
src/theme/colors.ts
```

## B. 已完成功能

例如：

- Today page static UI
- BottomNav active state
- Mood mock interaction

## C. 尚未接入

例如：

- SQLite
- 真實照片選取
- 分享 API

## D. 測試結果

例如：

```text
npm test
npm run build
npm run lint
```

## E. 規格衝突

若有：

- 明確指出
- 不自行猜測

---

# 17. 每一階段必跑測試

至少：

```text
npm run build
npm run lint
npm test
```

若專案尚無測試：

- 先建立基本 smoke test
- 確認每個 route 可 render
- 確認 BottomNav 可切換

---

# 18. 不允許 Codex 自行新增的功能

不得自行加入：

- 訂閱
- 廣告
- 商城
- 虛擬貨幣
- 寵物養成
- AI 聊天
- 塔羅
- 星座
- 社群
- 留言
- 私訊
- 排行榜
- 打卡 streak
- 他愛你幾 %
- 時光星星

若看見舊文件殘留：

> 視為過時，不實作。

---

# 19. 第一個正式 Codex 任務

建議第一輪直接貼給 Codex：

---

## Codex Prompt — Phase UI-0

請先閱讀：

1. `docs/00-v1-source-of-truth.md`
2. `docs/data-model.md`
3. `docs/starry-love-diary-ui-component-page-list-v1.md`

再檢查目前專案結構。

本次只執行 **Phase UI-0：V1 UI 基礎骨架**。

請完成：

- 建立或整理 App shell
- 5 個底部主頁 route：
  - Today
  - Star Bottle
  - Footprints
  - Our
  - Clear
- 建立 Settings route
- 建立固定 BottomNavigation
- Settings 不顯示 BottomNavigation
- 建立共用 PageHeader
- 建立 Design Tokens：
  - colors
  - spacing
  - radius
  - typography
  - shadows
- 建立 i18n 六語基礎架構：
  - zh-TW
  - en
  - ja
  - ko
  - es
  - fr
- 建立 Mobile Safe Area
- 所有頁面先以簡單 placeholder 呈現
- 不接 SQLite
- 不接正式資料
- 不做新功能

完成後：

1. 跑 build
2. 跑 lint
3. 跑目前測試
4. 回報修改檔案
5. 回報完成項目
6. 回報尚未完成項目
7. 若發現規格衝突，停止該部分並回報

---

# 20. 第二個正式 Codex 任務

Phase UI-0 通過後，再貼：

---

## Codex Prompt — Today Page Static UI

請先閱讀：

1. `docs/00-v1-source-of-truth.md`
2. `docs/data-model.md`
3. `docs/today-page-ui-spec-v1.md`

並參考：

`design/ui-reference/01-today.png`

本次只完成：

# Today Page 靜態 UI

要求：

- 盡量接近正式 UI 參考圖的布局與視覺層級
- 不把整張 mockup 當背景圖
- 所有 UI 必須是真實元件
- 所有文字使用 i18n key
- 使用 mock data
- 不接 SQLite
- 不做真實分享
- 不做真實照片選取

需完成：

- Header
- Settings entry
- Couple profile hero
- Star heart value
- Daily love quote
- Mood selector
- Heart line
- Heart reveal progress
- Upcoming important date
- BottomNavigation active state

完成後跑：

- build
- lint
- tests

並回報結果。

---

# 21. UI 開發完成標準

一頁要算完成，至少必須：

- [ ] Layout 與原型圖接近
- [ ] 元件是真實 UI，不是截圖
- [ ] 所有文字 i18n
- [ ] 小螢幕不破版
- [ ] 可以垂直 scroll
- [ ] BottomNav 正常
- [ ] active state 正確
- [ ] Settings route 正常
- [ ] build PASS
- [ ] lint PASS
- [ ] test PASS 或說明尚未建立的測試

---

# 22. 最終開發原則

> **先做骨架，再做畫面。**  
> **先做畫面，再接互動。**  
> **先讓互動穩定，再接 Local First 資料。**

不要：

> 一次要求 Codex 把整個 App 全部做完。

每次只完成一個可驗收的小階段。

---

# 23. 最終一句

> **請 Codex 先讀規格、照原型做真實 UI 元件，完成一頁、驗收一頁，再往下一頁。**
