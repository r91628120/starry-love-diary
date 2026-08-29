# 星星戀愛日記｜365 天戀愛星語六語國際化規格
## Daily Love Quotes Six-Language Localization Spec

檔名：`13-daily-love-quotes-six-language-localization-spec.md`
版本：V1
用途：Milestone 4C-2－365 天戀愛星語六語在地化、語意一致性與 QA
Canonical source：`starry-love-quotes-365-v1.md`

適用語言：
- 繁體中文 `zh-TW`
- English `en`
- 日本語 `ja`
- 한국어 `ko`
- Español `es`
- Français `fr`

---

# 1. 文件目的

本文件定義《星星戀愛日記》365 天「戀愛星語」在六種語言中的翻譯、在地化、資料結構與驗收標準。

365 天星語不是測驗題庫，也不是一般介面字串。

它是一組每日限定、可分享、帶有情緒溫度的短句，因此翻譯要求是：

> **保留原句真正想陪使用者看見的事情，同時讓每一種語言都像當地人自然會讀到的一句話。**

不是逐字翻譯。

---

# 2. Canonical Source

繁體中文 `zh-TW` 為唯一內容母版。

目前正式內容共有：

```text
Day 1 ～ Day 365
共 365 條
```

Day 順序不可因翻譯而更動。

例如：

```text
zh-TW Day 126
en Day 126
ja Day 126
ko Day 126
es Day 126
fr Day 126
```

六語永遠代表同一天、同一核心意思。

不得：

- 重排 Day
- 合併 Day
- 刪除 Day
- 新增替代 Day
- 因翻譯長度交換兩天內容

---

# 3. 顯示規則不可因語言改變

365 天星語沿用既有產品規則：

- Day 1 由第一次啟用 App 的本地日期開始
- 每天只顯示當日一句
- 不提供昨日／過去／未來瀏覽
- 當日沒開啟即永久錯過
- App 內不建立星語歷史
- 不收藏
- 可使用系統原生分享
- Day 365 後循環回 Day 1
- 星語不進入星星瓶

語言切換：

```text
只改文字
不改 Day index
不改 activation date
不改 progression
```

---

# 4. Day Key 必須固定

建議 stable key：

```ts
dailyLoveQuotes.day001
dailyLoveQuotes.day002
...
dailyLoveQuotes.day365
```

或沿用專案現有等價結構。

重點：

> **Day identity 與 locale 分離。**

不可用翻譯後的文字本身當 ID。

---

# 5. 六語資料完整性

每一語言必須：

```text
Completed = 365
Missing = 0
Empty = 0
```

六語總計：

```text
365 × 6 = 2,190 條有效星語
```

不得以中文 fallback 當作「已完成翻譯」。

上線前：

```text
Runtime untranslated zh-TW in en/ja/ko/es/fr = 0
```

品牌名稱或刻意保留詞除外。

---

# 6. 翻譯最高原則

正式原則：

> **Preserve emotional meaning, relational nuance, and tone — not literal word order.**

中文：

> **保留情感意思、關係細微差異與語氣，不追求逐字逐句對應。**

例如中文一句很短，英文可能需要稍微改寫才能自然。

只要：
- 核心意思不變
- 強度不升級
- 不加入原文沒有的判斷
- 不改變產品立場

即可接受。

---

# 7. 星語的產品語氣

六語都應保留：

- 溫柔
- 清醒
- 不說教
- 不羞辱
- 不診斷
- 不讀心
- 不替使用者決定愛情
- 有陪伴感
- 適合每日看到
- 適合分享出去

不是：
- 心理治療語錄
- 戀愛攻略
- 算命
- 心靈雞湯過度承諾
- 分手勸告
- 情緒勒索

---

# 8. 不得擴大「喜歡」為「愛」

繁中大量使用：

> 喜歡

各語言不得一律翻成強烈的：

> love / amour / amor

需依句子判斷使用：

- like
- have feelings for
- care about
- feel drawn to
- miss
- be interested in

西班牙文、法文也需注意不同動詞的感情強度。

原則：

> **原文若只是「喜歡」，翻譯不能無故升級為深愛或承諾。**

---

# 9. 不得增加「命中注定」類承諾

原文沒有的內容不得翻譯加入：

- destined
- meant to be
- soulmate
- forever
- true love
- fate brought you together
- 一定會在一起
- 他就是對的人

365 星語不是預言。

---

# 10. 不得把柔和提醒翻成命令

中文：

> 今天先不要問他怎麼想，問問自己怎麼了。

翻譯應保留邀請／提醒感。

避免變成過度命令：

> Stop thinking about them.

產品應接近：

> Maybe today, instead of guessing what they're thinking, check in with yourself first.

各語言依自然語感調整。

---

# 11. 暫時性與不確定性要保留

若中文使用：

- 也許
- 有時候
- 不一定
- 可能
- 值得看看
- 慢慢

翻譯不得刪除這些緩衝詞，使句子變成絕對判斷。

例如：

> 有時候你放不下的，是習慣，不一定是愛。

不得翻成：

> You're not in love. It's only habit.

應保留：

> Sometimes what’s hard to let go of may be the habit, not necessarily love.

---

# 12. 不讀取對方內心

365 星語可以提醒使用者觀察行動，但不得因翻譯變成：

> If they love you, they will always...

尤其原文如：

> 如果他願意，他會用行動讓你知道。

翻譯時要避免過度絕對化成「真正愛你的人一定如何」。

---

# 13. 不診斷使用者

原文中的：

- 上癮
- 焦慮
- 不安
- 猜測
- 內耗

屬日常描述。

翻譯不得自動升級為：

- addiction disorder
- anxiety disorder
- obsessive disorder
- codependency
- attachment disorder
- pathology

例如：

> 有些人讓你上癮，不一定讓你安心。

英文可依語境使用：
> Some people can feel addictive without making you feel secure.

但不得把使用者診斷為 addiction。

---

# 14. 文化自然化

星語內容涉及：

- 回訊息
- 秒回
- 已讀
- 社群
- 等待
- 曖昧
- 關係未定義
- 主動／被動
- 見面
- 相處

六語都應翻成當地人自然理解的現代戀愛語境。

不需要硬保留台灣特有表達。

---

# 15. 「秒回」在地化

中文：

> 秒回

不可機械直譯。

依語言自然化為：

- instant reply
- replying right away
- quick replies
- immediate responses

重點是：

> **把回覆速度當成感情證明。**

不是字面上的「一秒」。

---

# 16. 「已讀」在地化

中文：

> 已讀

在 EN / ES / FR 可依自然語境使用：

- read receipt
- seen
- whether they read the message
- message status

不必追求同一名詞。

重點保留：

> **使用者會因訊息狀態反覆猜測。**

---

# 17. 「曖昧」在地化

「曖昧」在不同語言沒有完全相同的一詞對應。

可視句子採：

- mixed signals
- flirting
- undefined relationship
- romantic ambiguity
- something between us

不得因找不到單字而硬翻成 `ambiguity`，導致像論文。

---

# 18. 「清醒」在星語中的處理

中文「清醒」帶有「看清自己／看清現實」的產品語意。

其他語言可依句子使用：

- clarity
- stay grounded
- see things clearly
- come back to yourself
- keep perspective

不必每次使用同一個字。

但核心不得變成：
- cold
- detached
- cynical
- stop loving

---

# 19. 「把自己弄丟」等比喻

中文：

> 把自己弄丟
> 把注意力拿回來
> 把生活拿回來
> 把一部分心留給自己

英文等語言可以概念式翻譯：

- lose sight of yourself
- bring your attention back to yourself
- reclaim some space in your life
- keep part of your heart for yourself

不要逐字造成不自然句子。

---

# 20. 性別中立

中文目前常使用：

> 他

六語翻譯應盡可能保持可適用於不同性別與關係。

英文優先：

> they / them

日文、韓文可在自然情況下省略主詞。

西班牙文、法文需在自然與包容間取得平衡。

不因翻譯把 App 限制為：
- 男追女
- 女追男
- 異性戀情境

---

# 21. 關係狀態中立

365 星語須自然適用於：

- 單戀
- 暈船
- 曖昧
- 約會
- 交往
- 關係未定義
- 疏遠
- 放不下某個人

若原文沒有明示已交往，翻譯也不得自動寫成：

> boyfriend / girlfriend / partner

---

# 22. 星語應保持「短」

星語會出現在每日卡片與分享卡上。

翻譯不是越完整越好。

原則：

> **自然、完整、短而有餘韻。**

如果字面翻譯很長，可合理改寫。

---

# 23. 建議長度基準

不是硬性字數上限，但翻譯 QA 需注意：

- `zh-TW`：維持現有短句感
- `en`：盡量 8～24 words
- `ja`：盡量一至兩行自然短句
- `ko`：盡量一至兩行
- `es`：注意通常比英文長
- `fr`：注意通常比英文長

若超出卡片：
優先重寫，不縮小到難讀字級。

---

# 24. 不破壞原本的「句子節奏」

部分星語採對偶／連續結構，例如：

```text
Day 98  別把等待當成忠誠。
Day 99  別把忍耐當成深情。
Day 100 別把忽冷忽熱當成浪漫。
```

翻譯時應盡量保留三天之間的節奏與結構一致。

同理：

```text
Day 173～176
Day 181～184
Day 251～253
```

若相鄰 Day 有設計上的呼應，應在六語中盡量保留。

---

# 25. 不任意合併相鄰 Day

即使 Day 98～100 是一組，也必須是三個獨立 Day。

不得翻成一段後拆錯。

---

# 26. 主題連續性

365 星語內容有自然的主題流動，例如：

- 心動與自我
- 看行動而非猜測
- 安心與界線
- 喜歡 vs 習慣
- 事實 vs 想像
- 把注意力帶回自己
- 現實中的互動
- 尊重與雙向
- 重新選擇
- 保留自己的生活

翻譯不得把某一 Day 改成完全不同主題。

---

# 27. 高風險句 QA

以下類型需特別人工檢查：

1. 「愛／喜歡」強度
2. 「適合／不適合」
3. 「真正喜歡你的人」
4. 「如果他願意」
5. 「離開」
6. 「沉沒成本」
7. 「上癮」
8. 「焦慮」
9. 「身體知道答案」
10. 「你已經知道答案」

目的：

避免翻譯後變成：
- 絕對愛情結論
- 心理診斷
- 強迫分手建議
- 宿命論

---

# 28. 例：Day 5

Canonical：

> 真正讓人安心的喜歡，不需要一直猜。

翻譯重點：
- 安心
- 不必一直猜
- 不表示「真正愛你的人永遠不讓你猜」

英文自然方向：

> A connection that feels secure shouldn't leave you guessing all the time.

不要：

> True love never makes you guess.

---

# 29. 例：Day 29

Canonical：

> 不要因為一句曖昧，就先替未來寫完整故事。

核心：
- 不因一個模糊／曖昧訊號預先想完整未來

英文方向：

> Don't write the whole future from one flirty moment.

可依最終語感再潤飾。

---

# 30. 例：Day 108

Canonical：

> 有時候你放不下的，是習慣，不一定是愛。

核心：
- 習慣與愛可以不同
- 不替使用者下結論

必須保留：
- 有時候
- 不一定

---

# 31. 例：Day 126

Canonical：

> 你的心不是沉沒成本。

這是高度文化／概念句。

不可逐字翻成讓使用者不懂的經濟學句子。

可視語言改寫為：

> The time you've invested doesn't mean your heart has to keep investing.

但需保持簡潔與原意。

翻譯 QA 應特別標記。

---

# 32. 例：Day 159

Canonical：

> 放下不是刪掉，是不再被它拉走。

核心：
- 放下不是抹除記憶
- 是不再被牽著走

英文不必直翻 `delete`，可保留現代語感，例如：

> Letting go isn't erasing it. It's not letting it pull you around anymore.

---

# 33. 例：Day 180

Canonical：

> 情緒是真的，但不代表每個念頭都是真的。

必須避免心理治療專業化。

保持簡潔：
- feelings are real
- thoughts are not necessarily facts

但不要增加診斷語言。

---

# 34. 例：Day 300～301

Canonical：

> 真正的戀愛，不是把自己弄丟。
> 而是在靠近一個人的同時，仍然知道自己是誰。

兩天具連續性。

翻譯需讓 Day 300、301 單獨可讀，
同時連續看到時也自然呼應。

---

# 35. 每條星語的翻譯 QA 模板

建議處理 365 條時保存檢查資料：

```text
Day:
Key:

zh-TW:
en:
ja:
ko:
es:
fr:

Core meaning:
Tone:
High-risk terms:
Cross-day relation:
Length check:
Semantic PASS:
Naturalness PASS:
UI PASS:
```

不一定要放入 production JSON，但翻譯工作階段應可追蹤。

---

# 36. Translation Memory / Glossary

翻譯前建立六語 glossary。

至少涵蓋：

- 喜歡
- 愛
- 心動
- 安心
- 想念
- 曖昧
- 回應
- 秒回
- 已讀
- 界線
- 雙向
- 清醒
- 猜
- 期待
- 放下
- 習慣
- 被理解
- 被尊重
- 做自己
- 把注意力帶回自己

但 glossary 是一致性輔助，不要求每次固定使用同一譯詞。

語境自然度優先。

---

# 37. 翻譯執行順序

建議：

```text
1. zh-TW canonical audit
2. English 365
3. English semantic + naturalness QA
4. Japanese 365
5. Japanese QA
6. Korean 365
7. Korean QA
8. Spanish 365
9. Spanish QA
10. French 365
11. French QA
12. Six-language cross comparison
13. UI / share-card regression
14. Missing-key audit
```

不要一次五語機械翻完後才第一次檢查。

---

# 38. 分批工作建議

365 條建議分批：

```text
Day 001–050
Day 051–100
Day 101–150
Day 151–200
Day 201–250
Day 251–300
Day 301–365
```

每批完成：
- translation
- semantic QA
- naturalness QA
- key count

再進下一批。

---

# 39. 不得因翻譯修改中文母版

翻譯過程若發現中文內容可能值得調整：

> **先列為 review item，不直接修改 canonical。**

除非產品端另行決定。

避免翻譯工作偷偷改動原始 365 天內容。

---

# 40. 程式資料建議

可使用等價結構：

```ts
type DailyLoveQuoteKey =
  | "day001"
  | "day002"
  | ...
  | "day365"
```

各 locale：

```ts
dailyLoveQuotes: {
  day001: "...",
  day002: "...",
  ...
}
```

或獨立 JSON：

```text
daily-love-quotes.zh-TW.json
daily-love-quotes.en.json
daily-love-quotes.ja.json
daily-love-quotes.ko.json
daily-love-quotes.es.json
daily-love-quotes.fr.json
```

依現有專案 architecture 決定，不為此重構整套 i18n。

---

# 41. Runtime 不應儲存翻譯全文作 identity

資料層若需要記錄每日星語狀態，儲存：

```text
dayIndex
activationDate
localDate
```

不要儲存：

```text
"喜歡一個人沒有錯..."
```

作為 identity。

這樣 locale 切換後仍可直接重新 render 當日語言。

---

# 42. 切換語言案例

必測：

```text
今天為 Day 142
zh-TW 顯示 Day 142 中文
↓
切 en
↓
仍是 Day 142
顯示英文 Day 142
```

不可變成 Day 1。

---

# 43. 跨日案例

例如：

```text
Day 365
↓
隔日本地日期
↓
Day 1
```

此循環與 locale 無關。

切換任何語言都不改變 cycle。

---

# 44. 錯過一天案例

例如：

```text
使用者 Day 30 未開 App
Day 31 再開
```

應顯示：

```text
Day 31
```

不是補發 Day 30。

六語皆相同。

---

# 45. Share Card

分享時使用：

> **目前 locale 的當日星語**

分享內容不得：
- 使用中文硬 fallback
- 因 locale 切換而拿錯 Day
- 顯示另一語言的舊 cached text

若 share card 有品牌文字：
品牌文字也須依既有 i18n 規則處理。

---

# 46. Share Card 版面

六語需測：
- 長句自動換行
- 字級不因西文過長縮到難讀
- 不 overflow
- 不裁字
- 無文字 baked into image asset

若某語言過長：
優先改善翻譯句型。

---

# 47. Responsive QA

至少：

```text
320px
390px
432px
```

六語逐一檢查：

- Today 星語卡
- share preview
- system share text
- 按鈕
- quotation layout

---

# 48. 語言完整性自動測試

建議加入測試：

```text
for each locale:
  count == 365
  day001 exists
  day365 exists
  no empty string
```

並檢查：

```text
same key set across all 6 locales
```

預期：

```text
365 keys × 6 locales
```

---

# 49. 中文殘留檢查

EN / JA / KO / ES / FR runtime 中不應因缺 key 出現整句繁中。

可建立自動檢查：

```text
missing = 0
empty = 0
```

對非中文 locale 做額外 suspicious Chinese-character scan 時，
需注意日文也使用漢字，因此不可簡單以所有 CJK 字元判定錯誤。

應以：
- key completeness
- 人工 review
- locale-specific QA

共同判斷。

---

# 50. 標點與引號

各 locale 使用自然標點。

不要強迫所有語言沿用中文：
- ，
- 。
- 「」

例如英文使用英文 punctuation，
法文依法文規則，
日文依日文自然標點。

---

# 51. 西班牙文與法文句長

ES / FR 往往較長。

翻譯時：
- 優先自然改寫
- 保留核心一句
- 避免增加多重子句
- 不為逐字完整犧牲卡片可讀性

---

# 52. 日文與韓文語氣

JA / KO：
- 避免心理問卷／醫療用語
- 避免過度敬語
- 保持每日卡片的溫柔口吻
- 可自然省略主詞
- 不需要逐句保留「你／他」

---

# 53. 英文語氣

英文應：
- contemporary
- warm
- simple
- shareable

避免：
- self-help cliché 過濃
- academic psychology
- therapy-speak 堆疊
- literal Chinese structure

---

# 54. 翻譯不可引入宗教／靈性概念

原 365 星語為戀愛、自我覺察與關係觀察。

翻譯不得自行加入：
- universe
- destiny
- manifestation
- karma
- spiritual connection
- soul contract

除非中文原句本身明確存在。

---

# 55. 翻譯不可引入文化刻板印象

不得自行加：
- 男人都……
- 女人都……
- 日本人……
- 拉丁人……
- 法國式戀愛……

所有語言保持個人關係層次。

---

# 56. 高風險「真正」字眼

繁中多次使用：

> 真正的喜歡
> 真正的愛
> 真正的靠近
> 真正穩定的人

翻譯時不能每次機械變成：

> true love / real love

需理解多數「真正」其實是在強調：
- 穩定
- 雙向
- 一致
- 尊重
- 現實行動

可以自然改寫，避免造成「真假愛」診斷感。

---

# 57. 「適合」字眼

原文有：

> 適合的人
> 不適合
> 是否適合你

翻譯保持：
- 使用者自己的觀察
- 不由 App 判定 compatibility

不要增加：
> This person is/isn't right for you.

除非原句本身就是使用者自問。

---

# 58. 「答案」字眼

原文「答案」常不是字面問題答案，而是：

> 關係的清楚程度／自己如何選擇。

翻譯應依語境用：
- answer
- clarity
- knowing where you stand
- knowing what this means

不要所有 Day 都機械用同一個 word。

---

# 59. QA 分層

每一語言至少經過三層：

## A. Semantic QA
意思有沒有和中文一致？

## B. Naturalness QA
當地人會這樣說嗎？

## C. Product Safety QA
是否因翻譯變成診斷、判決、預言或命令？

三者都 PASS 才算完成。

---

# 60. 最終驗收

每個 locale：

```text
Quote count: 365
Missing: 0
Empty: 0
Wrong Day mapping: 0
Duplicate accidental Day mapping: 0
```

產品 QA：

```text
Day switching PASS
Locale switching PASS
365→1 loop PASS
Missed-day behavior PASS
Native share PASS
Share-card layout PASS
320/390/432 responsive PASS
```

內容 QA：

```text
Semantic intensity PASS
Naturalness PASS
No diagnosis PASS
No relationship prediction PASS
No added destiny/soulmate language PASS
Gender/relationship neutrality PASS
```

---

# 61. 與 Milestone 4C-1 的關係

Milestone 4C 建議拆分：

## 4C-1
清醒四工具六語化

依：
`12-clear-tools-six-language-localization-spec.md`

## 4C-2
365 天戀愛星語六語化

依本文件：
`13-daily-love-quotes-six-language-localization-spec.md`

兩者可以共用：
- glossary
- i18n architecture
- locale QA scripts
- responsive regression

但內容翻譯應分開執行。

---

# 62. Codex 執行限制

未正式開始 4C-2 前：

- 不要自行翻譯全部 365
- 不要改中文 canonical
- 不要重排 Day
- 不要改 activation logic
- 不要改 share behavior
- 不要重構無關 i18n
- 不要 Commit / Push / Publish，除非另有指示

---

# 63. 完成回報格式

4C-2 完成後回報：

1. 六語各自 quote count
2. Missing / Empty
3. 修改檔案
4. Day key structure
5. 是否保留 activation / cycle 規則
6. locale switch 測試
7. share 測試
8. responsive 測試
9. semantic QA 狀態
10. 尚待人工 review 的 Day 清單

---

# 64. 最終產品原則

365 天戀愛星語的國際化，不是製作五份中文翻譯稿。

而是讓六個語言的使用者，在同一天，都能收到：

> **同一份意思、相近的情緒重量，以及自然屬於自己語言的一句話。**

文字可以不同。

Day 不可以不同。

核心意思不可以不同。

對使用者的尊重，也不可以不同。
