import type { Locale } from './messages'

const keys = ['sessionTitle', 'sessionHeroCopy', 'sessionAcceptedTitle', 'sessionAcceptedBody', 'sessionBeforeStartTitle', 'sessionBeforeStartBody', 'sessionDuringTitle', 'sessionDuringBody', 'sessionTopic', 'sessionSchedule', 'sessionDate', 'sessionTime', 'sessionCancel', 'sessionCancelDialogTitle', 'sessionCancelDialogBody', 'sessionCancelKeep', 'sessionCancelConfirm', 'sessionCancelledTitle', 'sessionCancelledBody', 'sessionCompletedTitle', 'sessionCompletedBody', 'sessionExternalConversation', 'sessionViewHistory'] as const
type SessionKey = typeof keys[number]

const values: Record<Locale, readonly string[]> = {
  'zh-TW': ['💕 已約好的心話', '為彼此留下一段時間，\n好好聊聊這個問題。✨', '✨ 心話時段已約好', '到了約好的時間，就找個舒服的地方，好好聊聊這個問題。', '還沒到約好的時間', '不用急，等時間到了，再一起聊聊。', '現在是你們約好的心話時間', '找一個舒服的方式，好好聊聊就好。', '這次想聊的題目', '已約好的時間', '日期', '時間', '取消這次心話', '取消這次心話？', '取消後，這次邀約不會算入心話次數，也不會留下完成紀錄。', '先不要', '確認取消', '這次心話已取消', '這次不會計入心話次數，也不會留下完成紀錄。', '✨ 這次心話已完成', '謝謝你們為彼此留下一段好好說話的時間。', '查看心話歷史（介面預覽）'],
  en: ['💕 Your Heart Talk', 'Set aside a little time for each other\nand talk through this prompt together. ✨', '✨ Your Heart Talk is scheduled', 'When the agreed time arrives, find a comfortable place and talk through this prompt together.', 'It is not time yet', 'No rush. You can talk together when the time arrives.', 'This is your scheduled Heart Talk time', 'Find a comfortable way to talk. That is enough.', 'Prompt for this conversation', 'Scheduled time', 'Date', 'Time', 'Cancel this Heart Talk', 'Cancel this Heart Talk?', 'After cancelling, this invitation will not count toward Heart Talk moments or create a completed record.', 'Not now', 'Confirm cancellation', 'This Heart Talk was cancelled', 'This will not count toward Heart Talk moments or create a completed record.', '✨ This Heart Talk is complete', 'Thank you for setting aside time to speak with each other.', 'View Heart Talk history (UI preview)'],
  ja: ['💕 約束した心話', 'お互いのために少し時間をとって、\nこのテーマをゆっくり話してみましょう。✨', '✨ 心話の時間を約束しました', '約束の時間になったら、心地よい場所でこのテーマをゆっくり話してみましょう。', 'まだ約束の時間ではありません', '急がなくて大丈夫。時間になったら一緒に話しましょう。', '今は約束した心話の時間です', '心地よい方法で、ゆっくり話すだけで大丈夫です。', '今回話したいテーマ', '約束した時間', '日付', '時間', 'この心話をキャンセル', 'この心話をキャンセルしますか？', 'キャンセルすると、この招待は心話の回数に含まれず、完了記録も残りません。', '今はやめない', 'キャンセルを確認', 'この心話はキャンセルされました', 'これは心話の回数に含まれず、完了記録も残りません。', '✨ この心話は完了しました', 'お互いにゆっくり話す時間をつくってくれてありがとう。'],
  ko: ['💕 약속한 마음 대화', '서로를 위해 잠시 시간을 내어\n이 주제를 함께 이야기해요. ✨', '✨ 마음 대화 시간이 약속되었어요', '약속한 시간이 되면 편안한 곳에서 이 주제를 함께 이야기해요.', '아직 약속한 시간이 아니에요', '서두르지 않아도 돼요. 시간이 되면 함께 이야기해요.', '지금은 약속한 마음 대화 시간이에요', '편안한 방식으로 이야기하면 충분해요.', '이번에 이야기할 주제', '약속한 시간', '날짜', '시간', '이번 마음 대화 취소', '이번 마음 대화를 취소할까요?', '취소하면 이 초대는 마음 대화 횟수에 포함되지 않고 완료 기록도 남지 않아요.', '아직은 아니에요', '취소 확인', '이번 마음 대화가 취소되었어요', '이것은 마음 대화 횟수에 포함되지 않고 완료 기록도 남지 않아요.', '✨ 이번 마음 대화가 완료되었어요', '서로를 위해 잘 이야기할 시간을 남겨주어 고마워요.'],
  es: ['💕 Conversación acordada', 'Reserven un momento el uno para el otro\npara conversar sobre esta pregunta. ✨', '✨ La conversación ya está acordada', 'Cuando llegue la hora acordada, encuentren un lugar cómodo para hablar de esta pregunta.', 'Aún no es la hora acordada', 'No hay prisa. Pueden conversar cuando llegue el momento.', 'Ahora es su hora acordada de conversación', 'Encuentren una forma cómoda de conversar. Eso es suficiente.', 'Pregunta para esta conversación', 'Hora acordada', 'Fecha', 'Hora', 'Cancelar esta conversación', '¿Cancelar esta conversación?', 'Al cancelar, esta invitación no contará como una conversación ni creará un registro completado.', 'Ahora no', 'Confirmar cancelación', 'Esta conversación fue cancelada', 'Esto no contará como una conversación ni creará un registro completado.', '✨ Esta conversación ha terminado', 'Gracias por reservar un momento para hablar bien el uno con el otro.'],
  fr: ['💕 Votre conversation prévue', 'Gardez un moment l’un pour l’autre\npour parler ensemble de cette question. ✨', '✨ Votre conversation est prévue', 'Lorsque l’heure convenue arrivera, trouvez un endroit confortable pour parler de cette question.', 'Ce n’est pas encore l’heure prévue', 'Rien ne presse. Vous pourrez échanger quand le moment viendra.', 'C’est maintenant votre moment de conversation prévu', 'Trouvez une manière confortable d’échanger. C’est suffisant.', 'Sujet de cette conversation', 'Heure prévue', 'Date', 'Heure', 'Annuler cette conversation', 'Annuler cette conversation ?', 'Après annulation, cette invitation ne comptera pas comme une conversation et ne créera aucun historique terminé.', 'Pas maintenant', 'Confirmer l’annulation', 'Cette conversation a été annulée', 'Elle ne comptera pas comme une conversation et ne créera aucun historique terminé.', '✨ Cette conversation est terminée', 'Merci d’avoir gardé un moment pour bien vous parler.'],
}

const duringConversation: Record<Locale, string> = {
  'zh-TW': '現在可以用你們平常習慣的方式聯絡，或直接見面聊聊。',
  en: 'You can now connect in the way you normally do, or meet in person to talk.',
  ja: '今はいつもの方法で連絡するか、直接会って話してみましょう。',
  ko: '지금은 평소에 사용하는 방식으로 연락하거나 직접 만나 이야기해요.',
  es: 'Ahora pueden comunicarse como suelen hacerlo o hablar en persona.',
  fr: 'Vous pouvez maintenant vous joindre comme d’habitude ou vous parler en personne.',
}

const externalConversation: Record<Locale, string> = {
  'zh-TW': '這裡不會開啟通話或聊天室。\n到了約定時間，請用你們平常習慣的方式聯絡，例如 LINE、電話、FaceTime，或直接見面聊天。',
  en: 'This app will not open a call or chat room.\nWhen the time arrives, use the way you normally connect, or meet in person.',
  ja: 'このアプリでは通話やチャットルームは開きません。\n時間になったら、いつもの方法で連絡するか、直接会って話しましょう。',
  ko: '이 앱에서는 통화나 채팅방이 열리지 않아요.\n시간이 되면 평소에 사용하는 방법으로 연락하거나 직접 만나 이야기해요.',
  es: 'Esta aplicación no abrirá una llamada ni una sala de chat.\nCuando llegue la hora, usen la forma en que suelen comunicarse o hablen en persona.',
  fr: 'Cette application n’ouvrira ni appel ni salon de discussion.\nLorsque l’heure arrive, utilisez votre manière habituelle de vous joindre ou parlez-vous en personne.',
}

const historyReview: Record<Locale, string> = {
  'zh-TW': '查看心話歷史（介面預覽）',
  en: 'View Heart Talk history (UI preview)',
  ja: '心話の履歴を見る（UIプレビュー）',
  ko: '마음 대화 기록 보기 (UI 미리보기)',
  es: 'Ver historial de conversaciones (vista previa)',
  fr: 'Voir l’historique des conversations (aperçu)',
}

export const starrySkyPhase2dMessages: Record<Locale, Record<`our.starrySky.${SessionKey}`, string>> = Object.fromEntries((Object.keys(values) as Locale[]).map((locale) => [locale, Object.fromEntries(keys.map((key, index) => [`our.starrySky.${key}`, key === 'sessionDuringBody' ? duringConversation[locale] : key === 'sessionExternalConversation' ? externalConversation[locale] : key === 'sessionViewHistory' ? historyReview[locale] : values[locale][index] ?? values.en[index]]))])) as Record<Locale, Record<`our.starrySky.${SessionKey}`, string>>
