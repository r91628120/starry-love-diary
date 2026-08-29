# 《星星戀愛日記》資料結構表 v1.2

版本：v1.2  
用途：作為《星星戀愛日記》V1 的最終整合資料模型、Local First 儲存、跨頁同步與 Codex 開發基準。  
建議最終正式檔名：`docs/data-model.md`

> 本版整合舊版 v1.0、v1.1 與目前最新 UI／功能定稿內容。確認後可直接改名為 `data-model.md` 作為唯一開發基準。

---

# 1. 核心資料原則

1. **Local First**
   - V1 核心資料主要儲存在使用者裝置。
   - 主要功能離線可用。
   - V1 不依賴 AI API 才能正常運作。

2. **Single Source of Truth**
   - 同一份資料只保存一次。
   - 例如：暱稱、對方照片、重要日子由不同頁面共用同一資料來源。

3. **手機本地日期／時區**
   - 所有「今天」依手機目前 local date/time/timezone 判斷。
   - 跨時區旅行時，「今天」跟隨目前裝置時區。
   - 建立紀錄時保存 UTC timestamp + local_date + timezone。

4. **圖片採 App 壓縮副本**
   - 從手機相簿選取後建立 App 專用壓縮副本。
   - 建議長邊約 1080px。
   - 資料庫只保存 URI 與 metadata。

5. **全面 i18n**
   - 所有可變文字由程式顯示。
   - 圖片不燒入固定文字。
   - 資料庫儲存 stable key，不儲存翻譯後字串。

6. **從 V1 就支援 Migration**
   - `schema_version = 1`
   - 未來每次資料結構重大修改都需 migration。

---

# 2. V1 主要資料實體

- `AppSettings`
- `UserProfile`
- `PartnerProfile`
- `Relationship`
- `ImportantDate`
- `PhotoAsset`
- `PhotoLayout`
- `MoodRecord`
- `DiaryEntry`
- `DiaryPhoto`
- `Star`
- `HeartLine`
- `MemoryMoment`
- `MessageToYou`
- `RememberedYouCard`
- `ClearMindRecord`
- `ClearMindSignalAnswer`
- `ClearMindTask`
- `LoveBrainAssessment`
- `LoveBrainAssessmentAnswer`
- `SailingCodeAssessment`
- `SailingCodeAnswer`
- `LikeOrHabitAssessment`
- `LikeOrHabitAnswer`
- `NotificationSettings`
- `BackupMetadata`
- `HeartRevealProject`
- `HeartRevealLine`
- `HeartRevealCard`

特殊只讀內容庫：
- `DailyLoveQuote`
- `ClearQuote`
- `ClearMindSignalQuestion`
- `LoveBrainQuestion`
- `SailingCodeQuestion`
- `LikeOrHabitQuestion`

---

# 3. AppSettings

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---:|---|
| id | string | ✓ | 固定 id |
| first_launch_at | datetime | ✓ | 第一次啟用 UTC timestamp |
| first_launch_local_date | date | ✓ | 第一次啟用本地日期 |
| first_launch_timezone | string | ✓ | 首次時區 |
| onboarding_completed | boolean | ✓ | 是否完成首次暱稱設定 |
| locale | string | ✓ | `zh-TW`, `en`, `ja`, `ko`, `es`, `fr` |
| follow_system_locale | boolean | ✓ | 是否跟隨系統語言 |
| schema_version | integer | ✓ | 初始為 1 |
| created_at | datetime | ✓ | 建立 |
| updated_at | datetime | ✓ | 更新 |

---

# 4. DailyLoveQuote：365 天限時戀愛星語

## Day N 計算

```text
dayIndex = calendarDaysBetween(first_launch_local_date, current_device_local_date)
dayN = (dayIndex % 365) + 1
```

正式規則：

- Day 1～365。
- Day 366 回到 Day 1。
- 每 365 天循環一次。
- 只顯示今天。
- 不顯示昨天／過去／未來。
- 當天未開啟即永久錯過。
- 不建立已讀歷史。
- 不收藏。
- 不進星星瓶。
- 只提供系統分享。

建議內容位置：

```text
src/content/love-quotes/zh-TW.json
src/content/love-quotes/en.json
src/content/love-quotes/ja.json
src/content/love-quotes/ko.json
src/content/love-quotes/es.json
src/content/love-quotes/fr.json
```

---

# 5. UserProfile

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---:|---|
| id | string | ✓ | 本機 id |
| nickname | string | ✓ | 首次 onboarding 必填，建議最多 20 字 |
| birthday | date |  | 可空白 |
| profile_photo_id | string |  | 關聯 `PhotoAsset` |
| created_at | datetime | ✓ | 建立 |
| updated_at | datetime | ✓ | 更新 |

使用頁面：

- 今天
- 設定
- 分享卡（使用者主動選擇時）

---

# 6. PartnerProfile

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---:|---|
| id | string | ✓ | 本機 id |
| nickname | string | ✓ | 首次 onboarding 必填，建議最多 20 字 |
| birthday | date |  | 可空白 |
| profile_photo_id | string |  | 關聯 `PhotoAsset` |
| created_at | datetime | ✓ | 建立 |
| updated_at | datetime | ✓ | 更新 |

V1 不新增明星／寵物模式特殊欄位；行銷可說明 App 可延伸使用。

---

# 7. Relationship

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---:|---|
| id | string | ✓ | 關係 id |
| status | enum |  | `unset`, `crush`, `ambiguous`, `dating`, `paused`, `archived` |
| met_date | date |  | 相識日 |
| dating_date | date |  | 交往日 |
| anniversary_date | date |  | 紀念日 |
| star_heart_value | integer | ✓ | 星心值，預設 0 |
| archived_at | datetime |  | 封存時間 |
| created_at | datetime | ✓ | 建立 |
| updated_at | datetime | ✓ | 更新 |

`status` V1 保留為備用欄位，不一定顯示於 UI。

---

# 8. 星心值規則

V1 暫定正式規則：

- 每日開啟 App：`+1`（每天最多一次）
- 新增一篇日記：`+7`
- 選擇今天心情：`+2`（每天最多一次）
- 完成一次「開始整理心情」：`+5`
- 分享當日戀愛星語：`+10`（每天最多一次）
- 編輯既有內容不重複加分
- 戀愛腦檢測不列入每日加分
- 暈船法典不列入每日加分
- 喜歡？習慣？不列入每日加分
- 七句愛心按壓不按次數加分

建議建立事件表防止重複：

## `StarHeartEvent`

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| event_type | string | `daily_open`, `diary_created`, `mood_selected`, `clear_completed`, `quote_shared` |
| local_date | date | 當地日期 |
| source_id | string | 可選 |
| points | integer | 加分 |
| created_at | datetime | 建立 |

---

# 9. ImportantDate

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---:|---|
| id | string | ✓ | 唯一 id |
| title | string | ✓ | 名稱 |
| date | date | ✓ | 日期 |
| description | string |  | 建議 100 字內 |
| photo_id | string |  | 可選 |
| reminder_enabled | boolean | ✓ | 是否提醒 |
| reminder_offset_days | integer |  | 0/1/3/7 |
| sort_order | integer | ✓ | 排序 |
| created_at | datetime | ✓ | 建立 |
| updated_at | datetime | ✓ | 更新 |

---

# 10. PhotoAsset

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---:|---|
| id | string | ✓ | 唯一 id |
| category | enum | ✓ | `profile`, `partner`, `diary`, `gallery`, `moment`, `important_date`, `heart_reveal` |
| local_uri | string | ✓ | App 本機 URI |
| thumbnail_uri | string |  | 縮圖 URI |
| width | integer | ✓ | 寬 |
| height | integer | ✓ | 高 |
| file_size_bytes | integer | ✓ | 壓縮後大小 |
| mime_type | string | ✓ | 圖片格式 |
| source_created_at | datetime |  | 原照片拍攝時間 |
| created_at | datetime | ✓ | 匯入時間 |
| updated_at | datetime | ✓ | 更新 |

正式規則：

- 「我們」頁珍藏照片總上限：**60 張**
- 刪除前檢查引用
- 原相簿照片被刪除後，App 壓縮副本仍保留

---

# 11. PhotoLayout

用途：「我們」頁回憶牆 1～6 張拼貼。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| layout_type | string | 版型 key |
| photo_count | integer | 1～6 |
| slots_json | JSON | photo_id、裁切、位置 |
| is_active | boolean | 是否目前主版型 |
| created_at | datetime | 建立 |
| updated_at | datetime | 更新 |

---

# 12. MoodRecord

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| local_date | date | 當地日期 |
| mood | enum | `flutter`, `happy`, `peaceful`, `miss`, `uneasy`, `sad`, `rumination` |
| created_at | datetime | 建立 |
| updated_at | datetime | 更新 |
| timezone | string | 建立時區 |

同一天只保留目前選擇的一筆。

---

# 13. DiaryEntry

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| local_date | date | 歸屬日期 |
| title | string | 可選 |
| content | string | 最多 1000 字 |
| mood | string | 可選 |
| linked_clear_mind_id | string | 可選 |
| saved_as_star | boolean | 是否存為心情星星 |
| created_at | datetime | 建立 |
| updated_at | datetime | 更新 |
| timezone | string | 建立時區 |

---

# 14. DiaryPhoto

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| diary_entry_id | string | 關聯日記 |
| photo_id | string | 關聯 `PhotoAsset` |
| sort_order | integer | 排序 |
| created_at | datetime | 建立 |

**正式上限：每篇最多 3 張照片。**

---

# 15. Star

V1 星星瓶只保留：

- `mood`：心情星星
- `clear_mind`：清醒星星

正式取消：

- 戀愛星語星星
- 時光星星

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| type | enum | `mood`, `clear_mind` |
| source_id | string | 來源紀錄 id |
| title | string | 可選 |
| content | string | 星星內容 |
| mood | string | 可選 |
| source_type | string | 來源模組 |
| created_at | datetime | 建立 |
| local_date | date | 當地日期 |
| timezone | string | 時區 |

---

# 16. 一句心話 `HeartLine`

用途：今天頁的短句收藏。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| content | string | 最多 30 字 |
| local_date | date | 建立當地日期 |
| sort_order | integer | 排序 |
| is_active | boolean | 是否顯示於今天頁前 3 句 |
| created_at | datetime | 建立 |
| updated_at | datetime | 更新 |

規則：

- 最多 **20 句**
- 每句最多 **30 字**
- 可編輯
- 可刪除
- 可排序
- 今天頁最多顯示前 3 句

---

# 17. MemoryMoment

「我們的時刻」。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| title | string | 標題 |
| date | date | 日期 |
| short_description | string | 短故事 |
| photo_id | string | 可選 |
| icon_type | string | 可選 |
| sort_order | integer | 排序 |
| created_at | datetime | 建立 |
| updated_at | datetime | 更新 |

正式上限：

- 最多 **20 筆**

---

# 18. MessageToYou

整個目前故事只允許 1 份。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 固定 id |
| relationship_id | string | 關聯故事 |
| message | string | 最多 300 字 |
| updated_at | datetime | 更新 |

---

# 19. RememberedYouCard

「我記得的你」。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| title | string | 使用者自訂標題 |
| content | string | 最多 100 字 |
| local_date | date | 使用者實際寫下當天的手機本地日期 |
| is_favorite | boolean | 愛心標記 |
| created_at | datetime | 建立 |
| updated_at | datetime | 更新 |

正式規則：

- 最多 **50 張**
- 自訂標題
- 內容最多 **100 字**
- 自動保存建立當天 `local_date`
- 可編輯
- 可刪除
- 可搜尋標題與內容
- 可「只看愛心」
- 不為每張卡新增照片
- 區塊可共用對方／關係照片作視覺背景
- App 只記錄，不替對方做人設分析

---

# 20. ClearMindRecord

用途：「開始整理心情」。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| trigger_type | string | 情境 key |
| trigger_custom_text | string | 自訂 |
| fact_text | string | 事實 |
| interpretation_text | string | 我的解讀 |
| unknown_text | string | 還不知道 |
| emotion_primary | string | 主要情緒 |
| emotion_secondary | string | 次要情緒 |
| intensity_before | integer | 1～10 |
| intensity_after | integer | 可選 |
| signal_green_count | integer | 明確訊號 |
| signal_yellow_count | integer | 模糊訊號 |
| signal_red_count | integer | 注意訊號 |
| summary_text | string | 清醒小結 |
| selected_action | string | 最後選擇的行動 |
| linked_diary_id | string | 可選 |
| saved_as_star | boolean | 是否存為清醒星星 |
| created_at | datetime | 建立 |
| local_date | date | 當地日期 |
| timezone | string | 時區 |

---

# 21. ClearMindSignalAnswer

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| clear_mind_record_id | string | 關聯紀錄 |
| question_id | string | 題庫 id |
| answer | enum | `yes`, `sometimes`, `no`, `unknown` |
| signal_type | enum | `green`, `yellow`, `red` |

---

# 22. ClearMindTask

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| clear_mind_record_id | string | 關聯 |
| task_type | string | 行動類型 |
| title | string | 任務文字 |
| duration_minutes | integer | 可選 |
| completed | boolean | 是否完成 |
| completed_at | datetime | 可選 |
| created_at | datetime | 建立 |

---

# 23. LoveBrainAssessment

「戀愛腦檢測」。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| primary_type | string | 主要類型 |
| secondary_type | string | 次要類型 |
| score_json | JSON | 各類型分數 |
| completed_at | datetime | 完成 |
| local_date | date | 當地日期 |
| timezone | string | 時區 |

可能類型：

- `rumination`
- `message_dependency`
- `over_interpretation`
- `detective`
- `self_sacrifice`

正式規則：

- 約 25～30 題
- 本機規則計分
- **可隨時重測**
- **不設 30 天限制**
- 保留歷次結果與日期

---

# 24. LoveBrainAssessmentAnswer

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| assessment_id | string | 關聯測驗 |
| question_id | string | 題目 id |
| answer_value | integer | 例如 1～5 |
| created_at | datetime | 建立 |

---

# 25. SailingCodeAssessment

「暈船法典」測驗歷史。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| self_score | integer | 我是不是暈太深 |
| relationship_score | integer | 我是不是暈錯人 |
| self_level | string | 分層結果 key |
| relationship_level | string | 分層結果 key |
| completed_at | datetime | 完成 |
| local_date | date | 當地日期 |
| timezone | string | 時區 |

正式規則：

- 兩章分開計分
- 可隨時重測
- 保存歷次結果
- 不直接判定海王／海后
- 只描述高風險互動訊號

---

# 26. SailingCodeAnswer

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| assessment_id | string | 關聯 |
| question_id | string | 題目 id |
| section | enum | `self`, `relationship` |
| answer_value | integer | 0～3 |
| created_at | datetime | 建立 |

---

# 27. LikeOrHabitAssessment

「喜歡？習慣？」測驗歷史。

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| like_score | integer | 真實喜歡 |
| habit_score | integer | 習慣／依戀 |
| memory_score | integer | 回憶留戀 |
| result_type | string | 結果 key |
| completed_at | datetime | 完成 |
| local_date | date | 當地日期 |
| timezone | string | 時區 |

正式規則：

- 可隨時重測
- 保存歷次結果
- 對外語言不用心理學術語
- 核心提問：到底是我真的喜歡他，還是只是習慣有他？

---

# 28. LikeOrHabitAnswer

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| assessment_id | string | 關聯 |
| question_id | string | 題目 id |
| dimension | enum | `like`, `habit`, `memory` |
| answer_value | integer | 題目分值 |
| created_at | datetime | 建立 |

---

# 29. 清醒首頁導引

「今天，我需要哪一種清醒？」是 UI 導航，不需建立資料表。

固定 5 個入口：

- 我一直想他 → 開始整理心情
- 我在等他的訊息 → 開始整理心情
- 我覺得自己暈太深 → 暈船法典
- 我不知道還喜不喜歡他 → 喜歡？習慣？
- 我不知道這個人適不適合我 → 暈船法典「暈錯人」

---

# 30. NotificationSettings

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 固定 id |
| daily_quote_enabled | boolean | 戀愛星語通知 |
| daily_quote_time | time | 通知時間 |
| important_date_enabled | boolean | 重要日子提醒 |
| anniversary_enabled | boolean | 紀念日提醒 |
| default_offset_days | integer | 0/1/3/7 |
| created_at | datetime | 建立 |
| updated_at | datetime | 更新 |

---

# 31. BackupMetadata

V1 正式規則：

> **備份只包含文字與結構化資料，不包含照片。**

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| backup_version | string | schema version |
| created_at | datetime | 備份時間 |
| app_version | string | App Version |
| build_number | string | Build |
| includes_photos | boolean | V1 固定 false |
| record_count_json | JSON | 各資料筆數 |
| checksum | string | 可選 |

---

# 32. 七句心話・照片顯影

## `HeartRevealProject`

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| photo_id | string | 本次唯一照片 |
| status | enum | `active`, `completed`, `archived` |
| progress_count | integer | 0～7 |
| created_at | datetime | 建立 |
| completed_at | datetime | 可選 |

## `HeartRevealLine`

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| project_id | string | 關聯 |
| line_index | integer | 1～7 |
| content | string | 最多 30 字 |
| local_date | date | 當地日期 |
| heart_press_count | integer | 0～7 |
| is_confirmed | boolean | 第 7 次愛心後成立 |
| created_at | datetime | 建立 |
| updated_at | datetime | 更新 |

規則：

- 一天最多建立 1 句
- 每句最多 30 字
- 第 7 次愛心後成立
- 成立 1 句解鎖照片 1/7
- 不要求連續 7 天
- 已成立句子可編輯
- 刪除成立句會讓進度回退

## `HeartRevealCard`

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一 id |
| project_id | string | 關聯 |
| selected_line_id | string | 從 7 句選 1 句 |
| template_type | enum | `top`, `bottom`, `left_bottom`, `right_bottom` |
| text_size | enum | `small`, `medium`, `large` |
| text_align | enum | `left`, `center` |
| created_at | datetime | 建立 |

完成後：

- 可重新選句
- 可重新選版型
- 可重新生成
- 可儲存到手機
- 可呼叫系統分享

---

# 33. 頁面與資料來源對照

| 頁面 | 主要資料來源 |
|---|---|
| 今天 | AppSettings, UserProfile, PartnerProfile, Relationship, MoodRecord, HeartLine, DailyLoveQuote, HeartRevealProject |
| 星星瓶 | Star, DiaryEntry, ClearMindRecord |
| 足跡 | DiaryEntry, DiaryPhoto, MoodRecord, ClearMindRecord |
| 我們 | PartnerProfile, Relationship, PhotoAsset, PhotoLayout, ImportantDate, MemoryMoment, MessageToYou, RememberedYouCard |
| 清醒 | ClearMindRecord, ClearMindSignalAnswer, ClearMindTask, LoveBrainAssessment, SailingCodeAssessment, LikeOrHabitAssessment |
| 設定 | 幾乎所有共用資料 |

---

# 34. 搜尋索引

需要搜尋：

- `DiaryEntry.title`
- `DiaryEntry.content`
- `Star.title`
- `Star.content`
- `MemoryMoment.title`
- `MemoryMoment.short_description`
- `ImportantDate.title`
- `ImportantDate.description`
- `RememberedYouCard.title`
- `RememberedYouCard.content`
- `ClearMindRecord.trigger_custom_text`
- `ClearMindRecord.fact_text`
- `ClearMindRecord.interpretation_text`
- `ClearMindRecord.unknown_text`

---

# 35. 刪除規則

## 一般紀錄
日記、時刻、重要日子、清醒紀錄、我記得的你：
- 單筆刪除前確認。

## 圖片
刪除 `PhotoAsset` 前：
- 檢查是否仍被 Profile、Diary、PhotoLayout、MemoryMoment、ImportantDate、HeartRevealProject 引用。

## 七句心話
刪除已成立句：
- 進度回退 1
- 照片重新遮回一塊

## 清除全部資料
- 必須二次確認
- 建議提供備份提醒

---

# 36. 封存故事

封存 != 刪除。

封存時：

- `Relationship.status = archived`
- 保留日記
- 星星
- 照片
- 重要日子
- 我們的時刻
- 想對你說
- 我記得的你
- 清醒紀錄
- 測驗歷史

V1 先支援單一目前故事＋封存即可。

---

# 37. i18n 資料原則

資料庫儲存 stable key。

例如：

```text
mood = "flutter"
```

UI 顯示：

```text
zh-TW → 心動
en    → Flutter
ja    → ときめき
```

適用：

- mood
- 清醒類型
- 戀愛腦類型
- 暈船法典層級
- 喜歡？習慣？結果
- 星星類型
- 固定標籤

---

# 38. 建議本機儲存層

## 結構化資料
優先：

- SQLite
- repository layer

## 圖片

- App sandbox file system
- DB 只存 URI 與 metadata

## 內建內容

JSON：

- 365 戀愛星語
- 清醒星語
- 關係訊號題庫
- 戀愛腦題庫
- 暈船法典題庫
- 喜歡？習慣？題庫

---

# 39. 建議 Repository 模組

```text
src/
├─ data/
│  ├─ repositories/
│  │  ├─ settingsRepository
│  │  ├─ profileRepository
│  │  ├─ relationshipRepository
│  │  ├─ photoRepository
│  │  ├─ diaryRepository
│  │  ├─ moodRepository
│  │  ├─ starRepository
│  │  ├─ heartLineRepository
│  │  ├─ memoryRepository
│  │  ├─ clearMindRepository
│  │  ├─ loveBrainRepository
│  │  ├─ sailingCodeRepository
│  │  ├─ likeOrHabitRepository
│  │  └─ heartRevealRepository
│  └─ migrations/
├─ content/
│  ├─ love-quotes/
│  ├─ clear-mind-quotes/
│  ├─ clear-mind-signals/
│  ├─ love-brain-questions/
│  ├─ sailing-code-questions/
│  └─ like-or-habit-questions/
└─ services/
   ├─ localDateService
   ├─ dayNumberService
   ├─ photoCompressionService
   ├─ backupService
   ├─ shareService
   └─ notificationService
```

---

# 40. V1 資料安全底線

1. 日記與私人照片不自動分享。
2. 所有分享由使用者主動觸發。
3. 分享前提供預覽。
4. 不自動上傳 Threads。
5. V1 不把日記內容傳給 AI API。
6. 清空資料需二次確認。
7. V1 備份不含照片。
8. 權限採最小化原則。
9. 若未來備份內容含敏感文字，需評估加密。

---

# 41. V1 已定案

- [x] Day 365 後循環 Day 1
- [x] 每篇日記最多 3 張照片
- [x] 星星瓶只保留心情星星＋清醒星星
- [x] V1 取消時光星星
- [x] 星心值初版規則
- [x] Relationship status 保留備用
- [x] V1 備份不含照片
- [x] 新增一句心話（20 句上限）
- [x] 新增我記得的你（50 張上限＋建立日期）
- [x] 新增七句心話・照片顯影
- [x] 戀愛腦檢測取消 30 天重測限制
- [x] 新增暈船法典
- [x] 新增喜歡？習慣？
- [x] 清醒所有功能皆可隨時重做
- [x] 首次 onboarding 收集「我的暱稱＋對方暱稱」

---

# 42. V1 資料模型驗收條件

- [ ] 首次登入只出現一次 onboarding。
- [ ] 暱稱修改後「今天」頁立即同步。
- [ ] 我的照片與對方照片跨頁同步。
- [ ] 相識日修改後「我們」頁立即更新。
- [ ] 日記新增後「足跡」立即出現。
- [ ] 每篇日記最多 3 張照片。
- [ ] 心情星星與清醒星星進入星星瓶。
- [ ] 不存在時光星星。
- [ ] 每日戀愛星語不建立歷史。
- [ ] Day 365 後正確循環 Day 1。
- [ ] 一句心話最多 20 句。
- [ ] 我記得的你最多 50 張。
- [ ] 我記得的你自動記錄建立日期。
- [ ] 七句心話每天最多成立 1 句。
- [ ] 七句顯影完成後可重新生成完成卡。
- [ ] 戀愛腦檢測可隨時重測。
- [ ] 暈船法典可隨時重測。
- [ ] 喜歡？習慣？可隨時重測。
- [ ] 歷次清醒／測驗結果保留日期。
- [ ] 備份不包含照片。
- [ ] 語言切換不改變使用者原始資料。
- [ ] App 關閉與手機重開後資料仍存在。
- [ ] migration 不遺失舊資料。
- [ ] 刪除照片不破壞其他仍引用的紀錄。

---

# 43. 最終結論

《星星戀愛日記》V1 資料架構正式遵守：

> **資料只存一次，頁面共同讀取。**  
> **日期依手機當地時間判斷。**  
> **照片採本機壓縮副本。**  
> **戀愛星語每日限時、365 天循環、不留歷史。**  
> **星星瓶只保留心情星星與清醒星星。**  
> **清醒工具可隨時使用，不設重測期限。**  
> **App 只做記錄與整理，不替使用者分析或判定對方。**

確認本文件後，建議正式改名為：

# `docs/data-model.md`

並讓 Codex 只以此檔作為 V1 資料結構唯一基準。
