# 《星星戀愛日記》V1 Source of Truth

版本：v1.0  
正式檔名：`docs/00-v1-source-of-truth.md`  
用途：作為《星星戀愛日記》V1 開發期間的**唯一文件索引、規格優先順序與衝突裁決基準**。  
適用對象：Codex、開發者、設計者、QA。

---

# 1. 文件目的

本文件不是功能規格本身，而是回答一個最重要的問題：

> **Codex 開發 V1 時，到底要相信哪一份文件？**

從本文件建立後開始：

- V1 開發前，先讀本文件
- 本文件列出的正式文件才是開發依據
- 若不同文件內容衝突，依本文件的優先順序裁決
- 未列入本文件的舊檔、截圖、聊天片段，不可直接當作正式規格
- 舊版資料模型、舊版 UI、過時功能構想不得覆蓋最新正式規格

---

# 2. V1 正式開發文件清單

Codex 每次開始新的 V1 開發工作前，應優先讀取以下文件。

## A. 第一優先：產品與資料基準

### 1. `docs/00-v1-source-of-truth.md`
用途：
- 文件索引
- 衝突裁決
- 開發順序
- V1 範圍界線

### 2. `docs/data-model.md`
用途：
- Local First 資料模型
- Entity / Repository
- SQLite / Storage
- Day N
- 星心值
- 日記
- 星星
- 清醒
- 七句心話
- 我記得的你
- 測驗歷史
- 備份
- Migration

**資料結構實作以此檔為最高基準。**

---

## B. 第二優先：整體 UI / 頁面架構

### 3. `docs/starry-love-diary-ui-component-page-list-v1.md`
用途：
- 全 App UI 元件
- 5 個主頁
- 設定頁
- 共用元件
- UI 開發順序
- 視覺共通原則

若頁面專屬規格與此檔不同：

> **以頁面專屬 UI 定稿規格為準。**

---

## C. 第三優先：頁面 UI 定稿

### 4. `docs/today-page-ui-spec-v1.md`
正式頁面：
- 今天

核心內容：
- 我的照片
- 對方照片
- 暱稱
- 星心值
- 戀愛星語
- 今天心情
- 一句心話
- 七句心話・照片顯影
- 近期重要日子

---

### 5. `docs/star-bottle-page-ui-spec-v1.md`
正式頁面：
- 星星瓶

核心內容：
- 心情星星
- 清醒星星
- 今日／本月／本年／全部
- 統計
- 搜尋
- 最近星星
- 查看全部

---

### 6. `docs/footprints-page-ui-spec-v1.md`
正式頁面：
- 足跡

核心內容：
- 月曆
- 日記
- 每篇最多 1000 字
- 每篇最多 3 張照片
- 當月統計
- 搜尋／篩選
- 最近足跡

---

### 7. `docs/our-page-ui-spec-v1.md`
正式頁面：
- 我們

核心內容：
- 回憶牆為最大主視覺
- 上方不放大型男女主角插畫
- 回憶牆 1～6 張
- 珍藏照片上限 60
- 統計卡
- 重要日子
- 我們的時刻
- 想對你說
- 我記得的你

---

### 8. `docs/clear-page-ui-spec-v1.md`
正式頁面：
- 清醒

核心內容：
- 今天，我需要哪一種清醒？
- 開始整理心情
- 暈船法典
- 戀愛腦檢測
- 喜歡？習慣？
- 最近一次整理
- 最近清醒紀錄
- 清醒星語
- 小提醒

---

### 9. `docs/settings-page-ui-spec-v1.md`
正式頁面：
- 設定

核心內容：
- 基本資料
- 重要日子
- 照片與回憶
- 日記與星星
- 清醒
- 通知
- 語言
- 隱私與資料
- 關於

---

## D. 第四優先：特色功能專屬規格

### 10. `docs/heart-reveal-spec-v1.md`
正式功能：
- 七句心話・照片顯影

核心規則：
- 一次 1 張照片
- 一天最多 1 句
- 每句最多 30 字
- 每句按 7 次愛心後成立
- 7 句完成後照片完整顯影
- 從 7 句選 1 句
- 固定分享版型
- 可重新產出完成卡

---

## E. 第五優先：內容庫

### 11. `docs/starry-love-quotes-365-v1.md`
正式內容：
- 365 天戀愛星語

核心規則：
- Day 1 由首次啟用日開始
- 每天只顯示 1 句
- 不看昨天
- 不看未來
- 當天未開啟即錯過
- 不收藏
- 不建立歷史
- Day 365 後循環 Day 1

---

# 3. V1 UI 正式視覺參考圖

建議專案內另建立：

```text
design/
└─ ui-reference/
   ├─ today.png
   ├─ star-bottle.png
   ├─ footprints.png
   ├─ our.png
   ├─ clear.png
   └─ settings.png
```

正式原則：

- 視覺參考圖負責「長相、層級、氛圍、構圖」
- `.md` 規格負責「互動、資料、限制、邏輯」
- 若圖片與 `.md` 衝突：
  - **功能邏輯以 `.md` 為準**
  - **視覺布局以最後確認的模擬圖為參考**

Codex 不應從圖片自行推測未寫在 `.md` 的功能。

---

# 4. 文件衝突優先順序

若規格衝突，請依以下優先順序裁決：

## Priority 1
`00-v1-source-of-truth.md`

只負責：
- 哪份文件有效
- 哪份文件優先
- 哪些功能已取消

## Priority 2
`data-model.md`

負責：
- 資料結構
- 欄位
- Local First
- Day N
- 上限
- 關聯
- 儲存
- Migration

## Priority 3
頁面專屬 UI 定稿規格

例如：
- `today-page-ui-spec-v1.md`
- `clear-page-ui-spec-v1.md`

負責：
- 頁面內容順序
- 互動
- 顯示方式
- 空狀態
- UI 行為

## Priority 4
功能專屬規格

例如：
- `heart-reveal-spec-v1.md`

負責：
- 特色功能完整流程

## Priority 5
全域 UI 文件

`starry-love-diary-ui-component-page-list-v1.md`

負責：
- 共用元件
- 全域視覺原則
- 頁面架構總覽

## Priority 6
模擬圖片

只作視覺參考。

---

# 5. 目前 V1 正式底部導覽

固定 5 頁：

1. 今天
2. 星星瓶
3. 足跡
4. 我們
5. 清醒

設定：

- 不放底部導航
- 從各主頁右上角進入

---

# 6. V1 已正式定案的核心規則

## 戀愛星語
- 365 句
- Day 365 後循環 Day 1
- 每天只顯示今日一句
- 不收藏
- 不建立歷史
- 不進星星瓶

## 星星瓶
只保留：
- 心情星星
- 清醒星星

正式取消：
- 戀愛星語星星
- 時光星星

## 日記
- 每篇最多 1000 字
- 每篇最多 3 張照片

## 一句心話
- 最多 20 句
- 每句最多 30 字
- 可編輯
- 可刪除
- 可排序

## 我記得的你
- 最多 50 張
- 標題自訂
- 內容最多 100 字
- 自動記錄建立本地日期
- 可搜尋
- 可愛心
- 可只看愛心

## 七句心話・照片顯影
- 一次只選 1 張照片
- 一天最多 1 句
- 每句最多 30 字
- 每句按 7 次愛心後成立
- 7 句完成照片完整顯影
- 完成後從 7 句選 1 句生成作品卡

## 清醒
所有功能皆：
- 隨時可做
- 隨時可重測
- 不設 30 天限制

包括：
- 開始整理心情
- 暈船法典
- 戀愛腦檢測
- 喜歡？習慣？

## 備份
V1：
- 只備份文字與結構化資料
- 不包含照片

## 首次 onboarding
第一次開啟 App：

必填：
- 我的暱稱
- 對方暱稱

其他資料不強迫首次完成。

---

# 7. V1 正式不做的功能

以下功能不得在 V1 開發中自行加入：

- 訂閱
- 廣告
- 虛擬貨幣
- 商城
- 家具／房間裝飾
- 寵物養成
- 抽卡
- AI 戀愛聊天機器人
- 他愛你幾 %
- 自動判定海王／海后
- 塔羅
- 星座
- 冥想音樂
- 療癒小工具
- App 內社群
- 留言
- 私訊
- Follow system
- App Store / Google Play 評分入口
- 聯絡我們
- 意見回饋
- 時光星星

如果 Codex 發現文件中仍有以上舊內容：

> **視為過時規格，不實作。**

---

# 8. V1 資料與隱私底線

1. Local First
2. 日記與私人照片不自動上傳
3. 分享需使用者主動觸發
4. 分享前提供預覽
5. 不自動分享至 Threads
6. V1 不把日記內容送至 AI API
7. 清除資料必須二次確認
8. 照片採 App 本機壓縮副本
9. 備份 V1 不包含照片
10. 權限採最小化原則

---

# 9. V1 語言

第一階段：

- `zh-TW`
- `en`
- `ja`
- `ko`
- `es`
- `fr`

正式原則：

- UI 從第一天就支援 i18n
- 固定文字不可寫死在圖片
- 日期 locale 化
- 西班牙文與法文作為長字串壓力測試

---

# 10. 正式開發順序

## Phase 0：骨架

先做：

- Project skeleton
- Design tokens
- Bottom Navigation
- App Header
- Routing
- i18n 六語架構
- Local DB / Repository layer
- Local Date Service
- Safe Area
- 共用卡片／按鈕／Dialog

**Phase 0 不一次完成所有功能。**

---

## Phase 1：Onboarding + 今天

- 首次暱稱
- 我的照片／對方照片
- 星心值
- 戀愛星語
- Mood
- 一句心話

---

## Phase 2：足跡

- 日記
- 月曆
- 搜尋
- 每篇最多 3 張照片
- 最近足跡

---

## Phase 3：星星瓶

- 心情星星
- 清醒星星
- 統計
- 搜尋
- 查看全部

---

## Phase 4：我們

- 回憶牆
- 1～6 張拼貼
- 60 張照片管理
- 重要日子
- 我們的時刻
- 想對你說
- 我記得的你

---

## Phase 5：七句心話・照片顯影

依：

`heart-reveal-spec-v1.md`

---

## Phase 6：清醒

- 導引入口
- 開始整理心情
- 暈船法典
- 戀愛腦檢測
- 喜歡？習慣？
- 最近紀錄
- 清醒星語

---

## Phase 7：設定

- 基本資料
- 照片與回憶
- 通知
- 語言
- 隱私
- 備份
- 關於

---

## Phase 8：QA / i18n / Device

- 6 語
- iOS
- Android
- Safe Area
- Migration
- Local persistence
- Backup
- Empty states
- Long text
- Photos
- Timezone

---

# 11. Codex 開工前固定流程

每一次 Codex 開始新任務前：

1. 讀 `00-v1-source-of-truth.md`
2. 讀與本任務相關的 UI / 功能規格
3. 若涉及資料，讀 `data-model.md`
4. 先說明準備修改哪些檔案
5. 不自行加入未定義功能
6. 完成後跑測試
7. 回報：
   - 修改檔案
   - 功能完成項目
   - 測試結果
   - 尚未完成
   - 是否有規格衝突

---

# 12. 規格衝突處理

Codex 若發現：

- 文件彼此衝突
- UI 與 data model 不一致
- 同一功能出現兩種上限
- 舊功能重新出現

不得自行猜測。

必須：

1. 停止衝突部分開發
2. 指出衝突文件與內容
3. 依本文件的優先順序判斷
4. 若仍無法判斷，再回報等待確認

---

# 13. 不可自行改變的產品理念

V1 所有開發必須守住：

> **記錄自己，也學習看懂對方。**

以及：

> **喜歡一個人沒有錯，只是別在喜歡他的時候，把自己弄丟了。**

產品不是：

- 戀愛判官
- 心理診斷 App
- 海王偵測器
- AI 算愛情
- 社群平台
- 戀愛遊戲商城

產品是：

> **私人記錄＋關係觀察＋自我清醒工具。**

---

# 14. V1 文件整理規則

`docs/` 根目錄只保留正式有效規格。

不建議同時存在：

```text
data-model-v1.0.md
data-model-v1.1.md
data-model-v1.2.md
data-model.md
```

正式確認後只保留：

```text
data-model.md
```

同理：

- 若某頁規格更新至 v2
- 舊版請移除或移入不會被 Codex 自動讀取的 archive

---

# 15. 建議最終 docs 結構

```text
docs/
├─ 00-v1-source-of-truth.md
├─ data-model.md
├─ v1-development-plan.md
├─ starry-love-diary-ui-component-page-list-v1.md
├─ today-page-ui-spec-v1.md
├─ star-bottle-page-ui-spec-v1.md
├─ footprints-page-ui-spec-v1.md
├─ our-page-ui-spec-v1.md
├─ clear-page-ui-spec-v1.md
├─ settings-page-ui-spec-v1.md
├─ heart-reveal-spec-v1.md
└─ starry-love-quotes-365-v1.md
```

設計參考：

```text
design/
└─ ui-reference/
   ├─ today.png
   ├─ star-bottle.png
   ├─ footprints.png
   ├─ our.png
   ├─ clear.png
   └─ settings.png
```

---

# 16. 開發基準結論

從本文件確認後開始：

> **`00-v1-source-of-truth.md` 是 V1 文件入口。**  
> **`data-model.md` 是資料結構唯一基準。**  
> **各頁 UI 定稿規格是頁面實作基準。**  
> **特色功能規格是流程實作基準。**  
> **模擬圖片只作視覺參考，不可取代文字規格。**

Codex 不應再從舊文件、舊聊天紀錄或過時構想推測需求。

---

# 17. 最終一句

> **先讀 Source of Truth，再寫任何一行 V1 程式。**
