# 星星戀愛日記｜Milestone 4B
## 清醒四工具整合實作規格（Codex Source of Truth）

版本：V1
目標：一次完成「清醒」頁四個工具的 Local First 資料層、流程、歷史、清醒星星與整合測試。
原則：**不要擴充需求、不要改視覺方向、不要加入 AI/API、不要自行發明產品邏輯。**

---

# 0. Codex 開工前必讀

依序讀取：

1. `docs/00-v1-source-of-truth.md`
2. `docs/data-model-v1.2.md`
3. `docs/ui-spec.md`
4. `docs/i18n-spec.md`
5. `docs/04-clear-start-sorting-feelings-v1.md`
6. `docs/05-love-boat-code-a-result-copy-v1.md`
7. `docs/06-love-boat-code-b-result-copy-v1.md`
8. `docs/07-love-boat-code-cross-result-matrix-v1.md`
9. `docs/08-love-boat-code-ui-flow-v1.md`
10. `docs/09-love-brain-assessment-v1.md`
11. `docs/10-like-or-habit-reflection-v1.md`

若本規格與上述工具細節衝突：
- 各工具自己的正式規格優先。
- 本文件負責整合、資料層、共同行為與驗收。

---

# 1. 本次只做什麼

完成清醒頁四工具：

1. **開始整理心情**
2. **暈船法典**
3. **戀愛腦檢測**
4. **喜歡？習慣？**

共同完成：

- IndexedDB migration
- Repository / domain model
- Draft 即時保存
- App 關閉後恢復
- Completed 歷史
- 查看 / 刪除歷史
- 清醒星星 linkage
- 星心值規則
- 清醒頁真實資料取代 mock
- i18n stable keys
- 單元測試 / repository 測試 / flow regression

---

# 2. 本次明確不做

禁止新增：

- AI
- API
- 雲端同步
- Chatbot
- 戀愛百分比
- 配對率
- 對方喜歡你的機率
- 心理診斷
- 依附型態診斷
- Red flag 自動判斷
- 分手 / 告白建議
- Native notification
- 照片功能
- Memory Wall
- 新遊戲化機制
- 新星心值來源
- 冷卻時間
- 每日限制
- Draft 自動過期
- 新套件，除非專案現有架構無法完成且先停止回報

不要 Commit、不要 Push、不要發布、不要 Android build，除非另有明確指示。

---

# 3. 架構要求

延續既有：

```text
UI
↓
Repository contracts
↓
StorageAdapter
↓
IndexedDB
```

不得讓 React component 直接操作 IndexedDB。

現有 DB：

```text
starry-love-diary
```

目前 schema 基準：

```text
v3
```

本次升級為：

```text
v4
```

---

# 4. IndexedDB v4 Stores

新增四個 store：

```text
clearRecords
loveBoatAssessments
loveBrainAssessments
likeOrHabitReflections
```

保留所有既有 stores，不破壞舊資料。

若 Star / ScoreAward schema 已存在，優先重用，不另建重複 store。

---

# 5. 共通時間欄位

所有正式資料與 Draft 使用：

```ts
localDate: string       // YYYY-MM-DD，手機 local date
timezone: string
createdAt: string       // UTC ISO
updatedAt: string       // UTC ISO
completedAt?: string    // UTC ISO
```

不得用 server date。

跨日後 Draft 仍保留原資料，不自動清除。

---

# 6. 工具一｜開始整理心情

完整內容依：

```text
04-clear-start-sorting-feelings-v1.md
```

## 6.1 Model

至少支援：

```ts
type ClearRecord = {
  id: string

  triggerType?: ClearTriggerType
  triggerText?: string

  facts?: string
  interpretation?: string
  unknown?: string

  emotions: ClearEmotion[]
  emotionIntensity: 1 | 2 | 3 | 4 | 5

  bodySensations?: BodySensation[]
  observations?: ClearObservation[]
  needs?: ClearNeed[]

  nextActionType?: ClearActionType
  nextActionText?: string

  clearMindStarId?: string

  localDate: string
  timezone: string
  createdAt: string
  updatedAt: string
}
```

## 6.2 Validation

資料層強制：

- `triggerText <= 300`
- `facts <= 300`
- `interpretation <= 300`
- `unknown <= 300`
- `nextActionText <= 150`
- 不 silent truncate

正式完成至少：

- Step 1：triggerType 或 triggerText
- Step 2：facts 或 interpretation
- Step 3：至少 1 emotion
- Step 5：preset action 或 custom action

Step 4 optional。

## 6.3 星心值

只有正式完成新的 ClearRecord：

```text
+5
```

建立：

```ts
awardType: "clear_complete"
points: 5
sourceId: clearRecordId
```

規則：

- 一筆 ClearRecord 最多一次
- reload 不重複
- edit 不重複
- delete 不 claw back

## 6.4 清醒星星

完成後只有使用者主動：

> 存成清醒星星

才建立：

```ts
Star.type = "clear_mind"
```

一筆 ClearRecord 最多一顆。

不增加星心值。

---

# 7. 工具二｜暈船法典

完整內容依：

```text
05-love-boat-code-a-result-copy-v1.md
06-love-boat-code-b-result-copy-v1.md
07-love-boat-code-cross-result-matrix-v1.md
08-love-boat-code-ui-flow-v1.md
```

## 7.1 Model

```ts
type LoveBoatAssessment = {
  id: string
  status: "draft" | "completed"

  currentSection: "A" | "B" | "result"
  currentQuestionIndex: number

  aAnswers: Partial<
    Record<BoatInvestmentQuestionKey, 0 | 1 | 2 | 3>
  >

  bAnswers: Partial<
    Record<BoatResponseQuestionKey, 0 | 1 | 2 | "unknown">
  >

  aScore?: number
  aLevel?: InvestmentLevel

  bAnsweredItems?: number
  bEarnedScore?: number
  bMaxPossibleScore?: number
  bResponseRatio?: number
  bLevel?: ResponseLevel

  crossResultKey?: BoatCrossResultKey
  resultVariantIndex?: number

  clearMindStarId?: string

  localDate: string
  timezone: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}
```

## 7.2 A 規則

12 題全部回答。

每題：

```text
幾乎沒有 0
偶爾     1
有時     2
常常     3
```

A band 完全依 05 文件。

## 7.3 B 規則

10 題全部選擇。

```text
有       2
有時     1
沒有     0
還不知道 unknown
```

`unknown`：
- 視為該題已作答
- 不納入 denominator
- 不視為 0 分

若有效回答 `< 4`：
- 使用 insufficient observation
- 不進 A+B 4×4 matrix

其餘 band 完全依 06 文件。

## 7.4 A+B

交叉結果完全依 07 文件。

不得自行改 title、band 或 safety wording。

## 7.5 Draft UX

必須支援：

- A 前後修改
- B 前後修改
- B 進行中仍可返回 A 修改
- 題目總覽
- 直接跳題
- 每題回答後立即 IndexedDB save
- 「稍後繼續」
- 關閉 App 後 resume
- 跨日 resume
- Draft 不過期

如果有 Draft：
- 顯示「繼續上次」
- 顯示目前 section / progress
- 可「重新開始」
- 重新開始前確認

## 7.6 Result preview / Completed

22 題完成後可產生 deterministic result preview。

此時仍：

```ts
status = "draft"
```

使用者仍可返回修改。

只有按：

> **完成這次暈船法典**

才：

```ts
status = "completed"
```

完成後：
- 答案鎖定
- variant 鎖定
- history 才收錄
- share 才可使用
- clear star 才可建立

若 preview 中修改答案：
- 重新計算結果
- 不把 preview 當歷史
- 不新增星星
- 不新增 score

## 7.7 星心值

暈船法典：

```text
0 分
```

不得建立 ScoreAward。

## 7.8 清醒星星

Completed 後可主動建立：

```ts
type: "clear_mind"
sourceType: "love_boat_code"
sourceId: assessmentId
```

一份 assessment 最多一顆。

---

# 8. 工具三｜戀愛腦檢測

完整內容依：

```text
09-love-brain-assessment-v1.md
```

## 8.1 Model

```ts
type LoveBrainAssessment = {
  id: string
  status: "draft" | "completed"

  answers: Partial<
    Record<LoveBrainQuestionKey, 0 | 1 | 2 | 3>
  >

  currentQuestionIndex: number

  scores?: {
    rumination: number
    messageDependency: number
    overInterpretation: number
    detective: number
    selfSacrifice: number
    total: number
  }

  primaryPattern?: LoveBrainPattern
  secondaryPattern?: LoveBrainPattern
  isLowOverall?: boolean

  resultVariantIndex?: number
  clearMindStarId?: string

  localDate: string
  timezone: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}
```

## 8.2 題庫

固定 25 題。

五型：

```ts
"rumination"
"message_dependency"
"over_interpretation"
"detective"
"self_sacrifice"
```

每型 5 題。

每題：

```text
幾乎不會 0
偶爾     1
有時     2
常常     3
```

單型 max 15，總分 max 75。

## 8.3 結果規則

最高分：

> 最明顯模式

第二名與第一名差距 `<= 3`：

> 顯示次要模式

差距 `> 3`：
- 可只顯示主要模式

低整體：

```ts
totalScore <= 18
```

使用：

> 你還保留著自己的節奏

這只是 V1 產品分級，不標示為臨床量表。

同分不得 random 決定唯一人格類型。

## 8.4 UX

必須支援：

- 25 題前後修改
- 題目總覽
- 跳題
- 每題 immediate save
- 稍後繼續
- resume
- restart confirmation
- Draft 不過期

25 題全答後可 preview。

只有按：

> **完成這次檢測**

才轉 `completed`。

## 8.5 結果

不得顯示：

- 戀愛腦 %
- 類型 %
- 心理診斷

使用 09 文件中的：
- 主模式
- 次模式
- 你可能正在找什麼
- 今天可以試試
- 和上一次相比

## 8.6 星心值

```text
0 分
```

## 8.7 清醒星星

Completed 後使用者主動建立。

一份 Assessment 最多一顆。

---

# 9. 工具四｜喜歡？習慣？

完整內容依：

```text
10-like-or-habit-reflection-v1.md
```

## 9.1 Model

```ts
type LikeOrHabitReflection = {
  id: string
  status: "draft" | "completed"

  currentSection:
    | "real_person"
    | "habit"
    | "fear_of_loss"
    | "imagined_relationship"
    | "result"

  answers: {
    realPerson?: Record<string, unknown>
    habit?: Record<string, unknown>
    fearOfLoss?: Record<string, unknown>
    imaginedRelationship?: Record<string, unknown>
  }

  activeResultModules?: LikeOrHabitDimension[]
  resultVariantKeys?: string[]
  clearMindStarId?: string

  localDate: string
  timezone: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}
```

實作時請把 `unknown` 收斂為正式 typed answer unions，不要長期保留 `Record<string, unknown>`。

## 9.2 四個 dimensions

```ts
"real_person"
"habit"
"fear_of_loss"
"imagined_relationship"
```

## 9.3 核心規則

此工具：

- 不計分
- 不排名
- 不算百分比
- 不判斷「真愛」
- 不輸出「你只是習慣」

採：

```text
answers
↓
deterministic rule mapping
↓
1～3 active result modules
↓
prewritten copy
```

## 9.4 UX

用 4 組反思卡。

顯示：

```text
1 / 4
2 / 4
3 / 4
4 / 4
```

不要做成 `7 / 12 題` 的測驗感。

必須：
- 前後修改
- 即時保存
- 稍後繼續
- resume
- Draft 不過期

只有按：

> **完成這次整理**

才轉 completed。

## 9.5 寫進今天日記

提供：

> **寫進今天的日記**

規則：

- 只產生簡短摘要
- 先 preview
- 使用者確認後才寫 Diary
- 不自動把完整問卷塞入日記
- 若今天已有日記，不得無提示覆蓋
- 使用既有 Diary repository / edit flow

## 9.6 星心值

```text
0 分
```

## 9.7 清醒星星

Completed 後可主動建立，一份 Reflection 最多一顆。

---

# 10. 清醒星星共通規則

三個 Assessment / Reflection + ClearRecord 都可主動存為：

```ts
Star.type = "clear_mind"
```

但：

- 不自動建立
- 不增加星心值
- 每個 source 最多一顆
- reopen 不重複
- edit / view 不重複
- 使用 `sourceId` 做 duplicate guard

建議 sourceType：

```ts
type ClearMindStarSourceType =
  | "clear_record"
  | "love_boat_code"
  | "love_brain_assessment"
  | "like_or_habit"
```

若現有 Star model 命名不同，沿用現有 schema，但必須保留相同語意與 duplicate protection。

---

# 11. 刪除規則

所有 Completed history 刪除前都需要 confirmation。

若資料已連結 clear_mind Star：

提供：

1. 只刪除原紀錄
2. 原紀錄與清醒星星一起刪除
3. 取消

不得自動刪除 Star。

ScoreAward 特例：

開始整理心情的 +5 不 claw back。

---

# 12. Draft 規則

對三個需要 Draft 的工具：

- 暈船法典
- 戀愛腦檢測
- 喜歡？習慣？

共同規則：

- 一次每工具最多保留 1 個 active Draft
- immediate persistence
- App restart 後可 resume
- 跨日可 resume
- 不 expire
- restart 前 confirmation
- completed history 不可被 draft 覆蓋

開始整理心情若現有 04 規格未要求 Draft，可照 04 規格，不要自行擴充成另一套 Draft 流程。

---

# 13. 清醒頁整合

清醒首頁四張工具卡全部可進入真實流程。

不得保留假的完成紀錄或 mock history。

清醒頁近期紀錄需讀取真實 repository。

建議統一 history item：

```ts
type ClearHistoryItem = {
  id: string
  sourceType:
    | "clear_record"
    | "love_boat_code"
    | "love_brain_assessment"
    | "like_or_habit"
  localDate: string
  title: string
  subtitle?: string
  createdAt: string
}
```

此 type 可為 selector/view-model，不必另存一個 duplicate store。

排序：

```text
createdAt DESC
```

---

# 14. 歷史畫面

每個工具各自可查看歷史。

共通：

- newest first
- 可 tap 查看完整 Completed result
- 可 delete
- old answers 不可 edit
- retest / redo 建立新的紀錄

推薦 CTA：

- 暈船法典：**再看看現在的我**
- 戀愛腦檢測：**再看看現在的我**
- 喜歡？習慣？：**再整理一次**
- 開始整理心情：**再整理一次**

---

# 15. Trend

只有 Completed 歷史可納入 trend。

Draft / preview 不得納入。

暈船法典：
- 完全依 05/06/07 文件 threshold

戀愛腦檢測：
- 只用簡單 predefined trend wording
- 不顯示「進步百分比」

喜歡？習慣？：
- V1 不做數值 trend
- 可不做跨次分析

---

# 16. Result variant

所有 prewritten result copy：

- stable key
- 優先 unseen variant
- 用完才循環
- 避免 immediate duplicate
- 不 pure random

Draft preview：
- 不要因每次 render 隨機變文案
- preview 可固定 deterministic variant
- Completed 時才鎖定正式 `resultVariantIndex` / keys

---

# 17. i18n

所有新增 UI 字串：

- 不寫進圖片
- 不在 component hardcode
- 使用現有 i18n layer
- stable keys
- 不改既有 locale architecture

支援既有六語：

```text
zh-TW
en
ja
ko
es
fr
```

繁中 copy 以 docs 為 canonical。

翻譯不得改變：
- 非診斷語氣
- 非判定語氣
- 「unknown 不是負分」
- 不做愛情機率的產品原則

---

# 18. Validation 與安全文字

所有 text length 都在 data layer 驗證。

禁止 silent truncation。

所有四工具都不得產生：

- 他一定愛你
- 他根本不愛你
- 你應該分手
- 你應該告白
- 有毒關係
- 渣男 / 渣女
- 你們很適合
- 你們不適合
- 依附障礙
- 精神疾病診斷
- 真愛百分比
- 戀愛腦百分比

---

# 19. Repository 最低需求

至少提供等價能力：

```ts
ClearRecordRepository
LoveBoatAssessmentRepository
LoveBrainAssessmentRepository
LikeOrHabitReflectionRepository
```

每個 repository 依需求提供：

```text
create
getById
list
updateDraft
complete
delete
getActiveDraft（有 Draft 的工具）
```

不要把所有工具塞成一個巨大 repository。

---

# 20. Migration 要求

IndexedDB v3 → v4：

- 舊 stores 保留
- 舊資料完整
- 新 store 建立
- startup 不 crash
- fresh install 可建立 v4
- upgrade install 可由 v3 升 v4

測試兩條路徑：

```text
fresh DB → v4
existing v3 → v4
```

---

# 21. 必測案例

## 開始整理心情
- required validation
- maxlength validation
- completion +5
- reload 不重複 +5
- edit 不重複 +5
- clear star duplicate guard

## 暈船法典
- A 計分
- B unknown denominator
- B `<4` insufficient
- 4×4 cross key
- draft save
- resume A
- resume B
- B 返回 A 修改
- preview 修改後重新計算
- completed lock
- no score award
- clear star duplicate guard

## 戀愛腦檢測
- 5 pattern scores
- primary
- secondary `<=3`
- no secondary `>3`
- low overall `<=18`
- tie behavior
- draft / resume / restart
- completed lock
- no score
- clear star duplicate guard

## 喜歡？習慣？
- 4-section draft
- optional / text validation
- deterministic module mapping
- no numeric scores
- completed lock
- diary preview before write
- no automatic diary overwrite
- no score
- clear star duplicate guard

---

# 22. Regression 必測

不得破壞：

- Today nickname
- Today mood
- Today diary
- Today 星心值既有來源
- 戀愛星語 share +10
- 一句心話
- Star Bottle filters / search
- Footprints diary
- Our Page four stores
- Settings persistence
- locale switching
- existing IndexedDB data

---

# 23. Build / Quality Gate

完成前必須：

```text
npm run build
npm run lint
npm test
```

全部 PASS。

若專案命令名稱不同，使用 repo 現有 scripts。

不得為了通過測試刪掉現有測試。

---

# 24. UI 驗收

至少檢查：

```text
320px
390px
432px
```

要求：

- 無水平 overflow
- 無文字裁切
- 無 broken image
- bottom nav 不遮內容
- keyboard 開啟後仍可完成文字輸入
- Android back 不造成資料遺失
- 長文案可自然換行
- 西班牙文 / 法文按鈕可容納

---

# 25. 完成回報格式

Codex 完成後只回報：

1. 修改檔案
2. DB schema version
3. 四工具各完成什麼
4. 星心值規則結果
5. 清醒星星 duplicate protection
6. Draft / resume 結果
7. build / lint / tests 結果
8. responsive 檢查
9. 尚未完成或 blocker

不要 Commit。
不要 Push。
不要發布。

---

# 26. Stop Condition

以下全部成立才算 Milestone 4B 完成：

- 四工具皆可從清醒頁正式進入
- 無 mock flow
- 資料真的寫入 IndexedDB
- reload / reopen 後資料仍在
- Draft 可 resume
- Completed 可歷史查看
- Completed 不可修改舊答案
- 清醒星星可手動建立且不重複
- 只有「開始整理心情」正式完成會 +5
- 另外三工具全部 +0
- 所有結果皆 deterministic / prewritten
- 無 AI / API
- build PASS
- lint PASS
- tests PASS
- responsive PASS
- existing V1 regression PASS

---

# 27. Codex 執行原則

**先讀文件，再動程式。**

**先做資料層，再接 UI。**

**每完成一個工具就跑對應測試，不要四個全部寫完才第一次測。**

建議順序：

```text
1. IndexedDB v4 + repositories
2. 開始整理心情
3. 暈船法典
4. 戀愛腦檢測
5. 喜歡？習慣？
6. 清醒頁 history integration
7. clear_mind Star integration
8. i18n
9. full regression
```

不要重構與本 milestone 無關的程式。

不要順手改版號。

不要順手改視覺主題。

不要自行新增功能。

---

# 28. Milestone 4B 最終產品原則

四個工具不是四份測驗。

它們分別處理：

```text
事件
↓
投入與回應
↓
自己的慣性模式
↓
真正放不下的是什麼
```

共同目標不是替使用者決定愛情，而是：

> **讓使用者在喜歡一個人的同時，仍然能慢慢把注意力帶回自己。**

這是本 Milestone 不可偏離的核心。
