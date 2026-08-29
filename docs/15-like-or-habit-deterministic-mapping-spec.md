# 星星戀愛日記｜喜歡？習慣？Deterministic Mapping 規格
## Like-or-Habit Deterministic Mapping Spec

檔名：`15-like-or-habit-deterministic-mapping-spec.md`
版本：V1
用途：Milestone 4B 補完「喜歡？習慣？」正式結果 mapping、stable answer keys、result module keys、variant keys 與 completion 規則

## 1. 文件目的

本文件補足 `10-like-or-habit-reflection-v1.md` 與 `11-milestone-4b-clear-tools-implementation-spec.md` 尚未明確定義的部分：

- 每一題 stable answer key
- deterministic evidence rules
- 四個 result module 的觸發條件
- module 優先順序
- 同時觸發多個 module 的處理
- unclear 結果規則
- stable result module / combination / variant keys
- completion、history、persistence 所需欄位

本工具不是測驗，**不得建立任何分數**。

---

## 2. 核心產品原則

「喜歡？習慣？」不是要替使用者回答：
- 你到底是不是愛他
- 你只是習慣而已
- 你愛的是幻想
- 你們適不適合

它只陪使用者把四種可能混在一起的感受慢慢分開看：

1. `real_person`：喜歡真實的這個人
2. `habit`：習慣他的存在
3. `fear_of_loss`：害怕失去
4. `imagined_relationship`：喜歡想像中的關係

結果只能呈現「目前比較值得多看一眼的部分」，不能下定論。

---

## 3. 禁止建立任何分數

禁止：

```ts
likeScore
habitScore
fearScore
fantasyScore
realPersonScore
```

也禁止：
- 百分比
- 高中低
- 類型判定
- 雷達圖
- 四象限
- 相容度
- 愛情值

允許的唯一邏輯是：

```text
stable answers
→ deterministic evidence
→ triggered result modules
→ stable result key
```

---

## 4. 四張 Reflection Card

固定流程：

```text
Card 1｜喜歡這個人
Card 2｜習慣他的存在
Card 3｜害怕失去
Card 4｜喜歡想像中的關係
```

UI 顯示 `1/4`、`2/4`、`3/4`、`4/4`，不要顯示成「第 7/12 題」的測驗感。

---

# Card 1｜喜歡這個人

## Q1-1
題意：能說出至少三個真實發生、不是想像的欣賞點嗎？

Stable key：

```ts
real_person_three_real_traits
```

Answer keys：

```ts
yes
some
not_really
not_sure
```

Mapping：

```text
yes        → real_person strong support
some       → real_person mild support
not_really → no support
not_sure   → unresolved
```

## Q1-2
題意：如果沒有曖昧或交往期待，我還會喜歡跟他相處嗎？

Stable key：

```ts
real_person_without_romantic_expectation
```

Answer keys：

```ts
yes
probably_yes
probably_no
not_sure
```

Mapping：

```text
yes          → real_person strong support
probably_yes → real_person mild support
probably_no  → no support
not_sure     → unresolved
```

## Q1-3
題意：我喜歡的是現在的他，還是希望未來他會變成的樣子？

Stable key：

```ts
real_person_present_vs_future_version
```

Answer keys：

```ts
mostly_present
both
mostly_future
not_sure
```

Mapping：

```text
mostly_present → real_person strong support
both           → real_person mild support
mostly_future  → imagined_relationship strong support
not_sure       → unresolved
```

Optional text：

```ts
realPersonNote
```

UI：`我欣賞他的地方……`
Max 300。
不參與 mapping，不做 NLP。

### real_person trigger

符合任一：

```text
A. Q1-1 與 Q1-2 都是 positive support，且 Q1-3 != mostly_future

B. Q1-3 = mostly_present，
   且 Q1-1 或 Q1-2 至少一題 positive support
```

positive support：
- Q1-1：`yes | some`
- Q1-2：`yes | probably_yes`

---

# Card 2｜習慣他的存在

## Q2-1
題意：我會期待每天固定有他的訊息或互動嗎？

Stable key：

```ts
habit_expect_regular_contact
```

Answer keys：

```ts
often
sometimes
rarely
not_sure
```

Mapping：

```text
often      → habit strong support
sometimes  → habit mild support
rarely     → no support
not_sure   → unresolved
```

## Q2-2
題意：少了他的訊息或存在，會不會像生活少了一個固定環節？

Stable key：

```ts
habit_absence_feels_like_missing_routine
```

Answer keys：

```ts
yes
somewhat
no
not_sure
```

## Q2-3
題意：我現在想念的，有沒有一部分其實是原本每天都有的感覺？

Stable key：

```ts
habit_missing_the_routine
```

Answer keys：

```ts
yes
maybe
no
not_sure
```

Optional text：

```ts
habitNote
```

UI：`我最習慣的是……`
Max 300。
不參與 mapping。

### habit trigger

三題中至少 2 題為 positive support。

positive：
- Q2-1：`often | sometimes`
- Q2-2：`yes | somewhat`
- Q2-3：`yes | maybe`

不顯示 evidence count。

---

# Card 3｜害怕失去

## Q3-1
題意：如果沒有繼續，最難受的是什麼？

Stable key：

```ts
fear_of_loss_hardest_part
```

Multi-select：

```ts
lose_this_person
lose_daily_companionship
lose_feeling_cared_for
be_alone
investment_feels_wasted
no_result
uncertainty
other
```

`otherText` max 150。

其中 `lose_this_person` 本身不直接觸發 fear，因為它也可能只是代表真實喜歡。

fear-support options：

```text
lose_daily_companionship
lose_feeling_cared_for
be_alone
investment_feels_wasted
no_result
uncertainty
```

## Q3-2
題意：最難受的是失去這個人，還是失去有人陪／有人在意的感覺？

Stable key：

```ts
fear_of_loss_person_vs_feeling
```

Answer keys：

```ts
mostly_person
both
mostly_feeling
not_sure
```

Mapping：

```text
mostly_person  → no direct fear support
both           → mild support
mostly_feeling → strong support
not_sure       → unresolved
```

## Q3-3
題意：我有沒有因為怕失去，而不敢承認某些相處其實讓我不舒服？

Stable key：

```ts
fear_of_loss_avoiding_discomfort
```

Answer keys：

```ts
yes
sometimes
no
not_sure
```

### fear_of_loss trigger

符合任一：

```text
A. Q3-2 = mostly_feeling
B. Q3-3 = yes
C. Q3-1 選到至少 2 個 fear-support options
D. Q3-1 至少 1 個 fear-support option，
   且 Q3-2 = both 或 Q3-3 = sometimes
```

---

# Card 4｜喜歡想像中的關係

## Q4-1
題意：我想像未來的時間，是不是比實際相處更多？

Stable key：

```ts
imagined_relationship_future_more_than_reality
```

Answer keys：

```ts
often
sometimes
rarely
not_sure
```

## Q4-2
題意：我有沒有用「也許以後會……」替現在還沒有的事情補上答案？

Stable key：

```ts
imagined_relationship_future_fills_present_gap
```

Answer keys：

```ts
often
sometimes
rarely
not_sure
```

## Q4-3
題意：如果只看已經發生的事情，不看期待，我會怎麼形容現在的關係？

Stable key：

```ts
imagined_relationship_reality_description
```

Type：`free_text`
Max 300。
Required。
不做 NLP、不參與 mapping，只用於 summary / diary preview。

### imagined_relationship trigger

符合任一：

```text
A. Q1-3 = mostly_future
B. Q4-1 = often
C. Q4-2 = often
D. Q4-1 = sometimes 且 Q4-2 = sometimes
```

---

# 5. Result Module Stable Keys

正式四個：

```ts
real_person
habit
fear_of_loss
imagined_relationship
```

UI canonical：

```text
real_person              我喜歡的是真實的他
habit                    生活裡已經習慣有他
fear_of_loss             害怕失去也佔了一些位置
imagined_relationship    有些期待可能走在現實前面
```

---

# 6. Result Module 顯示規則

每次：

```text
最少 1 個 module
最多 3 個 module
```

若 4 個都觸發，只顯示 priority 前 3 個。

固定 priority：

```text
1. real_person
2. habit
3. fear_of_loss
4. imagined_relationship
```

例外：

若 `imagined_relationship` 是由：

```text
Q1-3 = mostly_future
```

觸發，priority 提升為第 2：

```text
real_person
imagined_relationship
habit
fear_of_loss
```

不使用 evidence 數量排序，不顯示 Top 1 / Top 2。

---

# 7. Unclear

若四個 module 都未觸發：

```ts
resultCombinationKey = "unclear"
resultVariantKey = "unclear.v1"
```

Canonical：

> **現在還不用急著替這段感情下答案。**

Reflection：

> **如果沒有期待他改變、沒有害怕失去，我現在還想不想靠近這個人？**

---

# 8. 合法 Combination Keys

V1 固定 15 組：

```ts
like_only
habit_only
fear_only
imagined_only

like_habit
like_fear
like_imagined
habit_fear
habit_imagined
fear_imagined

like_habit_fear
like_habit_imagined
like_fear_imagined
habit_fear_imagined

unclear
```

其中 `like` 對應 module `real_person`。

不建立 4-module combination key。

---

# 9. V1 Result Variant Keys

```text
like_only.v1
habit_only.v1
fear_only.v1
imagined_only.v1

like_habit.v1
like_fear.v1
like_imagined.v1
habit_fear.v1
habit_imagined.v1
fear_imagined.v1

like_habit_fear.v1
like_habit_imagined.v1
like_fear_imagined.v1
habit_fear_imagined.v1

unclear.v1
```

V1 全部固定用 `v1`，不 random。

---

# 10. 正式 Result Copy

## like_only.v1

**你現在的感受裡，看得見一些對真實這個人的喜歡。**

你注意到的，不只是希望他未來變成什麼樣子，也包括現在真實的相處與你欣賞的地方。

Reflection：

**如果沒有任何關係結果的保證，我還喜歡現在的這個人嗎？**

## habit_only.v1

**生活裡已經有一些習慣，和他的存在連在一起。**

捨不得固定的訊息、陪伴或生活節奏很正常。你可以慢慢看看，拿掉這些熟悉感後，自己還剩下哪些感受。

Reflection：

**如果生活重新建立新的節奏，我還會怎麼想起這個人？**

## fear_only.v1

**害怕失去，現在可能佔了比較需要被看見的位置。**

害怕失去並不等於你不喜歡；只是當害怕變得很大時，它可能讓你更難聽見自己的真實感受。

Reflection：

**如果我知道自己不會因此失去價值，我現在會怎麼看這段關係？**

## imagined_only.v1

**有些期待，好像已經走在現實前面。**

對未來有期待沒有錯。只是把還沒發生的事情先放回未知，會更容易看見現在真正存在的是什麼。

Reflection：

**如果只看已經發生的事情，我現在會怎麼形容我們？**

## like_habit.v1

**你的感受裡，好像同時有喜歡，也有一些習慣。**

你可能真的欣賞現在的這個人，也已經習慣生活裡有他的訊息、陪伴或存在。這兩件事可以同時是真的，不需要急著把其中一個否定掉。

Reflection：

**如果沒有每天固定的互動，我還會喜歡現在的這個人嗎？**

## like_fear.v1

**你可能真的在喜歡，也同時有一點害怕失去。**

喜歡一個人時，害怕失去並不奇怪。只是當「怕失去」開始讓你不敢承認自己的不舒服時，就值得多照顧一下自己的感受。

Reflection：

**如果我不需要害怕失去，我還會怎麼看待現在的相處？**

## like_imagined.v1

**你對這個人有真實的喜歡，也可能帶著一些對未來的期待。**

你看到的並不全是想像；只是有些期待可能比現在的關係先走了一點。把已經發生的事和希望發生的事分開看，會讓你更清楚。

Reflection：

**如果只看現在真實發生的事情，我還喜歡這樣的相處嗎？**

## habit_fear.v1

**有一部分捨不得，可能來自習慣，也來自害怕失去。**

當一個人已經成為生活的一部分，少了他的存在，本來就可能讓人不安。這不代表你的感受不是真的，只是可以再看看：你最捨不得的究竟是哪一部分。

Reflection：

**我現在最怕失去的是這個人，還是原本每天都有的感覺？**

## habit_imagined.v1

**有些習慣，可能和對未來的期待黏在一起了。**

當固定互動累積久了，我們很容易把「現在已經習慣的感覺」和「希望未來會發生的事情」連在一起。先把兩者分開，會比較看得清楚。

Reflection：

**如果未來沒有照我想像的發展，我現在還會想保留這樣的相處嗎？**

## fear_imagined.v1

**有些期待，可能也和害怕失去連在一起。**

當我們很希望一段關係有結果時，未來的想像有時會變得特別重要。這不代表你想錯了，只是可以先把還沒發生的事情放回未知。

Reflection：

**如果我暫時不替未來補答案，我現在真正知道的是什麼？**

## like_habit_fear.v1

**這份感受裡，可能同時有喜歡、習慣，也有一點怕失去。**

你可能真的喜歡這個人，也已經習慣他的存在；而當這些累積在一起，失去就會顯得更難受。它們不需要互相否定，只要慢慢分清楚就好。

Reflection：

**如果沒有習慣和害怕失去，我還會怎麼看現在的這個人？**

## like_habit_imagined.v1

**你可能喜歡真實的他，也習慣了他的存在，同時對未來有一些期待。**

這三件事可以一起存在。現在最重要的不是選出哪一個才是真的，而是把「已經發生的」和「希望發生的」分開看看。

Reflection：

**如果未來保持現在這個樣子，我還會喜歡這段相處嗎？**

## like_fear_imagined.v1

**你可能真的喜歡，也同時害怕失去，所以對未來特別在意。**

當喜歡和害怕失去一起出現，我們很自然會更想知道關係最後會去哪裡。先不用急著得到答案，可以先回到現在的互動。

Reflection：

**如果沒有未來的保證，我現在仍然願意喜歡真實的這個人嗎？**

## habit_fear_imagined.v1

**你捨不得的，可能同時有習慣、害怕失去和對未來的期待。**

當一個人已經進入生活節奏，又承載了很多未來想像，放不下會變得很自然。這不代表你一定不喜歡他，只是「喜歡」可能不是現在唯一需要看的部分。

Reflection：

**如果拿掉習慣、害怕失去和未來想像，我還剩下哪些對這個人的真實感受？**

## unclear.v1

**現在還不用急著替這段感情下答案。**

有些感受本來就需要一點時間才能分清楚。現在看不清，不代表一定要勉強自己立刻選出「喜歡」或「習慣」。

Reflection：

**如果沒有期待他改變、沒有害怕失去，我現在還想不想靠近這個人？**

---

# 11. Fixed Closing Copy

所有結果固定收尾：

> **不用急著替感情命名，先分清楚自己現在捨不得的是什麼。**

可再顯示：

> **喜歡可以是真的，習慣也可以是真的，它們不需要互相否定。**

---

# 12. Module Card Short Copy

`real_person`

> 你看到的，有一部分是現在真實存在的這個人。

`habit`

> 生活裡的固定互動，也可能成為捨不得的一部分。

`fear_of_loss`

> 害怕失去，有時會讓一段感情看起來更難放下。

`imagined_relationship`

> 有些期待可能已經走在目前真實發生的事情前面。

不顯示分數、percentage、ranking。

---

# 13. Completion 條件

進 Result Preview 前必須完成：

```text
Card 1：Q1-1、Q1-2、Q1-3
Card 2：Q2-1、Q2-2、Q2-3
Card 3：Q3-1 至少一項、Q3-2、Q3-3
        若選 other → otherText 必填
Card 4：Q4-1、Q4-2、Q4-3
```

進入 result preview **不等於 completed**。

只有按：

> **完成這次整理**

才：

```ts
status = "completed"
```

並 lock answers。

---

# 14. Draft / Resume

- 每題回答立即保存
- App 關閉／重開可續答
- 跨日可續答
- 不過期
- 同工具最多一筆 active draft
- 重新開始需 confirmation
- completed record 不可修改
- 再做一次建立新 record

---

# 15. Persistence

至少保存：

```ts
id
status
currentSection
answers
realPersonNote
habitNote
activeResultModules
resultCombinationKey
resultVariantKey
clearMindStarId
localDate
timezone
createdAt
updatedAt
completedAt
```

不要只存 localized prose。

---

# 16. Mapping Function

建議純函式：

```ts
deriveLikeOrHabitResult(answers)
```

回傳：

```ts
{
  activeResultModules,
  resultCombinationKey,
  resultVariantKey
}
```

要求：
- pure
- deterministic
- no DB
- no locale
- no date
- no random

---

# 17. Diary Action

完成後可選：

> 寫進今天的日記

規則：
1. fixed template 生成 preview
2. 使用者可編輯
3. 使用者確認
4. 才寫入 diary

不使用 AI / API / NLP，不自動寫入。

---

# 18. 清醒星星

只有 completed 後才可主動：

> 存成清醒星星

```text
sourceType = like_or_habit
sourceId = reflection.id
type = clear_mind
```

一 record 最多一顆。
不增加星心值。

---

# 19. 星心值

本工具：

```text
完成 +0
清醒星星 +0
重新測驗 +0
查看結果 +0
```

---

# 20. History

只列 completed。

顯示：
- 日期
- result title
- module tags
- 查看結果

Draft 不進 history。

刪除 completed 若有 linked clear star：
- 只刪紀錄
- 紀錄與清醒星星一起刪除
- 取消

---

# 21. Forbidden Conclusions

不得產生：

```text
你根本不愛他
你只是習慣
你只是寂寞
你缺愛
你愛的是幻想
你有依附問題
你應該離開
他不值得
你們不適合
你們一定會在一起
```

不得對 free text 做任何分類。

---

# 22. Required Unit Tests

至少測：

1. like_only
2. habit_only
3. fear_only
4. imagined_only
5. like_habit
6. like_fear
7. like_imagined
8. habit_fear
9. habit_imagined
10. fear_imagined
11. 四種三-module 組合
12. all four trigger → priority max3
13. Q1-3 mostly_future priority override
14. unclear
15. not_sure heavy
16. free text 不改 mapping
17. same input → same output
18. locale switch 不改 mapping
19. required question missing → cannot complete
20. Card3 other 無 otherText → cannot complete
21. Q4-3 empty → cannot complete
22. result preview 仍是 draft
23. completion → lock
24. rerun creates new record
25. clear star dedupe

---

# 23. Regression

不得影響：
- 開始整理心情
- 暈船法典
- 戀愛腦檢測
- Today score
- Star Bottle
- Footprints
- Our
- Settings
- IndexedDB v4 migration

---

# 24. Codex 限制

不要：
- 新增任何 score
- 新增 AI / API
- 新增 dependency
- 改 UI 視覺方向
- 改其他三工具規則
- 改 DB version；若現有 v4 無法容納必要 stable fields，先停止並回報
- Commit
- Push
- Publish
- Android Build

---

# 25. Codex 完成回報

只回報：

1. 修改檔案
2. stable question / answer keys
3. deterministic mapping 實作位置
4. 15 組 result keys
5. completion / draft / history
6. clearMindStar 防重複
7. unit tests
8. build / lint / test
9. 是否仍有規格歧義

---

# 26. 最終精神

「喜歡？習慣？」不是把感情判成：

> 喜歡 / 習慣 / 害怕 / 幻想

而是：

> **讓使用者看見，這些感受有可能同時存在。**

最終目的：

> **讓使用者比開始之前，更知道自己現在正在捨不得什麼。**

以及：

> **可以喜歡一個人，也可以慢慢把自己的心看清楚。**
