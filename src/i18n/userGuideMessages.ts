import type { Locale } from './messages'

const zhTW = {
  'settings.guide.intro': '從想了解的主題開始展開。這裡只說明目前 App 已提供的操作與資料保存方式。',
  'settings.guide.today.title': '今天',
  'settings.guide.today.body': `戀愛星語
每天顯示一句；第一次使用 App 的日期會成為 Day 1。可以分享當天星語，但目前沒有星語歷史頁，也不會發送星語通知。

今天的心情
點選最接近今天狀態的心情後會立即保存。同一天可重新選擇，新的選擇會更新當日紀錄；一天最多一顆心情星星。心情可在足跡回顧，星星可在星星瓶查看。

七句心話
1. 每次在文字框寫一句想留下的話，每句最多 30 字。
2. 按愛心按鈕七次，才完成並保存這一句；一次只寫一句，不是一次輸入七句。
3. 重複逐句保存，共完成七句；進度會從 1/7 增加到 7/7，中途離開仍會保留已保存的句子。
4. 已保存的句子會列在今天頁，可再次查看、編輯或刪除。進度到 7/7 後，可選一句製作完整顯影卡片。

七句心話・照片顯影
先到照片設定選擇一張照片，並可調整位置與縮放。每保存一句，照片會由 1/7 逐步清晰到 7/7；第七句後可選一句確認並製作分享圖片，完成後開始下一輪。App 內移除的只是 App 使用的照片副本，不會刪除手機相簿原圖。

近期重要日子
此卡片從「我們」的「重要日子」讀取近期資料，供今天頁查看與回顧；它不是系統通知或行事曆提醒。`,
  'settings.guide.bottle.title': '星星瓶',
  'settings.guide.bottle.body': `星星怎麼來
選擇今日心情會保存一顆心情星星；同一天改心情只更新同一筆，不會多出星星。完成清醒工具不會自動得星；想收藏時，請在完成結果頁按「存成清醒星星」。

篩選與搜尋
「今日／本月／本年／全部」依星星日期顯示不同範圍。搜尋可比對星星類型、主要文字、內容與日期；完整列表會按年、月分組。

星星與星心值
星星是可回看的心情或清醒收藏；星心值是使用 App、完成特定行動留下的累積足跡。兩者是不同系統，不會互相換算。`,
  'settings.guide.footprints.title': '足跡',
  'settings.guide.footprints.body': `集中回顧
月曆會標示已有紀錄的日期；足跡把心情、日記與已完成的清醒紀錄集中顯示，並不是另外複製一份資料。

瀏覽與搜尋
先看到近期三筆，再按「查看全部足跡」。完整列表可依年、月展開或收合，也可用日期、類型與摘要文字搜尋。

日記
日記摘要可展開或收合，點入後可查看詳情；今天的日記可新增、編輯或刪除，內容上限 1000 字。刪除會移除原紀錄，請先確認。`,
  'settings.guide.our.title': '我們',
  'settings.guide.our.body': `回憶牆照片
可從 App 照片庫加入照片，選擇牆上位置、更換、調整位置與縮放，或從牆上移除。App 最多保存 60 張照片、牆面同時呈現 6 個位置；移除 App 內副本不會刪除手機相簿原圖。

重要日子與我們的時刻
重要日子可新增、編輯或刪除，過去日期也能保存，並可能顯示在今天頁；目前不會建立系統或行事曆通知。我們的時刻可新增、編輯、刪除，並加入、更換、調整或移除照片，最多 20 筆。

想對你說
可保存一段最多 300 字的私人文字，也可編輯、清除或製作分享卡片。保存本身只留在 App 內，不會直接傳訊息給對方。

我記得的你
用卡片記下關於對方的小事；可新增、編輯、刪除、搜尋與收藏，最多 50 張，每張最多 100 字。`,
  'settings.guide.clear.title': '清醒',
  'settings.guide.clear.body': `共同操作
選好答案後會停在原題，確認後再按「下一題」。看到結果並完成工具，和按「存成清醒星星」收藏結果，是兩個不同動作。

開始整理心情
依序分開事實／解讀／未知，再整理情緒、需求與下一步，最後按完成保存這次整理。

暈船法典
依題目分區逐題回答，到最後查看預覽並正式完成；完成後可自行選擇是否存成清醒星星。

戀愛腦檢測
共 25 題。每題選完仍停在原題，按「下一題」才前進；第 25 題完成後按「查看結果」，在結果頁再按「完成這次檢測」。若要收藏，完成後另按「存成清醒星星」。

喜歡？習慣？
依四個區段逐題回答，最後先查看結果預覽，再確認正式完成；完成後可自行存成清醒星星。

重新開始
只會清除目前尚未完成的答題草稿，不會刪除已完成的歷史紀錄或已收藏的星星。`,
  'settings.guide.data.title': '資料與設定',
  'settings.guide.data.body': `語言
可切換繁中、English、日本語、한국어、Español、Français。

匯出文字資料
產生給人閱讀的 .txt，不含照片，也不能重新匯入 App。

匯出與匯入 App 資料
App 資料匯出為 JSON，可日後重新匯入，但不含照片。匯入採合併方式，不會整批覆蓋；相同紀錄保留更新時間較新的版本，且不會清除目前裝置上的照片。

清空目前戀情資料
這是不可復原的破壞性操作，會經過兩次確認；建議先匯出 App 資料。完成後會清除目前故事與 App 內照片副本並回到首次建立故事流程，但不會刪除手機相簿原圖，語言等 App 設定也會保留。`,
} as const

type GuideKey = keyof typeof zhTW
type GuideCatalog = Record<GuideKey, string>

export const userGuideMessages: Record<Locale, GuideCatalog> = {
  'zh-TW': zhTW,
  en: {
    'settings.guide.intro': 'Open any topic to learn how the current app works and how it saves your data.',
    'settings.guide.today.title': 'Today',
    'settings.guide.today.body': `Daily Love Quote
One quote appears each day, and the date you first use the app becomes Day 1. You can share today’s quote; there is currently no quote history or quote notification.

Today’s Mood
Tap the mood closest to how you feel and it saves immediately. A later choice on the same day updates that day’s record, so there is at most one mood star per day. Review moods in Footprints and stars in the Star Bottle.

Seven Heart Phrases
1. Write one short phrase at a time, up to 30 characters.
2. Press the heart button seven times to complete and save that phrase. You do not enter all seven phrases at once.
3. Repeat until seven phrases are saved. Progress moves from 1/7 to 7/7, and saved phrases remain if you leave midway.
4. Saved phrases appear on Today and can be viewed, edited, or deleted. At 7/7, choose one phrase to make the fully revealed card.

Seven Heart Phrases · Photo Reveal
Choose one photo in photo settings and adjust its position and zoom. Each saved phrase reveals it from 1/7 through 7/7. After the seventh, choose a phrase, confirm, and create the share image; completing it starts a new cycle. Removing the app’s copy never deletes the original from your phone library.

Upcoming Important Date
This card reads upcoming entries from Important Dates under Our for display and reflection. It is not a system notification or calendar alert.`,
    'settings.guide.bottle.title': 'Star Bottle',
    'settings.guide.bottle.body': `How stars are created
Choosing today’s mood saves one mood star; changing the mood that day updates the same record. Clarity tools do not award a star automatically. On a completed result, tap “Save as a clarity star” if you want to keep it.

Filters and search
Today, Month, Year, and All filter by the star’s date. Search checks the star type, main text, content, and date; the full list is grouped by year and month.

Stars and Starheart points
Stars are saved mood or clarity memories. Starheart points are an accumulated trace of particular actions in the app. They are separate systems and are not converted into each other.`,
    'settings.guide.footprints.title': 'Footprints',
    'settings.guide.footprints.body': `One place to look back
The calendar marks dates with records. Footprints brings moods, diaries, and completed clarity records together; it does not store duplicate copies.

Browse and search
You first see three recent items. Choose “View all footprints” for the full list, expand or collapse years and months, and search by date, type, or summary.

Diary
Expand or collapse a diary summary, then open it for details. Today’s diary can be added, edited, or deleted and holds up to 1,000 characters. Deleting removes the original record.`,
    'settings.guide.our.title': 'Our',
    'settings.guide.our.body': `Memory Wall photos
Add photos from the app photo library, choose a wall slot, replace them, adjust position and zoom, or remove them from the wall. The app stores up to 60 photos and shows 6 wall slots. Removing an app copy never deletes the phone-library original.

Important Dates and Our Moments
Important Dates can be added, edited, or deleted, including past dates, and may appear on Today. They do not create system or calendar notifications. Our Moments supports add, edit, delete, and photo add/replace/adjust/remove, up to 20 entries.

A Message for You
Save one private message of up to 300 characters, edit or clear it, or make a share card. Saving it keeps it inside the app; it does not send a message to the other person.

What I Remember About You
Keep small details as cards. Add, edit, delete, search, and favorite up to 50 cards, with up to 100 characters each.`,
    'settings.guide.clear.title': 'Clarity',
    'settings.guide.clear.body': `How the tools move forward
Choosing an answer leaves you on the current question; press “Next” after checking it. Finishing a tool and choosing “Save as a clarity star” are separate actions.

Organize My Feelings
Separate facts, interpretations, and unknowns, then work through emotions, needs, and a next step before completing the reflection.

Infatuation Guide
Answer each question by section, view the preview at the end, and explicitly finish. You may then choose whether to save a clarity star.

Love Brain Check
There are 25 questions. Each answer stays on its question until you press “Next.” After question 25, press “View result,” then “Finish this check” on the result page. To collect it, separately press “Save as a clarity star.”

Like or Habit?
Answer the four sections, review the result preview, then explicitly finish. Saving it as a clarity star remains optional.

Restart
Restart clears only the active unfinished draft. It does not delete completed history or collected stars.`,
    'settings.guide.data.title': 'Data & Settings',
    'settings.guide.data.body': `Language
Choose Traditional Chinese, English, Japanese, Korean, Spanish, or French.

Export text data
Creates a human-readable .txt file without photos. It cannot be imported back into the app.

Export and import app data
App export creates re-importable JSON without photos. Import merges rather than replacing everything; for matching records, the newer updated version is kept, and photos already on this device are not cleared.

Clear current relationship data
This irreversible action requires two confirmations, so export app data first. It clears the current story and app photo copies, then returns to first-time story setup. Phone-library originals stay safe, and app settings such as language remain.`,
  },
  ja: {
    'settings.guide.intro': '知りたい項目を開くと、現在のアプリの操作方法とデータの保存について確認できます。',
    'settings.guide.today.title': '今日',
    'settings.guide.today.body': `恋愛の星ことば
毎日一つ表示され、初めてアプリを使った日が Day 1 になります。その日のことばは共有できますが、現在は履歴画面や通知はありません。

今日の気分
今の気分に近いものをタップすると、すぐに保存されます。同じ日に選び直すと当日の記録が更新され、気分の星は一日一つまでです。気分は足あと、星は星のボトルで振り返れます。

七つの心のことば
1. 残したい短いことばを一つずつ、30文字以内で入力します。
2. ハートボタンを7回押すと、その一文が完成して保存されます。七文を一度に入力するものではありません。
3. 一文ずつ保存し、全部で七文完成させます。進み具合は1/7から7/7になり、途中で離れても保存済みの文は残ります。
4. 保存した文は今日の画面で確認・編集・削除できます。7/7になると一文を選び、写真がすべて現れたカードを作れます。

七つの心のことば・写真が現れるまで
写真設定で一枚選び、位置と拡大率を調整できます。一文保存するたびに1/7から7/7まで少しずつ鮮明になります。七文目の後に一文を選んで確定し、共有画像を作ると次のサイクルが始まります。アプリ内の写真コピーを削除しても、端末の写真ライブラリの原本は削除されません。

もうすぐの大切な日
「ふたり」の「大切な日」から近い予定を読み込み、今日の画面で表示します。システム通知やカレンダー通知ではありません。`,
    'settings.guide.bottle.title': '星のボトル',
    'settings.guide.bottle.body': `星ができるとき
今日の気分を選ぶと気分の星が一つ保存され、同じ日の変更は同じ記録を更新します。整理ツールを終えただけでは星は増えません。残したい場合は完了結果で「気づきの星として保存」を押します。

絞り込みと検索
今日・今月・今年・すべてを星の日付で絞り込みます。種類、主な文、内容、日付を検索でき、全一覧は年と月でまとまります。

星とスター・ハート値
星は気分や気づきの保存記録、スター・ハート値は特定の行動で積み重なる足あとです。別の仕組みで、相互に換算されません。`,
    'settings.guide.footprints.title': '足あと',
    'settings.guide.footprints.body': `まとめて振り返る
カレンダーには記録のある日が表示されます。気分、日記、完了した整理記録を一か所にまとめたもので、別のコピーを保存する機能ではありません。

閲覧と検索
最初は最近の3件を表示します。「すべての足あとを見る」で全一覧を開き、年と月を展開・折りたたみできます。日付、種類、要約でも検索できます。

日記
要約を展開・折りたたみし、詳細を開けます。今日の日記は追加・編集・削除でき、上限は1000文字です。削除すると元の記録が消えるため、確認してから行ってください。`,
    'settings.guide.our.title': 'ふたり',
    'settings.guide.our.body': `思い出の壁の写真
アプリの写真ライブラリから追加し、壁の位置を選び、差し替え、位置・拡大率の調整、壁からの取り外しができます。保存は最大60枚、壁の表示枠は6つです。アプリ内コピーを削除しても端末の原本は残ります。

大切な日とふたりの時間
大切な日は過去の日付も追加・編集・削除でき、今日の画面に表示されることがあります。通知は作成しません。ふたりの時間は最大20件で、追加・編集・削除と写真の追加・差し替え・調整・取り外しができます。

あなたに伝えたいこと
300文字までの非公開メッセージを一つ保存し、編集・消去・共有カード作成ができます。保存しただけでは相手に送信されません。

覚えているあなた
小さなことをカードに残し、追加・編集・削除・検索・お気に入り登録ができます。最大50枚、各100文字までです。`,
    'settings.guide.clear.title': '気持ちの整理',
    'settings.guide.clear.body': `共通の進め方
答えを選んでも自動では進みません。確認して「次へ」を押します。ツールの完了と「気づきの星として保存」は別の操作です。

気持ちを整理する
事実・解釈・分からないことを分け、感情、必要としていること、次の一歩を整理してから完了します。

ときめきガイド
区分ごとに回答し、最後に結果のプレビューを見て正式に完了します。その後、星として残すかを選べます。

恋愛パターンチェック
全25問です。回答後は同じ問に留まり、「次へ」で進みます。25問目の後に「結果を見る」、結果画面で「今回のチェックを完了」を押します。残す場合はさらに「気づきの星として保存」を押します。

好き？それとも習慣？
四つの区分に回答し、結果プレビューを確認してから正式に完了します。星への保存は任意です。

最初からやり直す
未完了の下書きだけを消します。完了履歴や保存済みの星は削除されません。`,
    'settings.guide.data.title': 'データと設定',
    'settings.guide.data.body': `言語
繁體中文、English、日本語、한국어、Español、Françaisから選べます。

テキストデータを書き出す
閲覧用の.txtを作成します。写真は含まれず、アプリへ再読み込みできません。

アプリデータの書き出しと読み込み
写真を除く再読み込み可能なJSONを作成します。読み込みは全置換ではなく統合で、同じ記録は更新日時が新しい方を残し、端末内の現在の写真を消しません。

現在の恋愛データを消去
取り消せないため二回確認します。先にアプリデータを書き出してください。現在の物語とアプリ内写真コピーを消し、最初の物語設定へ戻ります。端末の原本と、言語などの設定は残ります。`,
  },
  ko: {
    'settings.guide.intro': '궁금한 항목을 열어 현재 앱의 사용 방법과 데이터 저장 방식을 확인할 수 있어요.',
    'settings.guide.today.title': '오늘',
    'settings.guide.today.body': `오늘의 사랑 문장
매일 한 문장이 나타나며 앱을 처음 사용한 날이 Day 1이 됩니다. 오늘 문장은 공유할 수 있지만 현재 별도 기록 화면이나 알림은 없어요.

오늘의 기분
오늘과 가장 가까운 기분을 누르면 즉시 저장됩니다. 같은 날 다시 고르면 그날 기록이 업데이트되며 기분 별은 하루에 하나만 생겨요. 기분은 발자국, 별은 별병에서 볼 수 있어요.

마음 일곱 문장
1. 남기고 싶은 짧은 문장을 한 번에 하나씩, 30자 이내로 적어요.
2. 하트 버튼을 7번 눌러야 그 한 문장이 완료되어 저장됩니다. 일곱 문장을 한꺼번에 입력하는 방식이 아니에요.
3. 한 문장씩 저장해 모두 일곱 문장을 완성해요. 진행은 1/7부터 7/7까지 늘어나며 중간에 나가도 저장된 문장은 남아요.
4. 저장된 문장은 오늘 화면에서 다시 보고 수정하거나 삭제할 수 있어요. 7/7이 되면 한 문장을 골라 사진이 모두 드러난 카드를 만들 수 있어요.

마음 일곱 문장 · 사진 드러내기
사진 설정에서 한 장을 고르고 위치와 확대 정도를 조절해요. 문장 하나를 저장할 때마다 사진이 1/7부터 7/7까지 선명해집니다. 일곱 번째 문장 뒤에 한 문장을 골라 확정하고 공유 이미지를 만들면 다음 주기가 시작돼요. 앱 안의 사진 사본을 지워도 휴대폰 사진 원본은 삭제되지 않아요.

다가오는 소중한 날
‘우리’의 ‘소중한 날’에서 가까운 날짜를 불러와 오늘 화면에 보여 줍니다. 시스템 알림이나 캘린더 알림은 아니에요.`,
    'settings.guide.bottle.title': '별병',
    'settings.guide.bottle.body': `별이 생기는 방법
오늘의 기분을 고르면 기분 별 하나가 저장되고, 같은 날 바꾸면 같은 기록이 업데이트돼요. 마음 정리 도구를 끝내도 별이 자동으로 생기지는 않아요. 남기고 싶다면 완료 결과에서 ‘마음 정리 별로 저장’을 눌러 주세요.

필터와 검색
오늘·이번 달·올해·전체는 별 날짜를 기준으로 보여 줍니다. 별 종류, 주요 문구, 내용, 날짜를 검색할 수 있고 전체 목록은 연도와 월로 묶여요.

별과 별마음 점수
별은 기분이나 마음 정리 결과를 보관한 기록이고, 별마음 점수는 앱에서 특정 행동을 하며 쌓이는 흔적이에요. 서로 다른 체계이며 환산되지 않아요.`,
    'settings.guide.footprints.title': '발자국',
    'settings.guide.footprints.body': `한곳에서 돌아보기
달력에는 기록이 있는 날짜가 표시돼요. 기분, 일기, 완료한 마음 정리 기록을 모아 보는 곳이며 데이터를 한 벌 더 저장하지 않아요.

보기와 검색
처음에는 최근 3개를 보여 줍니다. ‘모든 발자국 보기’에서 연도와 월을 펼치거나 접고 날짜, 종류, 요약으로 검색할 수 있어요.

일기
요약을 펼치거나 접고 상세 내용을 열 수 있어요. 오늘 일기는 추가·수정·삭제할 수 있고 최대 1,000자예요. 삭제하면 원래 기록이 없어지므로 확인해 주세요.`,
    'settings.guide.our.title': '우리',
    'settings.guide.our.body': `추억 벽 사진
앱 사진 보관함에서 추가하고 벽 위치를 고른 뒤 교체, 위치·확대 조절, 벽에서 제거를 할 수 있어요. 앱에는 최대 60장, 벽에는 6칸이 표시됩니다. 앱 사본을 지워도 휴대폰 사진 원본은 지워지지 않아요.

소중한 날과 우리의 순간
소중한 날은 지난 날짜도 추가·수정·삭제할 수 있고 오늘 화면에 보일 수 있어요. 시스템이나 캘린더 알림은 만들지 않아요. 우리의 순간은 최대 20개이며 기록과 사진을 추가·수정·교체·조절·삭제할 수 있어요.

너에게 하고 싶은 말
최대 300자의 비공개 문장 하나를 저장하고 수정·지우기·공유 카드 만들기를 할 수 있어요. 저장만으로 상대에게 메시지가 전송되지는 않아요.

내가 기억하는 너
작은 기억을 카드로 남기고 추가·수정·삭제·검색·즐겨찾기할 수 있어요. 최대 50장, 카드마다 100자까지예요.`,
    'settings.guide.clear.title': '마음 정리',
    'settings.guide.clear.body': `공통 진행 방식
답을 골라도 자동으로 다음 문제로 넘어가지 않아요. 확인한 뒤 ‘다음’을 눌러요. 도구 완료와 ‘마음 정리 별로 저장’은 별개의 동작이에요.

마음 정리 시작하기
사실·해석·모르는 점을 나누고 감정, 필요, 다음 행동을 정리한 뒤 완료해요.

설렘 가이드
영역별 질문에 답하고 마지막에 결과 미리보기를 확인한 뒤 완료해요. 이후 별로 저장할지 직접 선택할 수 있어요.

연애 패턴 점검
총 25문항이에요. 답을 고른 뒤에도 같은 문제에 머물며 ‘다음’을 눌러 이동해요. 25번째 답 뒤 ‘결과 보기’를 누르고 결과 화면에서 ‘이번 점검 완료’를 눌러요. 보관하려면 별도로 ‘마음 정리 별로 저장’을 눌러요.

좋아함? 습관?
네 영역에 답하고 결과 미리보기를 본 뒤 직접 완료해요. 별 저장은 선택 사항이에요.

다시 시작
진행 중인 미완료 답변 초안만 지워요. 완료 기록과 저장한 별은 삭제되지 않아요.`,
    'settings.guide.data.title': '데이터와 설정',
    'settings.guide.data.body': `언어
繁中, English, 日本語, 한국어, Español, Français를 선택할 수 있어요.

텍스트 데이터 내보내기
사람이 읽는 .txt를 만들며 사진은 포함하지 않아요. 앱으로 다시 가져올 수는 없어요.

앱 데이터 내보내기와 가져오기
사진을 제외한, 다시 가져올 수 있는 JSON을 만들어요. 가져오기는 전체 덮어쓰기가 아니라 병합이며 같은 기록은 업데이트 시간이 더 최신인 것을 남기고 현재 기기 사진을 지우지 않아요.

현재 관계 데이터 비우기
되돌릴 수 없어 두 번 확인하며 먼저 앱 데이터를 내보내는 것이 좋아요. 현재 이야기와 앱 안의 사진 사본을 지운 뒤 처음 이야기 설정으로 돌아갑니다. 휴대폰 원본과 언어 같은 앱 설정은 남아요.`,
  },
  es: {
    'settings.guide.intro': 'Abre el tema que necesites para consultar el uso actual de la app y cómo guarda tus datos.',
    'settings.guide.today.title': 'Hoy',
    'settings.guide.today.body': `Frase de amor diaria
Cada día aparece una frase; la fecha del primer uso es el Día 1. Puedes compartir la frase de hoy, pero actualmente no hay historial ni notificaciones de frases.

Estado de ánimo de hoy
Toca el estado que mejor te represente y se guardará al instante. Si cambias de opción el mismo día, se actualiza ese registro y solo hay una estrella de ánimo diaria. Revísalo en Huellas y en el Frasco de estrellas.

Siete frases del corazón
1. Escribe una frase breve cada vez, con un máximo de 30 caracteres.
2. Pulsa siete veces el botón del corazón para completar y guardar esa frase; no se escriben las siete a la vez.
3. Repite hasta guardar siete frases. El progreso va de 1/7 a 7/7 y lo ya guardado permanece si sales a mitad.
4. Las frases aparecen en Hoy y pueden verse, editarse o borrarse. Al llegar a 7/7, elige una para crear la tarjeta con la foto revelada.

Siete frases · Revelado de foto
Elige una foto en sus ajustes y modifica posición y zoom. Cada frase guardada la revela de 1/7 a 7/7. Tras la séptima, elige una frase, confirma y crea la imagen para compartir; después comienza un nuevo ciclo. Borrar la copia de la app nunca elimina el original del teléfono.

Próxima fecha importante
Muestra en Hoy datos próximos de Fechas importantes, dentro de Nosotros. Sirve para consultar y recordar; no es una notificación del sistema ni del calendario.`,
    'settings.guide.bottle.title': 'Frasco de estrellas',
    'settings.guide.bottle.body': `Cómo se crean las estrellas
Elegir el ánimo de hoy guarda una estrella; cambiarlo el mismo día actualiza la misma. Las herramientas de claridad no crean estrellas automáticamente: en el resultado terminado pulsa «Guardar como estrella de claridad».

Filtros y búsqueda
Hoy, Mes, Año y Todo filtran por fecha. La búsqueda revisa tipo, texto principal, contenido y fecha; la lista completa se agrupa por año y mes.

Estrellas y valor corazón-estrella
Las estrellas guardan recuerdos de ánimo o claridad. El valor corazón-estrella acumula huellas de acciones concretas. Son sistemas distintos y no se convierten entre sí.`,
    'settings.guide.footprints.title': 'Huellas',
    'settings.guide.footprints.body': `Un lugar para recordar
El calendario marca días con registros. Huellas reúne estados de ánimo, diarios y ejercicios de claridad terminados; no duplica los datos.

Explorar y buscar
Primero muestra tres elementos recientes. En «Ver todas las huellas» puedes desplegar o plegar años y meses y buscar por fecha, tipo o resumen.

Diario
Despliega o pliega el resumen y abre el detalle. El diario de hoy admite añadir, editar o borrar hasta 1000 caracteres. Al borrar se elimina el registro original.`,
    'settings.guide.our.title': 'Nosotros',
    'settings.guide.our.body': `Fotos del muro de recuerdos
Añade fotos desde la biblioteca de la app, elige un hueco, reemplaza, ajusta posición y zoom o retira del muro. La app guarda hasta 60 fotos y muestra 6 huecos. Borrar una copia de la app no borra el original del teléfono.

Fechas importantes y Nuestros momentos
Puedes añadir, editar y borrar fechas, también pasadas, que pueden aparecer en Hoy; no crean avisos. Nuestros momentos admite hasta 20 entradas con edición, borrado y gestión de fotos.

Lo que quiero decirte
Guarda un mensaje privado de hasta 300 caracteres, edítalo, bórralo o crea una tarjeta. Guardarlo no envía ningún mensaje a la otra persona.

Lo que recuerdo de ti
Añade, edita, borra, busca y marca como favoritas hasta 50 tarjetas, de 100 caracteres cada una.`,
    'settings.guide.clear.title': 'Claridad',
    'settings.guide.clear.body': `Funcionamiento común
Elegir una respuesta no avanza automáticamente; compruébala y pulsa «Siguiente». Terminar una herramienta y guardarla como estrella son acciones distintas.

Ordenar mis emociones
Separa hechos, interpretaciones e incógnitas; después revisa emociones, necesidades y siguiente paso antes de terminar.

Guía de ilusión
Responde por secciones, revisa la vista previa y termina expresamente. Después decides si guardas una estrella.

Revisión de patrones afectivos
Tiene 25 preguntas. Tras responder permaneces en la misma hasta pulsar «Siguiente». Después de la 25, pulsa «Ver resultado» y luego «Finalizar esta revisión». Para guardarla, pulsa aparte «Guardar como estrella de claridad».

¿Me gusta o es costumbre?
Responde cuatro secciones, revisa la vista previa y confirma el final. Guardar una estrella es opcional.

Reiniciar
Solo borra el borrador activo sin terminar. No elimina el historial terminado ni las estrellas guardadas.`,
    'settings.guide.data.title': 'Datos y ajustes',
    'settings.guide.data.body': `Idioma
Puedes elegir chino tradicional, inglés, japonés, coreano, español o francés.

Exportar texto
Crea un .txt legible, sin fotos, que no puede volver a importarse.

Exportar e importar datos de la app
La exportación crea JSON reimportable sin fotos. La importación combina en vez de reemplazar; conserva la versión más reciente del mismo registro y no borra las fotos actuales.

Borrar los datos de la relación actual
Es irreversible y requiere dos confirmaciones: exporta antes los datos. Borra la historia y copias de fotos de la app y vuelve al inicio, pero conserva originales del teléfono y ajustes como el idioma.`,
  },
  fr: {
    'settings.guide.intro': 'Ouvrez un thème pour découvrir le fonctionnement actuel de l’app et la conservation de vos données.',
    'settings.guide.today.title': 'Aujourd’hui',
    'settings.guide.today.body': `Phrase d’amour du jour
Une phrase apparaît chaque jour ; votre première utilisation devient le Jour 1. Vous pouvez partager la phrase du jour, mais il n’existe actuellement ni historique ni notification dédiée.

Humeur du jour
Touchez l’humeur la plus proche de votre état : elle est enregistrée immédiatement. Un nouveau choix le même jour met à jour l’entrée, avec une seule étoile d’humeur par jour. Retrouvez l’humeur dans Empreintes et l’étoile dans le Bocal.

Sept phrases du cœur
1. Écrivez une courte phrase à la fois, limitée à 30 caractères.
2. Appuyez sept fois sur le bouton cœur pour terminer et enregistrer cette phrase ; les sept phrases ne sont pas saisies ensemble.
3. Recommencez jusqu’à sept phrases. La progression va de 1/7 à 7/7 et les phrases enregistrées restent si vous quittez en cours de route.
4. Elles sont visibles, modifiables et supprimables dans Aujourd’hui. À 7/7, choisissez-en une pour créer la carte entièrement révélée.

Sept phrases · Révélation photo
Choisissez une photo dans les réglages, puis ajustez position et zoom. Chaque phrase la révèle de 1/7 à 7/7. Après la septième, choisissez une phrase, confirmez et créez l’image à partager ; un nouveau cycle commence ensuite. Supprimer la copie de l’app ne supprime jamais l’original du téléphone.

Prochaine date importante
Cette carte affiche dans Aujourd’hui une date proche enregistrée sous Nous. Elle sert à consulter et se souvenir ; ce n’est ni une notification système ni une alerte de calendrier.`,
    'settings.guide.bottle.title': 'Bocal à étoiles',
    'settings.guide.bottle.body': `Création des étoiles
Choisir l’humeur du jour enregistre une étoile ; la modifier le même jour met à jour la même entrée. Les outils de clarté n’en créent pas automatiquement : sur un résultat terminé, touchez « Enregistrer comme étoile de clarté ».

Filtres et recherche
Aujourd’hui, Mois, Année et Tout filtrent selon la date. La recherche porte sur le type, le texte principal, le contenu et la date ; la liste complète est groupée par année et mois.

Étoiles et valeur cœur-étoile
Les étoiles conservent des souvenirs d’humeur ou de clarté. La valeur cœur-étoile cumule les traces de certaines actions. Ces systèmes sont distincts et ne se convertissent pas.`,
    'settings.guide.footprints.title': 'Empreintes',
    'settings.guide.footprints.body': `Revoir au même endroit
Le calendrier marque les dates ayant des entrées. Empreintes réunit humeurs, journaux et exercices de clarté terminés sans dupliquer les données.

Parcourir et rechercher
Trois éléments récents s’affichent d’abord. « Voir toutes les empreintes » ouvre la liste, permet de déplier ou replier années et mois et de rechercher par date, type ou résumé.

Journal
Dépliez ou repliez un résumé puis ouvrez le détail. Le journal du jour peut être ajouté, modifié ou supprimé, avec 1 000 caractères maximum. La suppression retire l’entrée d’origine.`,
    'settings.guide.our.title': 'Nous',
    'settings.guide.our.body': `Photos du mur de souvenirs
Ajoutez depuis la photothèque de l’app, choisissez un emplacement, remplacez, ajustez position et zoom ou retirez du mur. L’app conserve jusqu’à 60 photos et affiche 6 emplacements. Supprimer une copie dans l’app ne touche pas l’original du téléphone.

Dates importantes et Nos moments
Ajoutez, modifiez ou supprimez des dates, même passées, qui peuvent apparaître dans Aujourd’hui ; elles ne créent pas d’alerte. Nos moments accepte jusqu’à 20 entrées et la gestion de leurs photos.

Ce que je veux te dire
Conservez un message privé de 300 caractères maximum, modifiez-le, effacez-le ou créez une carte à partager. L’enregistrer ne l’envoie pas à l’autre personne.

Ce dont je me souviens de toi
Ajoutez, modifiez, supprimez, recherchez et mettez en favori jusqu’à 50 cartes de 100 caractères chacune.`,
    'settings.guide.clear.title': 'Clarté',
    'settings.guide.clear.body': `Progression commune
Choisir une réponse ne passe pas automatiquement à la suivante : vérifiez puis touchez « Suivant ». Terminer un outil et l’enregistrer comme étoile sont deux actions distinctes.

Trier mes émotions
Séparez faits, interprétations et inconnues, puis examinez émotions, besoins et prochaine étape avant de terminer.

Guide de l’emballement
Répondez par sections, consultez l’aperçu final et terminez explicitement. Vous choisissez ensuite si vous souhaitez enregistrer une étoile.

Bilan des schémas affectifs
Il comporte 25 questions. Après chaque choix, touchez « Suivant ». Après la 25e, touchez « Voir le résultat », puis « Terminer ce bilan » sur le résultat. Pour le conserver, touchez séparément « Enregistrer comme étoile de clarté ».

Attirance ou habitude ?
Répondez aux quatre sections, consultez l’aperçu puis confirmez la fin. L’enregistrement en étoile reste facultatif.

Recommencer
Efface uniquement le brouillon actif non terminé. L’historique terminé et les étoiles enregistrées restent intacts.`,
    'settings.guide.data.title': 'Données et réglages',
    'settings.guide.data.body': `Langue
Choisissez le chinois traditionnel, l’anglais, le japonais, le coréen, l’espagnol ou le français.

Exporter les données texte
Crée un fichier .txt lisible, sans photos, qui ne peut pas être réimporté.

Exporter et importer les données de l’app
L’export crée un JSON réimportable sans photos. L’import fusionne sans tout remplacer, conserve la version la plus récente d’une même entrée et n’efface pas les photos présentes.

Effacer les données de la relation actuelle
Cette action irréversible demande deux confirmations : exportez d’abord les données. Elle efface l’histoire et les copies photo de l’app, puis revient à la configuration initiale, tout en conservant les originaux du téléphone et les réglages comme la langue.`,
  },
}
