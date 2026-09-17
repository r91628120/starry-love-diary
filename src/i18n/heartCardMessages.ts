import type { Locale } from './messages'

const baseHeartCardMessages = {
  'zh-TW': {
    'heartCard.expand': '展開', 'heartCard.collapse': '收合', 'heartCard.write': '寫一句話', 'heartCard.create': '製作心意卡', 'heartCard.textLabel': '心意卡文字', 'heartCard.hint': '心意卡適合短短一句話，請控制在 60 字內。', 'heartCard.preview': '預覽心意卡', 'heartCard.backToEdit': '返回修改', 'heartCard.shareImage': '分享圖片', 'heartCard.saveImage': '儲存心意卡', 'heartCard.ready': '已準備好你的心意卡。', 'heartCard.readyChip': '心意卡已準備好', 'heartCard.generateError': '圖片產生失敗，請再試一次。', 'heartCard.shareUnsupported': '此裝置不支援直接分享圖片，已準備好可儲存的心意卡。', 'heartCard.shareError': '圖片分享失敗，請再試一次。', 'heartCard.previewLabel': '星星心意卡預覽', 'heartCard.count': '{current} / {max}', 'heartCard.emptyRequired': '請先寫下心意卡文字。', 'heartCard.tooLong': '心意卡適合短短一句話，請控制在 60 字內。', 'heartCard.brand': '星星戀愛日記', 'heartCard.tagline': '和你一起，收集更多閃閃發光的日子', 'heartCard.backLine': '記錄戀愛的心情，也記得更喜歡自己。',
  },
  en: {
    'heartCard.expand': 'Expand', 'heartCard.collapse': 'Collapse', 'heartCard.write': 'Write a note', 'heartCard.create': 'Create a heart card', 'heartCard.textLabel': 'Heart card message', 'heartCard.hint': 'A heart card works best with a short note. Keep it within 60 characters.', 'heartCard.preview': 'Preview heart card', 'heartCard.backToEdit': 'Back to edit', 'heartCard.shareImage': 'Share image', 'heartCard.saveImage': 'Save heart card', 'heartCard.ready': 'Your heart card is ready.', 'heartCard.readyChip': 'Heart card ready', 'heartCard.generateError': 'Could not create the image. Please try again.', 'heartCard.shareUnsupported': 'This device cannot share images directly. Your heart card is ready to save.', 'heartCard.shareError': 'Could not share the image. Please try again.', 'heartCard.previewLabel': 'Starlove heart card preview', 'heartCard.count': '{current} / {max}', 'heartCard.emptyRequired': 'Write a heart card message first.', 'heartCard.tooLong': 'A heart card works best with a short note. Keep it within 60 characters.', 'heartCard.brand': 'Starlove Diary', 'heartCard.tagline': 'Collect more sparkling days together', 'heartCard.backLine': 'Record the feelings of affection, and remember to like yourself more, too.',
  },
  ja: {
    'heartCard.expand': '開く', 'heartCard.collapse': '閉じる', 'heartCard.write': 'ひとこと書く', 'heartCard.create': '気持ちのカードをつくる', 'heartCard.textLabel': 'カードのメッセージ', 'heartCard.hint': 'カードには短いひとことがよく合います。60文字以内にしてください。', 'heartCard.preview': 'カードをプレビュー', 'heartCard.backToEdit': '編集に戻る', 'heartCard.shareImage': '画像を共有', 'heartCard.saveImage': 'カードを保存', 'heartCard.ready': '気持ちのカードができました。', 'heartCard.readyChip': 'カードの準備ができました', 'heartCard.generateError': '画像を作成できませんでした。もう一度お試しください。', 'heartCard.shareUnsupported': 'この端末では画像を直接共有できません。カードを保存できます。', 'heartCard.shareError': '画像を共有できませんでした。もう一度お試しください。', 'heartCard.previewLabel': '星の気持ちカードのプレビュー', 'heartCard.count': '{current} / {max}', 'heartCard.emptyRequired': 'カードのメッセージを書いてください。', 'heartCard.tooLong': 'カードには短いひとことがよく合います。60文字以内にしてください。', 'heartCard.brand': '星の恋愛日記', 'heartCard.tagline': '一緒に、きらめく日々を集めよう', 'heartCard.backLine': '恋する気持ちを記録しながら、自分をもっと好きになることも忘れない。',
  },
  ko: {
    'heartCard.expand': '펼치기', 'heartCard.collapse': '접기', 'heartCard.write': '한마디 쓰기', 'heartCard.create': '마음 카드 만들기', 'heartCard.textLabel': '마음 카드 문구', 'heartCard.hint': '마음 카드에는 짧은 한마디가 잘 어울려요. 60자 이내로 적어 주세요.', 'heartCard.preview': '마음 카드 미리 보기', 'heartCard.backToEdit': '수정으로 돌아가기', 'heartCard.shareImage': '이미지 공유', 'heartCard.saveImage': '마음 카드 저장', 'heartCard.ready': '마음 카드가 준비되었어요.', 'heartCard.readyChip': '마음 카드 준비 완료', 'heartCard.generateError': '이미지를 만들지 못했어요. 다시 시도해 주세요.', 'heartCard.shareUnsupported': '이 기기에서는 이미지를 바로 공유할 수 없어요. 카드를 저장할 수 있어요.', 'heartCard.shareError': '이미지를 공유하지 못했어요. 다시 시도해 주세요.', 'heartCard.previewLabel': '별빛 마음 카드 미리 보기', 'heartCard.count': '{current} / {max}', 'heartCard.emptyRequired': '먼저 카드 문구를 적어 주세요.', 'heartCard.tooLong': '마음 카드에는 짧은 한마디가 잘 어울려요. 60자 이내로 적어 주세요.', 'heartCard.brand': '별빛 연애일기', 'heartCard.tagline': '함께 더 반짝이는 날들을 모아요', 'heartCard.backLine': '설레는 마음을 기록하고, 나를 더 좋아하는 일도 기억해요.',
  },
  es: {
    'heartCard.expand': 'Desplegar', 'heartCard.collapse': 'Contraer', 'heartCard.write': 'Escribir una frase', 'heartCard.create': 'Crear una tarjeta', 'heartCard.textLabel': 'Mensaje de la tarjeta', 'heartCard.hint': 'Una tarjeta se luce con una frase breve. Procura no superar 60 caracteres.', 'heartCard.preview': 'Vista previa de la tarjeta', 'heartCard.backToEdit': 'Volver a editar', 'heartCard.shareImage': 'Compartir imagen', 'heartCard.saveImage': 'Guardar tarjeta', 'heartCard.ready': 'Tu tarjeta está lista.', 'heartCard.readyChip': 'Tarjeta lista', 'heartCard.generateError': 'No se pudo crear la imagen. Inténtalo de nuevo.', 'heartCard.shareUnsupported': 'Este dispositivo no permite compartir imágenes directamente. Puedes guardar tu tarjeta.', 'heartCard.shareError': 'No se pudo compartir la imagen. Inténtalo de nuevo.', 'heartCard.previewLabel': 'Vista previa de tarjeta Starlove', 'heartCard.count': '{current} / {max}', 'heartCard.emptyRequired': 'Escribe primero el mensaje de la tarjeta.', 'heartCard.tooLong': 'Una tarjeta se luce con una frase breve. Procura no superar 60 caracteres.', 'heartCard.brand': 'Starlove Diary', 'heartCard.tagline': 'Juntemos más días que brillen', 'heartCard.backLine': 'Registra lo que sientes y recuerda quererte un poco más.',
  },
  fr: {
    'heartCard.expand': 'Développer', 'heartCard.collapse': 'Réduire', 'heartCard.write': 'Écrire un mot', 'heartCard.create': 'Créer une carte', 'heartCard.textLabel': 'Message de la carte', 'heartCard.hint': 'Une carte se prête à un petit mot. Gardez-le sous 60 caractères.', 'heartCard.preview': 'Aperçu de la carte', 'heartCard.backToEdit': 'Revenir à la modification', 'heartCard.shareImage': 'Partager l’image', 'heartCard.saveImage': 'Enregistrer la carte', 'heartCard.ready': 'Votre carte est prête.', 'heartCard.readyChip': 'Carte prête', 'heartCard.generateError': 'Impossible de créer l’image. Réessayez.', 'heartCard.shareUnsupported': 'Cet appareil ne peut pas partager les images directement. Votre carte peut être enregistrée.', 'heartCard.shareError': 'Impossible de partager l’image. Réessayez.', 'heartCard.previewLabel': 'Aperçu de la carte Starlove', 'heartCard.count': '{current} / {max}', 'heartCard.emptyRequired': 'Écrivez d’abord le message de la carte.', 'heartCard.tooLong': 'Une carte se prête à un petit mot. Gardez-le sous 60 caractères.', 'heartCard.brand': 'Starlove Diary', 'heartCard.tagline': 'Recueillons ensemble plus de jours scintillants', 'heartCard.backLine': 'Notez vos élans et souvenez-vous de vous apprécier davantage.',
  },
} as const satisfies Record<Locale, Record<string, string>>

const heartCardSaveMessages = {
  'zh-TW': {
    'heartCard.saveDownloaded': '已開始下載心意卡。',
    'heartCard.saveSheetOpened': '已開啟系統分享面板，請選擇「儲存影像」。',
    'heartCard.saveCancelled': '已取消儲存心意卡。',
    'heartCard.saveUnsupported': '此裝置無法開啟儲存圖片的系統面板，請改用分享圖片。',
    'heartCard.saveError': '無法儲存心意卡，請再試一次。',
    'heartCard.savePending': '系統儲存面板尚未完成，請確認後再試一次。',
  },
  en: {
    'heartCard.saveDownloaded': 'Your heart card download has started.',
    'heartCard.saveSheetOpened': 'The system share sheet is open. Choose “Save Image”.',
    'heartCard.saveCancelled': 'Saving the heart card was cancelled.',
    'heartCard.saveUnsupported': 'This device cannot open a sheet for saving images. Use Share image instead.',
    'heartCard.saveError': 'Could not save the heart card. Please try again.',
    'heartCard.savePending': 'The system save sheet has not finished. Confirm it, then try again.',
  },
  ja: {
    'heartCard.saveDownloaded': 'カードのダウンロードを開始しました。',
    'heartCard.saveSheetOpened': 'システム共有シートを開きました。「画像を保存」を選択してください。',
    'heartCard.saveCancelled': 'カードの保存をキャンセルしました。',
    'heartCard.saveUnsupported': 'この端末では画像保存用のシステムシートを開けません。画像を共有してください。',
    'heartCard.saveError': 'カードを保存できませんでした。もう一度お試しください。',
    'heartCard.savePending': 'システムの保存シートが完了していません。確認してからもう一度お試しください。',
  },
  ko: {
    'heartCard.saveDownloaded': '마음 카드 다운로드를 시작했어요.',
    'heartCard.saveSheetOpened': '시스템 공유 시트를 열었어요. “이미지 저장”을 선택해 주세요.',
    'heartCard.saveCancelled': '마음 카드 저장을 취소했어요.',
    'heartCard.saveUnsupported': '이 기기에서는 이미지 저장용 시스템 시트를 열 수 없어요. 이미지 공유를 사용해 주세요.',
    'heartCard.saveError': '마음 카드를 저장하지 못했어요. 다시 시도해 주세요.',
    'heartCard.savePending': '시스템 저장 시트가 아직 완료되지 않았어요. 확인한 뒤 다시 시도해 주세요.',
  },
  es: {
    'heartCard.saveDownloaded': 'La descarga de tu tarjeta ha comenzado.',
    'heartCard.saveSheetOpened': 'Se abrió la hoja para compartir del sistema. Elige «Guardar imagen».',
    'heartCard.saveCancelled': 'Se canceló el guardado de la tarjeta.',
    'heartCard.saveUnsupported': 'Este dispositivo no puede abrir una hoja para guardar imágenes. Usa Compartir imagen.',
    'heartCard.saveError': 'No se pudo guardar la tarjeta. Inténtalo de nuevo.',
    'heartCard.savePending': 'La hoja para guardar del sistema no ha terminado. Confírmala y vuelve a intentarlo.',
  },
  fr: {
    'heartCard.saveDownloaded': 'Le téléchargement de votre carte a commencé.',
    'heartCard.saveSheetOpened': 'La feuille de partage système est ouverte. Choisissez « Enregistrer l’image ».',
    'heartCard.saveCancelled': 'L’enregistrement de la carte a été annulé.',
    'heartCard.saveUnsupported': 'Cet appareil ne peut pas ouvrir de feuille pour enregistrer une image. Utilisez Partager l’image.',
    'heartCard.saveError': 'Impossible d’enregistrer la carte. Réessayez.',
    'heartCard.savePending': 'La feuille d’enregistrement système n’est pas terminée. Confirmez-la, puis réessayez.',
  },
} as const satisfies Record<Locale, Record<string, string>>

export const heartCardMessages = {
  'zh-TW': { ...baseHeartCardMessages['zh-TW'], ...heartCardSaveMessages['zh-TW'] },
  en: { ...baseHeartCardMessages.en, ...heartCardSaveMessages.en },
  ja: { ...baseHeartCardMessages.ja, ...heartCardSaveMessages.ja },
  ko: { ...baseHeartCardMessages.ko, ...heartCardSaveMessages.ko },
  es: { ...baseHeartCardMessages.es, ...heartCardSaveMessages.es },
  fr: { ...baseHeartCardMessages.fr, ...heartCardSaveMessages.fr },
} as const satisfies Record<Locale, Record<string, string>>
