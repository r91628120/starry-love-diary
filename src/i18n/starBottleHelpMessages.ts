import type { Locale } from './messages'

type StarBottleHelpKey =
  | 'starBottle.help.title'
  | 'starBottle.help.intro'
  | 'starBottle.help.moodTitle'
  | 'starBottle.help.moodBody'
  | 'starBottle.help.clearTitle'
  | 'starBottle.help.clearBody'
  | 'starBottle.help.rangeTitle'
  | 'starBottle.help.rangeBody'
  | 'starBottle.starHeartHelp.title'
  | 'starBottle.starHeartHelp.intro'
  | 'starBottle.starHeartHelp.body'
  | 'starBottle.starHeartHelp.dailyOpen'
  | 'starBottle.starHeartHelp.mood'
  | 'starBottle.starHeartHelp.organize'
  | 'starBottle.starHeartHelp.diary'
  | 'starBottle.starHeartHelp.quote'
  | 'starBottle.starHeartHelp.footer'

export const starBottleHelpMessages = {
  'zh-TW': {
    'starBottle.help.title': '星星瓶記錄了什麼？',
    'starBottle.help.intro': '這裡收藏著你在《星星戀愛日記》留下的兩種星星。',
    'starBottle.help.moodTitle': '🌷 心情星星',
    'starBottle.help.moodBody': '每天第一次記錄心情，就會留下當天的一顆心情星星。同一天如果改變心情，會更新原來那顆星星，不會多增加一顆。當你記錄今天的心情時，看到飛進星星瓶裡的星星，就是這顆「心情星星」。',
    'starBottle.help.clearTitle': '✨ 清醒星星',
    'starBottle.help.clearBody': '完成一次清醒整理或測驗後，你可以自己選擇「存成清醒星星」，把這次看見自己的時刻留下來。清醒星星會直接收藏在星星瓶的紀錄裡，不會播放心情星星的入瓶動畫。',
    'starBottle.help.rangeTitle': '今天・本月・本年・全部',
    'starBottle.help.rangeBody': '可以看看不同時間裡，你曾經留下多少顆星星。',
    'starBottle.starHeartHelp.title': '💗 星心值是什麼？',
    'starBottle.starHeartHelp.intro': '星心值和星星數量不一樣。',
    'starBottle.starHeartHelp.body': '它記錄的是你在 App 裡留下生活與心情足跡時，慢慢累積的點數。',
    'starBottle.starHeartHelp.dailyOpen': '每日首次開啟 App',
    'starBottle.starHeartHelp.mood': '記錄當日心情',
    'starBottle.starHeartHelp.organize': '完成「開始整理心情」',
    'starBottle.starHeartHelp.diary': '建立一篇日記',
    'starBottle.starHeartHelp.quote': '分享每日語錄',
    'starBottle.starHeartHelp.footer': '星星收藏的是片刻；星心值記錄的是你在 App 裡留下的參與足跡。',
  },
  en: {
    'starBottle.help.title': 'What does the Star Bottle keep?',
    'starBottle.help.intro': 'It keeps the two kinds of stars you leave in Starry Love Diary.',
    'starBottle.help.moodTitle': '🌷 Mood stars',
    'starBottle.help.moodBody': 'Your first mood entry each day leaves one mood star. If your mood changes that day, the same star is updated instead of adding another. When you record today’s mood, the star you see flying into the Star Bottle is this mood star.',
    'starBottle.help.clearTitle': '✨ Clarity stars',
    'starBottle.help.clearBody': 'After a clarity reflection or check-in, you can choose “Save as a clarity star” to keep that moment of noticing yourself. Clarity stars are saved directly in the Star Bottle record and do not play the mood-star entry animation.',
    'starBottle.help.rangeTitle': 'Today · This month · This year · All',
    'starBottle.help.rangeBody': 'See how many stars you have left across different times.',
    'starBottle.starHeartHelp.title': '💗 What is the star-heart value?',
    'starBottle.starHeartHelp.intro': 'The star-heart value is different from your number of stars.',
    'starBottle.starHeartHelp.body': 'It is a running total of points from the life and mood moments you leave in the app.',
    'starBottle.starHeartHelp.dailyOpen': 'First app open of the day',
    'starBottle.starHeartHelp.mood': 'Record today’s mood',
    'starBottle.starHeartHelp.organize': 'Complete “Organize feelings”',
    'starBottle.starHeartHelp.diary': 'Create a diary entry',
    'starBottle.starHeartHelp.quote': 'Share the daily quote',
    'starBottle.starHeartHelp.footer': 'Stars keep moments; the star-heart value records your participation in the app.',
  },
  ja: {
    'starBottle.help.title': '星のびんには何が残る？',
    'starBottle.help.intro': '星星恋愛日記で残した、二種類の星をここに集めます。',
    'starBottle.help.moodTitle': '🌷 気持ちの星',
    'starBottle.help.moodBody': 'その日に初めて気持ちを記録すると、気持ちの星が一つ残ります。同じ日に気持ちが変わったら、新しい星を増やさず、元の星を更新します。今日の気持ちを記録したときに星のびんへ飛び込む星は、この気持ちの星です。',
    'starBottle.help.clearTitle': '✨ 気づきの星',
    'starBottle.help.clearBody': '気持ちを整理したりチェックしたあとに、「気づきの星として残す」を自分で選べます。自分に気づけた瞬間を残しておけます。気づきの星は星のびんの記録に直接残り、気持ちの星の入瓶アニメーションは再生されません。',
    'starBottle.help.rangeTitle': '今日・今月・今年・すべて',
    'starBottle.help.rangeBody': '時期ごとに、これまで残した星の数を見られます。',
    'starBottle.starHeartHelp.title': '💗 星ハート値って？',
    'starBottle.starHeartHelp.intro': '星ハート値は、星の数とは別のものです。',
    'starBottle.starHeartHelp.body': 'アプリに残した暮らしや気持ちの記録に応じて、少しずつたまるポイントです。',
    'starBottle.starHeartHelp.dailyOpen': 'その日の最初のアプリ起動',
    'starBottle.starHeartHelp.mood': '今日の気持ちを記録',
    'starBottle.starHeartHelp.organize': '「気持ちを整理する」を完了',
    'starBottle.starHeartHelp.diary': '日記を一つ作成',
    'starBottle.starHeartHelp.quote': '今日の恋愛星語を共有',
    'starBottle.starHeartHelp.footer': '星は瞬間を残し、星ハート値はアプリで残した足あとを記録します。',
  },
  ko: {
    'starBottle.help.title': '별병에는 무엇이 담기나요?',
    'starBottle.help.intro': '별사랑 일기에서 남긴 두 가지 별을 이곳에 모아 두어요.',
    'starBottle.help.moodTitle': '🌷 기분 별',
    'starBottle.help.moodBody': '하루에 처음 기분을 기록하면 기분 별 하나가 남아요. 같은 날 기분이 바뀌면 별을 더 만들지 않고, 원래 별을 업데이트해요. 오늘의 기분을 기록할 때 별병으로 날아 들어가는 별이 바로 이 기분 별이에요.',
    'starBottle.help.clearTitle': '✨ 마음 정리 별',
    'starBottle.help.clearBody': '마음 정리나 점검을 마친 뒤 “마음 정리 별로 저장”을 직접 선택할 수 있어요. 나를 알아차린 그 순간을 남겨 둘 수 있어요. 마음 정리 별은 별병 기록에 바로 저장되며, 기분 별이 들어가는 애니메이션은 재생되지 않아요.',
    'starBottle.help.rangeTitle': '오늘 · 이번 달 · 올해 · 전체',
    'starBottle.help.rangeBody': '시기별로 지금까지 남긴 별의 수를 볼 수 있어요.',
    'starBottle.starHeartHelp.title': '💗 별마음 값이란?',
    'starBottle.starHeartHelp.intro': '별마음 값은 별의 개수와 다른 값이에요.',
    'starBottle.starHeartHelp.body': '앱에 남긴 일상과 기분의 발자국에 따라 차곡차곡 쌓이는 점수예요.',
    'starBottle.starHeartHelp.dailyOpen': '하루 첫 앱 실행',
    'starBottle.starHeartHelp.mood': '오늘의 기분 기록',
    'starBottle.starHeartHelp.organize': '“마음 정리 시작하기” 완료',
    'starBottle.starHeartHelp.diary': '일기 한 편 만들기',
    'starBottle.starHeartHelp.quote': '오늘의 사랑 문구 공유',
    'starBottle.starHeartHelp.footer': '별은 순간을 담고, 별마음 값은 앱에 남긴 참여의 발자국을 기록해요.',
  },
  es: {
    'starBottle.help.title': '¿Qué guarda el frasco de estrellas?',
    'starBottle.help.intro': 'Aquí se guardan los dos tipos de estrellas que dejas en Starry Love Diary.',
    'starBottle.help.moodTitle': '🌷 Estrellas de ánimo',
    'starBottle.help.moodBody': 'La primera vez que registras tu ánimo cada día queda una estrella. Si tu ánimo cambia ese mismo día, se actualiza esa estrella sin añadir otra. Cuando registras tu ánimo de hoy, la estrella que ves entrar volando en el frasco es esa estrella de ánimo.',
    'starBottle.help.clearTitle': '✨ Estrellas de claridad',
    'starBottle.help.clearBody': 'Después de ordenar tus emociones o hacer una revisión, puedes elegir “Guardar como estrella de claridad” para conservar ese momento en que te miraste con más atención. Las estrellas de claridad se guardan directamente en el registro del frasco y no reproducen la animación de entrada de las estrellas de ánimo.',
    'starBottle.help.rangeTitle': 'Hoy · Este mes · Este año · Todo',
    'starBottle.help.rangeBody': 'Puedes ver cuántas estrellas has dejado en distintos momentos.',
    'starBottle.starHeartHelp.title': '💗 ¿Qué es el valor corazón estelar?',
    'starBottle.starHeartHelp.intro': 'El valor corazón estelar es distinto del número de estrellas.',
    'starBottle.starHeartHelp.body': 'Es la suma de puntos que se acumulan con las huellas de tu vida y tu ánimo dentro de la app.',
    'starBottle.starHeartHelp.dailyOpen': 'Primer inicio de la app del día',
    'starBottle.starHeartHelp.mood': 'Registrar el ánimo de hoy',
    'starBottle.starHeartHelp.organize': 'Completar “Ordenar mis emociones”',
    'starBottle.starHeartHelp.diary': 'Crear una entrada de diario',
    'starBottle.starHeartHelp.quote': 'Compartir la frase diaria',
    'starBottle.starHeartHelp.footer': 'Las estrellas guardan momentos; el valor corazón estelar registra tu participación en la app.',
  },
  fr: {
    'starBottle.help.title': 'Que garde le bocal à étoiles ?',
    'starBottle.help.intro': 'Il rassemble les deux types d’étoiles que vous laissez dans Journal d’amour étoilé.',
    'starBottle.help.moodTitle': '🌷 Étoiles d’humeur',
    'starBottle.help.moodBody': 'La première humeur notée chaque jour laisse une étoile. Si votre humeur change le même jour, cette étoile est mise à jour sans en ajouter une autre. Lorsque vous notez votre humeur du jour, l’étoile que vous voyez voler dans le bocal est cette étoile d’humeur.',
    'starBottle.help.clearTitle': '✨ Étoiles de clarté',
    'starBottle.help.clearBody': 'Après avoir fait le point ou une vérification, vous pouvez choisir « Enregistrer comme étoile de clarté » pour garder ce moment où vous vous êtes mieux écouté·e. Les étoiles de clarté sont enregistrées directement dans le bocal et ne déclenchent pas l’animation d’entrée des étoiles d’humeur.',
    'starBottle.help.rangeTitle': 'Aujourd’hui · Ce mois-ci · Cette année · Tout',
    'starBottle.help.rangeBody': 'Vous pouvez voir combien d’étoiles vous avez laissées à différentes périodes.',
    'starBottle.starHeartHelp.title': '💗 Qu’est-ce que la valeur cœur-étoile ?',
    'starBottle.starHeartHelp.intro': 'La valeur cœur-étoile est différente du nombre d’étoiles.',
    'starBottle.starHeartHelp.body': 'C’est le total de points qui s’accumulent avec les traces de vie et d’humeur laissées dans l’application.',
    'starBottle.starHeartHelp.dailyOpen': 'Première ouverture de l’app du jour',
    'starBottle.starHeartHelp.mood': 'Noter l’humeur du jour',
    'starBottle.starHeartHelp.organize': 'Terminer « Trier mes émotions »',
    'starBottle.starHeartHelp.diary': 'Créer une entrée de journal',
    'starBottle.starHeartHelp.quote': 'Partager la phrase du jour',
    'starBottle.starHeartHelp.footer': 'Les étoiles gardent des moments ; la valeur cœur-étoile enregistre votre participation dans l’application.',
  },
} as const satisfies Record<Locale, Record<StarBottleHelpKey, string>>
