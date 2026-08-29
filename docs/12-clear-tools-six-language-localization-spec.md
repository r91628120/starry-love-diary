# 星星戀愛日記｜清醒工具六語國際化規格
## Clear Tools Six-Language Localization Spec

檔名：`12-clear-tools-six-language-localization-spec.md`
版本：V1
用途：Milestone 4C－清醒四工具六語在地化與語意一致性 QA
適用語言：
- 繁體中文 `zh-TW`
- English `en`
- 日本語 `ja`
- 한국어 `ko`
- Español `es`
- Français `fr`

---

# 1. 文件目的

本文件定義《星星戀愛日記》「清醒」四個工具在六種語言中的在地化原則、題目語意強度、命名策略、翻譯禁區、文化適配方式與 QA 驗收標準。

四個工具：

1. **開始整理心情**
2. **暈船法典**
3. **戀愛腦檢測**
4. **喜歡？習慣？**

本規格的核心不是「逐字翻譯」，而是：

> **讓六種語言的使用者，都能理解相同的心理／互動概念，並感受到相近的語氣、強度與產品溫度。**

---

# 2. 國際化核心原則

## 2.1 語意等值優先，不逐字翻譯

正式原則：

> **Assessment localization must preserve semantic intensity, not literal wording.**

中文定義：

> **測驗與反思題目的多語翻譯，以「語意、強度與使用情境一致」優先，而不是逐字一致。**

例如中文：

> 我會特別在意他回覆得快不快、字多不多，或語氣有沒有改變。

英文不建議：

> I pay particular attention to the speed, length, and tonal variation of their responses.

雖然字面準確，但過度正式。

較自然方向：

> I notice how quickly they reply, how much they write, or whether their tone feels different.

---

# 3. 繁體中文是 Canonical Source

所有六語內容以：

```text
zh-TW
```

作為 canonical source。

流程：

```text
繁體中文定稿
↓
語意拆解
↓
各語言自然在地化
↓
跨語言強度檢查
↓
文化適配檢查
↓
QA
```

不得直接：

```text
中文 → 機器翻譯 → 上線
```

---

# 4. Stable Keys 與 UI 名稱分離

程式內 Stable Keys 不隨語言改變。

例如：

```ts
clear_record
love_boat_code
love_brain_assessment
like_or_habit
```

顯示名稱可依語言自然化。

例如：

```text
stable key: love_brain_assessment
```

不要求英文 UI 一定顯示：

> Love Brain Test

可依英文自然語感重新命名。

原則：

> **程式識別固定，使用者看見的文字允許概念式翻譯。**

---

# 5. 不強迫直譯中文網路語彙

以下中文詞彙不得強制逐字翻譯：

- 暈船
- 戀愛腦
- 清醒
- 清醒星星
- 心被牽著走
- 把自己弄丟
- 把心留給自己

這些詞在中文語境自然，但各語言未必有一對一對應詞。

翻譯時優先保留功能意義。

例如：

## 戀愛腦檢測

中文：

> 戀愛腦檢測

英文不建議直接：

> Love Brain Test

可採概念名稱，例如：

> How Love Pulls Your Attention

或其他更自然、可理解的命名。

最終 UI 名稱需經英文語感 QA 後定稿。

---

# 6. 語氣基準

六語都必須保持以下產品語氣：

- 溫和
- 不羞辱
- 不診斷
- 不命令
- 不替使用者做決定
- 不假裝知道對方內心
- 不過度學術
- 不幼稚化
- 不使用過度嚴肅的心理測驗語氣

核心感受：

> **陪使用者看清楚，而不是替使用者判決。**

---

# 7. 題目必須像「真人會說的話」

每一語言翻譯完成後，必須問：

> **如果我是這個語言的 18～35 歲一般使用者，我真的會用這種方式理解或描述這件事嗎？**

避免：
- 心理學論文用語
- 法律／醫療語氣
- 過度正式書面語
- 生硬直譯
- 不符合社群與戀愛情境的詞

---

# 8. 強度一致性

所有量表選項必須保持強度一致。

## 8.1 四級頻率

中文 canonical：

```text
幾乎不會 = 0
偶爾     = 1
有時     = 2
常常     = 3
```

英文語意基準：

```text
Almost never
Occasionally
Sometimes
Often
```

不得把「常常」翻譯成：

> Always

因為 `Always` 強度高於「常常」。

---

# 9. 禁止強度漂移

六語 QA 必須檢查以下問題：

中文：

> 有時

若翻成某語言的：

> 很常

即為強度漂移。

中文：

> 不太確定

若翻成：

> 完全不知道

也屬強度漂移。

每一選項都應保持同一心理距離。

---

# 10. B 區「還不知道」的語意

「暈船法典」B 區：

> 還不知道

是重要產品概念。

各語言必須保留：

> **目前資訊不足 / 尚不能判斷**

而不是：

> 沒有

程式上：

```ts
"unknown"
```

必須保持：

- 題目視為已完成
- 不計負分
- 不進 denominator

所有語言 UI 都應明確讓使用者理解：

> **不知道不是扣分。**

---

# 11. 文化適配原則

部分戀愛行為具有跨文化共通性：

- 等訊息
- 社群查看
- 對方回覆變慢
- 語氣改變
- 猜測對方意思
- 害怕失去
- 為關係犧牲自己

但表達方式可能不同。

翻譯時應保留「行為本質」，不硬保留台灣用詞。

---

# 12. 「已讀」與訊息狀態

中文／日韓對「已讀」概念較常見。

英文、西班牙文、法文不一定使用完全相同語彙。

翻譯可以依語境改成：

- whether they read my message
- seen status
- message status
- whether they have viewed it

原則：

> **保留「我會因訊息狀態而反覆猜測」這個行為，不必強求『已讀』兩字。**

---

# 13. 社群行為在地化

中文題目：

> 我會注意他什麼時候上線、按了誰的讚，或和誰互動。

各語言可依自然程度翻譯為：

- online status
- likes
- reactions
- social activity
- who they interact with

不要限定單一平台品牌。

V1 不寫：

- LINE
- Instagram
- Threads
- WhatsApp
- KakaoTalk
- X

除非未來產品特別需要。

---

# 14. 代名詞與性別中立

繁中題目目前常用：

> 他

但六語在地化應盡量避免造成性別限制。

英文優先：

> they / them

西班牙文、法文、日文、韓文依語法自然處理。

原則：

> **不因翻譯把產品縮限為異性戀關係。**

但也不要為了性別中立而造成極度不自然或難讀的句子。

自然度與包容性需平衡。

---

# 15. 關係狀態中立

所有語言不得預設：

- 已經交往
- 已經告白
- 一定是情侶
- 一定有正式關係

清醒工具要能適用：

- 單戀
- 曖昧
- 約會中
- 交往中
- 未定義關係
- 已經疏遠但仍放不下

---

# 16. 「喜歡」不等於「愛」

中文題目多使用：

> 喜歡

翻譯時不得自動升級為：

> love / 愛

若原題是「喜歡」，英語通常可視情境使用：

- like
- care about
- have feelings for

不要每題都用 `love`。

因為 `love` 在英文、西班牙文、法文中可能具有更強關係承諾。

---

# 17. 「想念」語意

中文：

> 想念

不同語言可依自然語境使用：

- miss
- think about
- long for

需看句子情緒強度。

不得把一般「想念」全部翻成極強烈 longing。

---

# 18. 開始整理心情｜在地化重點

此工具是事件整理，不是測驗。

語氣要像：

> 我們先把事情分開看看。

而不是：

> 請進行認知重組。

重要概念：

- 我確定知道的
- 我腦中正在想的
- 我現在還不知道的

三者在六語中必須清楚區分：

```text
facts
interpretation
unknown
```

不得把 `interpretation` 翻成「事實」。

---

# 19. 暈船法典｜在地化重點

核心不是：

> 測你愛多深

而是：

> 看你投入多少注意力，以及目前看到多少實際回應。

A：

> 我的投入

B：

> 對方實際的回應

A+B：

> 我的投入與現實互動是否在相近節奏

各語言不得翻成：
- compatibility
- love score
- match score
- relationship success rate

---

# 20. 戀愛腦檢測｜在地化重點

五個 Stable Pattern：

```ts
rumination
message_dependency
over_interpretation
detective
self_sacrifice
```

這些是程式分類，不代表 UI 必須直譯成病理標籤。

例如：

`detective`

UI 不一定要顯示：

> Detective Type

可改成較自然的：

> Looking for clues

或當地語言中更柔和的表述。

`message_dependency`

不得翻成心理疾病或 addiction，除非原文有明確依據。

---

# 21. 五模式翻譯原則

## rumination

核心：

> 同一件事反覆在腦中重播。

不能變成：
- obsessive disorder
- compulsive thinking

## message_dependency

核心：

> 情緒容易被訊息與回覆牽動。

不能變成：
- messaging addiction

## over_interpretation

核心：

> 小事情延伸出很多解釋。

不能變成：
- delusion
- paranoia

## detective

核心：

> 為了不確定感而尋找更多線索。

不能變成：
- stalking
- surveillance

## self_sacrifice

核心：

> 為了維持關係把自己的需要往後放。

不能自動翻成：
- codependency
- dependent personality

---

# 22. 喜歡？習慣？｜在地化重點

本工具最需要避免「結果判決」。

核心四面向：

```ts
real_person
habit
fear_of_loss
imagined_relationship
```

翻譯時保留：

> 這些感受可以同時存在。

不得導向：

> 你只是習慣，不是真的喜歡。

不得把 `imagined_relationship` 翻成：

> fantasy relationship

若當地語言會有負面或病理意味。

可以採：

> the relationship I imagine
> expectations about the relationship
> the future I picture

等自然表達。

---

# 23. 結果文案不可變成診斷

繁中：

> 最近的你，比較容易在這裡被牽動。

其他語言也必須保留「最近／目前／比較容易」這種暫時性。

不得翻成：

> You are a message-dependent person.

應接近：

> Lately, messages seem to affect you more strongly.

---

# 24. 禁止語言

六語都不得輸出等價內容：

- 你有病
- 你有依附障礙
- 你有成癮
- 你是控制狂
- 你是跟蹤狂
- 你是渣男／渣女
- 他一定愛你
- 他根本不愛你
- 你們很適合
- 你們不適合
- 你應該告白
- 你應該分手
- 這是真愛
- 你只是寂寞
- 你只是缺愛

---

# 25. 按鈕文字要短

六語按鈕需考慮畫面寬度。

繁中：

> 稍後繼續

英文不必直翻成冗長句。

按鈕原則：
- 自然
- 短
- 動作清楚
- 320px 寬度可正常顯示

避免一個按鈕塞入完整解釋句。

---

# 26. 日文在地化注意

日文需避免：

- 過度直譯中文語序
- 過度敬語
- 心理諮商式正式語氣

App 應更接近日常柔和語氣。

尤其：
- 暈船
- 戀愛腦
- 把自己弄丟

需要概念轉譯，而不是漢字直搬。

---

# 27. 韓文在地化注意

韓文需注意：

- 너무正式的 상담／진단 語氣
- 避免讓「檢測」看起來像醫療量表
- 戀愛語境應自然、現代

「戀愛腦」不可簡單直譯後造成奇怪詞彙。

---

# 28. 英文在地化注意

英文尤其避免：

- academic psychology jargon
- clinical wording
- literal Chinese metaphors that sound unnatural

例如：

> 把自己弄丟

不一定直譯：

> lose yourself

雖然可用，但需看整句自然度。

可以依上下文使用：

- lose sight of yourself
- put yourself aside
- forget your own needs

---

# 29. 西班牙文在地化注意

西班牙文：
- 留意句子容易比中文長
- 按鈕與卡片需做 responsive QA
- 避免過度性別化
- 不使用過於醫療／診斷語彙

需要特別測試 320px 畫面。

---

# 30. 法文在地化注意

法文：
- 句長通常增加
- 注意標點與空格規則
- 不要把柔和提示翻成過度正式書面文
- 避免心理治療或診斷式表達

同樣需做窄螢幕檢查。

---

# 31. 六語翻譯流程

每個工具採以下流程：

## Step 1
確認繁中 canonical 已定稿。

## Step 2
建立語意說明：
- 這題測／反思什麼
- 強度
- 不能被理解成什麼

## Step 3
翻譯 EN。

## Step 4
做英文自然化。

## Step 5
翻譯 JA / KO / ES / FR。

## Step 6
各語言 naturalness review。

## Step 7
回看六語語意強度是否一致。

## Step 8
UI 實機／responsive QA。

---

# 32. 每題翻譯 QA 模板

每一題至少檢查：

```text
Key:
zh-TW:
en:
ja:
ko:
es:
fr:

Semantic intent:
Intensity:
Potential ambiguity:
Cultural note:
PASS / NEEDS REVIEW
```

---

# 33. 四級選項 QA 模板

每一語言確認：

```text
0 = almost never
1 = occasionally
2 = sometimes
3 = often
```

檢查：
- 是否順序正確
- 是否強度逐級
- 是否 3 沒有變成 always
- 是否 0 沒有變成 impossible / never

---

# 34. 結果 Variant QA

每個 result variant 必須檢查：

1. 是否保持非診斷
2. 是否沒有替對方讀心
3. 是否沒有關係判決
4. 是否保留暫時性
5. 是否語氣自然
6. 是否符合原結果 module
7. 是否長度適合手機畫面

---

# 35. Share Card QA

分享卡多語版：

- 不放分數百分比
- 不放對方回應率
- 不放「戀愛腦 %」
- 不放 match %
- 不放診斷
- 標題保持短
- 內容一段即可

避免不同語言因句長造成版面破裂。

---

# 36. 程式實作原則

所有文字：

- 使用 i18n key
- 不 hardcode 到 component
- 不寫在圖片內
- 不把中文當 fallback 顯示在其他語言
- Stable key 不因翻譯改名

若某語言缺 key：
- 開發期應明確報錯或 fallback
- 上線前必須 `missing key = 0`

---

# 37. 六語驗收數字

每個 locale 必須達到：

```text
Missing keys = 0
Empty values = 0
Duplicate invalid keys = 0
Runtime untranslated zh-TW = 0
```

除非品牌名稱或刻意保留詞。

---

# 38. Responsive QA

六語至少測：

```text
320px
390px
432px
```

重點：
- 按鈕不截斷
- 題目不卡出框
- 結果卡自然換行
- 西文長句不 overflow
- 日韓不出現奇怪斷詞
- bottom nav 不遮住內容

---

# 39. 功能一致性 QA

切換不同 locale 後：

- 題目 key 不變
- 已回答資料仍保留
- score 不變
- result logic 不變
- Draft 不消失
- Completed history 不改變
- clearMindStar linkage 不變

語言只改 UI 字串，不得改資料結果。

---

# 40. 跨語言切換案例

必測：

```text
zh-TW 做到第 7 題
↓
切 en
↓
仍在同一題
↓
已答選項一致
↓
繼續完成
```

以及：

```text
en 完成 assessment
↓
切 ja
↓
重新查看 history
↓
顯示日文文案
↓
底層結果 key 不變
```

---

# 41. 不要把結果文案整段存死

建議 persistence 儲存：

- stable result key
- variant index / variant key
- raw answers
- score / band

不要只存：

> 中文結果全文

原因：

切換語言後，歷史應能用新 locale 重新 render。

---

# 42. 日期與時間

歷史頁日期使用 locale formatter。

例如：
- zh-TW：2026/8/30 或產品既有格式
- en：Aug 30, 2026
- ja：2026年8月30日
- ko：2026년 8월 30일
- es / fr：依既有 locale formatter

底層仍保存：

```text
localDate
UTC timestamp
timezone
```

---

# 43. Translation Memory 原則

相同概念盡量使用相同譯詞。

例如：
- clear mind star
- save for later
- not sure yet
- what I know
- what I am imagining
- what I still don't know

建立一致詞彙，不要同 App 中同一概念出現多種翻譯。

---

# 44. 建議建立 glossary

未來翻譯前建立六語 glossary，至少包含：

```text
清醒
清醒星星
星心值
開始整理心情
暈船法典
戀愛腦檢測
喜歡？習慣？
我知道的
我猜的
還不知道
我的投入
目前的回應
稍後繼續
完成
查看歷史
```

正式翻譯時先定 glossary，再翻題庫。

---

# 45. Milestone 分工

建議：

## Milestone 4B
先完成：
- 功能
- 資料模型
- score logic
- Draft
- history
- zh-TW canonical UI

## Milestone 4C
再完成：
- EN
- JA
- KO
- ES
- FR
- naturalness QA
- semantic intensity QA
- responsive QA
- cross-locale persistence QA

不要把 4C 翻譯品質工作塞進 4B 同一個 Codex 大任務。

---

# 46. 4C 建議執行順序

```text
1. EN
2. JA
3. KO
4. ES
5. FR
6. six-language semantic comparison
7. responsive regression
8. final missing-key audit
```

每完成一語就測，不要五語一次全部翻完才第一次驗證。

---

# 47. 最終驗收標準

六語全部符合：

- 語意一致
- 強度一致
- 自然口語
- 無翻譯腔
- 無診斷化
- 無愛情判決
- 無性別不必要限制
- 無文化明顯不自然
- Missing Key = 0
- Empty Key = 0
- UI overflow = 0
- 同一資料切換語言後結果邏輯不變
- 所有歷史可依當前 locale 重繪

---

# 48. 最終產品原則

六語版的目標，不是讓每一個字都和中文完全一樣。

真正要做到的是：

> **六個語言的使用者，在看到同一題時，心裡理解的是同一件事。**

以及：

> **六個語言的使用者，在看到結果時，都不會覺得 App 在診斷、責備或替自己決定愛情。**

最後原則：

> **文字可以因文化而不同，但產品對人的尊重必須完全一致。**
