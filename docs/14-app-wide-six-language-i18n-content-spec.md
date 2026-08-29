# 星星戀愛日記｜App 全頁面六語 i18n 內容規格
## App-Wide Six-Language i18n Content Spec

檔名：`14-app-wide-six-language-i18n-content-spec.md`
版本：V1
用途：Milestone 4C-3－全 App UI、導覽、按鈕、表單、錯誤、空狀態、分享、日期數字與 Accessibility 六語化
適用語言：
- 繁體中文 `zh-TW`
- English `en`
- 日本語 `ja`
- 한국어 `ko`
- Español `es`
- Français `fr`

---

# 1. 文件目的

本文件定義《星星戀愛日記》整個 App 的六語 i18n 範圍與驗收規則。

本規格不只處理「頁面標題」或「按鈕翻譯」，而是要確保：

> **所有使用者看得到、聽得到、分享得到、錯誤時會看到的文字，都能依目前 locale 正確顯示。**

本文件與以下規格互補：

- `12-clear-tools-six-language-localization-spec.md`
  - 清醒四工具題目、結果、提示、歷史與相關互動文案
- `13-daily-love-quotes-six-language-localization-spec.md`
  - 365 天戀愛星語
- 本文件 `14`
  - 整個 App 共用 UI、所有頁面、設定、導覽、對話框、錯誤、空狀態、分享、數字日期與 accessibility

---

# 2. i18n 完整範圍

六語化範圍必須包含：

1. Onboarding
2. 今天
3. 星星瓶
4. 足跡
5. 我們
6. 清醒
7. 設定
8. 所有次頁
9. Bottom Navigation
10. Top Bar
11. Dialog / Confirmation
12. Toast / Snackbar
13. Empty State
14. Error Message
15. Validation Message
16. Form Label
17. Placeholder
18. Helper Text
19. Filter / Sort / Search
20. Date / Time / Number / Unit
21. Share Text
22. Share Card UI text
23. Accessibility / aria-label / alt
24. Permission / system-facing copy shown by app
25. App-level fallback / loading / unavailable state

---

# 3. 核心原則

## 3.1 UI 不得 hardcode 中文

錯誤：

```tsx
<button>儲存</button>
```

正確方向：

```tsx
<button>{t("common.save")}</button>
```

所有 React / TS / TSX 元件都必須遵守。

---

# 4. Stable Key 與顯示文字分離

Stable key 永遠固定。

例如：

```ts
common.save
common.cancel
common.delete
nav.today
nav.starBottle
nav.footprints
nav.our
nav.clear
settings.language
```

不同 locale 只改 value。

不得因英文翻譯而把 key 改成：

```ts
common.saveButtonEnglish
```

---

# 5. Canonical 語言

`zh-TW` 為 UI 內容 canonical source。

流程：

```text
zh-TW 定稿
↓
語意分類
↓
EN
↓
JA
↓
KO
↓
ES
↓
FR
↓
跨語言 QA
```

不得直接將未定稿中文字串批次機翻後視為完成。

---

# 6. 全 App String Inventory

開始 4C-3 前必須建立一份完整字串盤點。

建議分類：

```text
common.*
nav.*
onboarding.*
today.*
starBottle.*
footprints.*
our.*
clear.*
settings.*
dialog.*
toast.*
error.*
validation.*
empty.*
share.*
accessibility.*
date.*
unit.*
```

---

# 7. Common 共用字串

至少包含：

```text
儲存
取消
確認
完成
下一步
上一步
返回
關閉
編輯
刪除
新增
搜尋
清除
分享
查看全部
查看歷史
稍後繼續
重新開始
再試一次
知道了
完成這次整理
```

建議 key：

```ts
common.save
common.cancel
common.confirm
common.done
common.next
common.previous
common.back
common.close
common.edit
common.delete
common.add
common.search
common.clear
common.share
common.viewAll
common.viewHistory
common.continueLater
common.restart
common.retry
common.gotIt
```

---

# 8. Bottom Navigation

五個主分頁：

```text
今天
星星瓶
足跡
我們
清醒
```

Stable keys：

```ts
nav.today
nav.starBottle
nav.footprints
nav.our
nav.clear
```

Settings 不在 bottom nav，但需：

```ts
nav.settings
```

---

# 9. Top Bar / Secondary Page

需六語化：

- 返回
- 設定
- 頁面標題
- 關閉
- 更多
- 編輯
- 完成

若 icon-only：

```text
aria-label
```

也必須六語化。

---

# 10. Onboarding

首次啟動至少盤點：

```text
歡迎來到星星戀愛日記
記錄心動，也照顧自己的心
我的名字／暱稱
對方名字／暱稱
照片可以之後再加入
開始記錄
稍後設定
```

如有 onboarding step indicator：

```text
第 1 步，共 2 步
```

也必須 locale-aware。

---

# 11. Onboarding 表單

需涵蓋：

- Label
- Placeholder
- Helper Text
- Required Message
- Character Limit
- CTA

例如：

```ts
onboarding.myNickname.label
onboarding.myNickname.placeholder
onboarding.otherNickname.label
onboarding.otherNickname.placeholder
onboarding.photo.optional
onboarding.start
```

---

# 12. 今天頁 Today

需完整六語化：

```text
星心值
今日戀愛星語
今天的心情
一句心話
七句心話
照片顯影
今天的日記
重要日子
今天
```

以及所有卡片的：
- 標題
- 副標
- helper
- CTA
- empty
- error
- confirmation
- accessibility

---

# 13. Today Profile 區

需涵蓋：

```text
我的照片
對方的照片
更換照片
移除照片
我的暱稱
對方暱稱
```

如是 placeholder star：

alt / aria 也需六語。

---

# 14. 星心值

不要 hardcode：

```tsx
星心值 {score}
```

建議：

```ts
today.score.label
today.score.value
```

分數本身使用 locale number formatting。

---

# 15. Today Mood

Stable mood keys：

```ts
heartbeat
happy
secure
missing
uneasy
sad
ruminating
```

顯示標籤：

```text
心動
開心
安心
想念
不安
難過
內耗
```

翻譯只改 label。

不得把 localized string 當資料值。

---

# 16. 一句心話

需盤點：

```text
一句心話
寫下一句現在最想說的話
最多 30 個字
已完成第 X 次
再按 X 次
接受這句心話
已達 20 則上限
編輯
刪除
```

若七次 ritual 有狀態文字，也全部 i18n。

---

# 17. 七句心話・照片顯影

需盤點：

```text
七句心話
照片顯影
已完成 X / 7
選擇照片
更換照片
移除照片
選擇最喜歡的一句
建立分享卡
已完成顯影
```

所有 `X / 7` 使用 locale number formatting。

---

# 18. Today Diary

需盤點：

```text
今天的日記
今天想寫些什麼？
儲存日記
編輯日記
刪除日記
最多 1000 個字
尚未寫日記
```

如有自動儲存提示：

```text
已儲存
正在儲存
儲存失敗
```

也需六語化。

---

# 19. Important Date Preview

首頁若顯示：

```text
距離紀念日還有 X 天
今天是重要日子
已經過了 X 天
```

需要：
- 日期格式
- pluralization
- 單位
- 相對日期

不可直接拼中文。

---

# 20. 星星瓶 Star Bottle

需盤點：

```text
星星瓶
今日
本月
本年
全部
心情星星
清醒星星
最近的星星
查看全部
搜尋星星
共 X 顆
沒有星星
沒有符合條件的星星
```

---

# 21. Star Filter Stable Keys

```ts
today
month
year
all
```

顯示 label localized。

不得以：

```ts
if (filter === "今日")
```

判斷。

---

# 22. Star Type Stable Keys

```ts
mood
clear_mind
```

顯示：

```text
心情星星
清醒星星
```

翻譯不影響資料。

---

# 23. Star Count / Pluralization

禁止：

```ts
`${count} 顆星星`
```

應使用 i18n plural rules。

例如英文：

```text
1 star
2 stars
```

法文、西班牙文依各 locale plural rule。

---

# 24. 足跡 Footprints

需六語化：

```text
足跡
月曆
今天
最近足跡
今天的日記
搜尋日記
全部
有日記
有心情
有照片
有清醒紀錄
查看全部
```

---

# 25. Calendar

不得 hardcode：

```text
週一
週二
一月
二月
```

使用 locale formatter 或 locale calendar data。

需測：

- 月份
- 星期
- 今日
- selected date
- 年月顯示

---

# 26. Footprint Record Types

Stable keys：

```ts
diary
mood
photo
clear
```

UI label localized。

---

# 27. Diary Search

需涵蓋：

```text
搜尋日記
輸入關鍵字
沒有符合的日記
清除搜尋
```

---

# 28. 我們 Our

需完整盤點：

```text
我們
回憶牆
關係統計
重要日子
我們的時刻
想對你說
我記得的你
查看全部
新增
編輯
刪除
收藏
全部
搜尋
```

---

# 29. 關係統計

可能出現：

```text
星心值
累積日記
重要日子
我們的時刻
顯影完成
```

若某統計尚無真正資料來源：
不得因翻譯工作自行建立新邏輯。

---

# 30. 重要日子

Stable keys：

```ts
first_chat
first_meeting
first_date
confession
dating
birthday
anniversary
trip
custom
```

UI labels：

```text
第一次聊天
第一次見面
第一次約會
告白
正式交往
生日
紀念日
旅行
自訂
```

六語全部補齊。

---

# 31. Important Date Form

需涵蓋：

```text
新增重要日子
編輯重要日子
類型
日期
標題
說明
照片
提醒
刪除
儲存
```

---

# 32. 我們的時刻 Memory Moments

需涵蓋：

```text
我們的時刻
新增時刻
日期
故事
照片
最近
全部
已達 20 則上限
```

如尚未做 photo picker，i18n 不得虛構不存在的功能。

---

# 33. 想對你說

需涵蓋：

```text
想對你說
寫下一段想對對方說的話
最多 300 個字
儲存
編輯
清空
分享
```

清空 confirmation 必須六語。

---

# 34. 我記得的你

需涵蓋：

```text
我記得的你
新增一張記憶卡
標題
內容
最多 100 個字
收藏
取消收藏
只看收藏
全部
搜尋
已達 50 張上限
```

---

# 35. 清醒 Clear

本頁框架 UI 由本文件負責。

四工具內部題目與結果文案主要依 `12`。

本頁需至少六語化：

```text
清醒
今天，我需要哪一種清醒？
開始整理心情
暈船法典
戀愛腦檢測
喜歡？習慣？
最近的清醒紀錄
查看歷史
清醒星語
```

---

# 36. Clear Scenario Cards

至少盤點：

```text
我一直想他
我在等他的訊息
我覺得自己暈太深
我不知道還喜不喜歡他
我不知道這個人適不適合我
```

如這些 scenario 已在 `12` 定義，以 `12` 為語意規格，本文件只要求 UI 完整 i18n。

---

# 37. 清醒歷史

需涵蓋：

```text
清醒紀錄
最近
全部
沒有清醒紀錄
查看結果
刪除紀錄
重新做一次
```

---

# 38. 設定 Settings

九大區塊：

```text
基本資料
重要日子
照片與回憶
日記與星星
清醒
通知
語言
隱私與資料
關於
```

全部六語。

---

# 39. 基本資料

需涵蓋：

```text
我的暱稱
對方暱稱
我的照片
對方照片
儲存
```

---

# 40. 照片與回憶

需盤點：

```text
管理照片
回憶牆
我們的時刻
照片上限
```

若 V1 尚未做功能，僅翻現有 UI，不新增不存在的入口。

---

# 41. 日記與星星

需盤點現有設定：

```text
日記
星星
資料統計
```

不得因 i18n 任務增加新 scoring option。

---

# 42. 通知

需六語化：

```text
提醒寫日記
戀愛星語提醒
通知時間
開啟
關閉
```

如果 native notification 尚未實作：

> 只翻現有 UI，不假裝通知已可真正排程。

---

# 43. 語言設定

語言顯示建議：

```text
繁體中文
English
日本語
한국어
Español
Français
```

語言名稱原則：
優先顯示該語言自己的名稱。

Stable locale：

```ts
zh-TW
en
ja
ko
es
fr
```

---

# 44. 隱私與資料

需盤點：

```text
資料備份
匯出資料
清空目前戀情資料
隱私權政策
```

所有 destructive action 需 confirmation。

---

# 45. 關於

需盤點：

```text
星星戀愛日記
版本
隱私權政策
```

如有 build number：
使用程式值，不翻譯。

---

# 46. Dialog / Confirmation

所有對話框需六語。

至少：

```text
確定要刪除嗎？
刪除後無法復原。
確定要清空嗎？
目前進度會被清除。
要重新開始嗎？
取消
確認
刪除
```

---

# 47. Clear Record Delete Dialog

若已有：

```text
只刪除紀錄
刪除紀錄與清醒星星
取消
```

六語需完整。

---

# 48. Toast / Snackbar

需盤點：

```text
已儲存
已更新
已刪除
已新增
已分享
已複製
已存成清醒星星
儲存失敗
刪除失敗
載入失敗
請稍後再試
```

---

# 49. Empty State

每個主要區塊都需要 locale 字串。

至少：

```text
還沒有日記
今天還沒有心情紀錄
星星瓶裡還沒有星星
還沒有重要日子
還沒有我們的時刻
還沒有「我記得的你」
還沒有清醒紀錄
找不到符合搜尋的內容
```

---

# 50. Error Message

UI 不直接顯示技術錯誤碼。

建議：

```ts
error.loadFailed
error.saveFailed
error.deleteFailed
error.notFound
error.unknown
```

畫面再依 locale 顯示。

---

# 51. Validation

所有 validation 必須 i18n。

至少：

```text
此欄位為必填
最多 30 個字
最多 100 個字
最多 150 個字
最多 300 個字
最多 1000 個字
請至少選擇一項
請完成必要欄位
```

---

# 52. Validation Code 與文案分離

資料層回傳：

```ts
"diary.maxLength"
"heartPhrase.maxLength"
"rememberedYou.maxLength"
"required"
```

UI 翻譯成目前 locale。

不得從 repository 直接回傳中文。

---

# 53. Character Count

顯示：

```text
12 / 30
```

可直接格式化數字。

若需要文字：

```text
剩餘 X 字
```

必須 i18n + plural aware。

---

# 54. Form Placeholder

Placeholder 也算正式 UI 文案。

例如：

```text
今天想寫些什麼？
我欣賞他的地方……
搜尋日記
搜尋記憶
```

不得漏翻。

---

# 55. Helper Text

例如：

```text
照片可以之後再加入
你可以稍後再繼續
這個答案不會影響分數
```

只要使用者看得到就必須納入 i18n。

---

# 56. Search / Filter / Sort

需六語化：

```text
搜尋
篩選
排序
最近
最舊
全部
收藏
清除條件
```

若 UI 目前沒有 sort，不要因翻譯規格新增功能。

---

# 57. 日期格式

不得手動拼：

```ts
`${year}/${month}/${day}`
```

使用 locale-aware formatter。

需支援：

```text
zh-TW
en
ja
ko
es
fr
```

---

# 58. 月份與星期

使用 Intl / locale formatter。

避免建立只有中文的固定陣列：

```ts
["一月", "二月", ...]
```

除非是每 locale 資源明確管理。

---

# 59. Relative Date

例如：

```text
今天
昨天
明天
X 天前
還有 X 天
```

需要 locale-aware phrasing。

英文：
- 1 day
- 2 days

不能把中文量詞結構套用。

---

# 60. 數字

使用 locale number formatting。

例如：

```ts
new Intl.NumberFormat(locale)
```

適用：
- 星心值
- 星星數
- 日記數
- 天數
- 完成數
- 顯影進度

---

# 61. Pluralization

至少處理：

```text
star / stars
day / days
entry / entries
photo / photos
record / records
```

EN / ES / FR 必須使用 locale plural rule。

JA / KO / zh-TW 不一定需要同樣 plural 變化，但仍使用同一 i18n 系統。

---

# 62. 單位

避免：

```ts
`${count} 顆`
`${count} 篇`
`${count} 張`
```

全部 i18n。

例如：

```ts
unit.star
unit.diaryEntry
unit.photo
unit.day
unit.record
```

---

# 63. Share Text

需涵蓋：

- 戀愛星語
- 一句心話
- 七句心話照片顯影
- 清醒結果
- 想對你說

分享當下使用目前 locale。

---

# 64. Share 不儲存中文全文作 template

若分享卡可重建：

儲存 stable key / record data。

不要將中文 template 寫死在資料庫。

---

# 65. Share Card

所有可見文字：
- title
- subtitle
- quote
- footer
- app name
- action label

需依 locale render。

不把文字 baked into PNG asset。

---

# 66. Accessibility

必須六語化：

```text
返回
關閉
設定
刪除
編輯
新增
選擇照片
更換照片
移除照片
我的個人照片
對方照片
```

用於：
- aria-label
- alt
- screen-reader-only text

---

# 67. Icon-only Buttons

所有 icon-only 按鈕必須有：

```tsx
aria-label={t("...")}
```

禁止只靠 icon 意義。

---

# 68. 圖片 Alt

若圖片是純裝飾：

```html
alt=""
```

若有資訊意義：

使用 localized alt。

不要所有圖片都硬塞中文 alt。

---

# 69. Loading State

需盤點：

```text
載入中
正在儲存
正在處理
```

如畫面有 skeleton 而無文字，可不新增無用字串。

---

# 70. Offline / Local First

若 App 顯示：

```text
資料已儲存在這台裝置
```

或其他 Local First 提示，也必須六語化。

但 i18n 工作不得新增新的隱私承諾文字。

---

# 71. Permission Copy

如未來 photo / notification permission 由 App 自己顯示前置說明：

需要六語化。

但原生 OS permission usage description 另依 Capacitor / platform 設定管理。

---

# 72. 版本更新文案

若 App 有：

```text
有新版本可用
稍後
更新
```

需六語。

若 V1 尚未有 update flow，不因此新增。

---

# 73. Hardcoded Chinese Audit

4C-3 必須執行：

```text
src/**/*.ts
src/**/*.tsx
src/**/*.js
src/**/*.jsx
```

搜尋可疑中文 UI 字串。

目的：
找出遺漏的：
- 刪除
- 儲存
- 暫無資料
- 確認
- 錯誤
- 搜尋
- Placeholder
- Toast
- Dialog

---

# 74. Audit 不能盲目刪中文字

需區分：

1. UI hardcoded Chinese → 必須修
2. 中文 locale resource → 正常
3. comment / test fixture → 視情況
4. canonical quote data → 正常
5. user-generated content → 不翻譯

---

# 75. User-Generated Content 不翻譯

以下內容保持使用者原文：

- 日記
- 一句心話
- 想對你說
- 我記得的你
- Important Date 自訂標題
- 自訂說明
- Clear 自由輸入內容

切換 locale 後不自動翻譯。

---

# 76. System Content 才翻譯

系統預寫內容才 i18n：

- Label
- Prompt
- Question
- Result
- Hint
- Error
- Empty state
- Button
- Template

---

# 77. Locale 切換資料不變

必測：

```text
zh-TW 建立資料
↓
切 en
↓
資料仍存在
↓
系統 UI 改英文
↓
使用者自己輸入的中文仍保持原文
```

---

# 78. Locale 切換位置不應重置

例如：

```text
正在編輯今天日記
↓
切語言
```

若 architecture 支援不中斷切換：
應保持內容與狀態。

至少不得刪資料、改 score、改日期。

---

# 79. History 顯示

歷史資料中的：
- 日期 → 用目前 locale formatter
- 系統分類 → 用目前 locale label
- 使用者輸入 → 保持原文
- result stable key → 依目前 locale render

---

# 80. Setting Locale Persistence

使用者選擇 locale 後需 persistence。

App 重開仍使用該 locale。

Stable locale：

```ts
zh-TW
en
ja
ko
es
fr
```

---

# 81. Fallback

開發期可有 fallback locale。

正式上線前要求：

```text
Missing Key = 0
Empty Value = 0
```

不能依賴 fallback 掩蓋未完成翻譯。

---

# 82. Missing Key Audit

六語各自：

```text
zh-TW missing = 0
en missing = 0
ja missing = 0
ko missing = 0
es missing = 0
fr missing = 0
```

---

# 83. Key Set 必須一致

六個 locale key set 應一致。

例如：

```text
zh-TW keys == en keys == ja keys == ko keys == es keys == fr keys
```

除極少 locale-specific technical case，否則不得不同。

---

# 84. Empty Value Audit

禁止：

```json
"common.save": ""
```

即使 key 存在也算失敗。

---

# 85. Duplicate Key / Shadow Key

避免：

```text
common.save
common.saveButton
common.save_btn
common.saveAction
```

若同語意可共用，應收斂。

但如果語境不同會導致語法不自然，可建立 context-specific key。

---

# 86. 不要過度共用字串

例如中文「全部」在不同語境可能：
- filter all
- view all
- all records

英文未必都能共用同一字。

因此：

> **共用以語意為單位，不以中文字面相同為單位。**

---

# 87. i18n 命名原則

建議：

```text
domain.section.element.state
```

例如：

```ts
today.diary.title
today.diary.placeholder
today.diary.empty
today.diary.save
starBottle.filter.today
our.importantDate.add
settings.language.title
dialog.deleteRecord.title
```

---

# 88. 不用中文當 key

不建議：

```ts
t("儲存")
```

應使用 stable semantic key：

```ts
t("common.save")
```

---

# 89. Responsive QA

六語至少測：

```text
320px
390px
432px
```

頁面：
- Onboarding
- Today
- Star Bottle
- Footprints
- Our
- Clear
- Settings
- Dialog
- Share preview

---

# 90. Responsive 驗收

要求：

```text
Overflow = 0
Clipping = 0
Broken layout = 0
Bottom-nav obstruction = 0
Unusable tiny font = 0
```

---

# 91. 西班牙文 / 法文

特別注意：
- Button 變長
- Section title 變長
- Dialog action 變長
- Helper text 變長
- Filter chip 變長

不可只靠縮小字級解決。

優先：
- allow wrap
- flexible width
- responsive layout
- 更自然簡短的翻譯

---

# 92. 日文 / 韓文

特別注意：
- 不自然換行
- 單字被切錯
- button 過窄
- 過度敬語
- 中文式語序

---

# 93. English

特別注意：
- singular / plural
- sentence case consistency
- button wording consistency
- 不把中文四字標題硬翻成冗長片語

---

# 94. Translation QA 層級

每個 locale：

## A. Completeness
有沒有全部翻？

## B. Semantic
意思對不對？

## C. Naturalness
像不像當地人會用？

## D. UI
放進手機有沒有壞？

## E. Functional
切語言有沒有改到資料？

---

# 95. 自動化測試建議

加入：

```text
all locale key sets equal
no empty value
required nav keys exist
required settings keys exist
required common keys exist
```

---

# 96. Runtime Smoke Test

每個 locale 至少：
1. 啟動 App
2. Onboarding
3. Today
4. Star Bottle
5. Footprints
6. Our
7. Clear
8. Settings
9. Dialog
10. Share

確保沒有：
- 中文殘留
- missing key key-name 直接顯示
- undefined
- null
- [object Object]

---

# 97. 主要流程跨語言測試

案例：

```text
zh-TW
建立暱稱、心情、日記
↓
切 en
↓
資料仍在
UI English
↓
新增一筆
↓
切 ja
↓
兩筆資料皆存在
```

---

# 98. 數據邏輯不可受翻譯影響

切換 locale：
- 星心值不變
- Mood stable key 不變
- Diary count 不變
- Star count 不變
- Clear result key 不變
- Day 365 index 不變
- Important Date type 不變

---

# 99. Milestone 4C 建議拆分

目前國際化可分：

## 4C-1
清醒四工具六語
`12-clear-tools-six-language-localization-spec.md`

## 4C-2
365 戀愛星語六語
`13-daily-love-quotes-six-language-localization-spec.md`

## 4C-3
全 App UI 六語
本文件 `14-app-wide-six-language-i18n-content-spec.md`

---

# 100. 4C-3 建議執行順序

```text
1. String inventory
2. hardcoded Chinese audit
3. key architecture cleanup
4. zh-TW key complete
5. EN
6. JA
7. KO
8. ES
9. FR
10. key-set equality audit
11. empty audit
12. runtime smoke test
13. responsive QA
14. locale switching regression
```

---

# 101. 不要讓 Codex 一次亂改

Codex 執行應遵守：

- 不改資料模型，除非 i18n 必要
- 不新增功能
- 不修改 score rules
- 不修改 Day progression
- 不重新設計頁面
- 不替 user-generated text 做自動翻譯
- 不新增 AI / API
- 不為了翻譯重構整個 App
- 不 Commit / Push / Publish，除非另行指示

---

# 102. 翻譯工作建議

每一語言完成後立即：

```text
key count
missing
empty
runtime smoke
responsive
```

不要五語全部翻完才測。

---

# 103. 完成報告格式

4C-3 完成時 Codex 回報：

1. 修改檔案
2. 新增 / 重構 i18n key 數量
3. 六語 key count
4. Missing count
5. Empty count
6. Hardcoded Chinese audit 結果
7. Responsive 320 / 390 / 432
8. Runtime smoke test
9. Locale switching regression
10. Build / lint / test
11. 尚待人工語感 review 的字串

---

# 104. 最終驗收標準

六語：

```text
Missing Key = 0
Empty Value = 0
Broken Key = 0
Runtime Hardcoded Chinese = 0
```

UI：

```text
Overflow = 0
Clipping = 0
Broken image = 0
Bottom-nav obstruction = 0
```

資料：

```text
Locale switch data loss = 0
Locale switch score change = 0
Locale switch date progression change = 0
```

內容：

```text
Unnatural critical UI wording = 0
Wrong semantic translation = 0
User-generated content auto-translation = 0
```

---

# 105. 最終產品原則

六語版完成，不代表：

> 「六個 JSON 檔案都有文字。」

真正完成的標準是：

> **使用者從第一次打開 App、寫日記、看星星、整理心情、查看回憶、進設定、看到錯誤、收到提示、分享內容，到切換語言，整個體驗都屬於同一個語言環境。**

以及：

> **語言可以改變，資料不能改變；文字可以在地化，產品邏輯不能漂移。**

最後：

> **六語不是附加翻譯，而是《星星戀愛日記》V1 產品完整性的一部分。**
