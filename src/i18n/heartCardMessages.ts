import type { Locale } from './messages'

const baseHeartCardMessages = {
  'zh-TW': {
    'heartCard.hint': '可將完整內容製作成星光小卡，最多 300 字。', 'heartCard.tooLong': '星光小卡最多可使用 300 字。',
    'heartCard.limitExceeded': '這則內容超過星光小卡 300 字上限。原內容仍會完整保留；若要製作星光小卡，請先將內容縮短至 300 字以內。', 'heartCard.layoutOverflow': '這段文字的排版超出星光小卡可顯示範圍，請減少換行或稍微縮短內容後再試一次。',
    'heartCard.chooseBackground': '選擇背景', 'heartCard.background.original-night': '原版星夜', 'heartCard.background.sunny-garden': '晴日花園', 'heartCard.background.blue-beach': '藍天海灘', 'heartCard.background.romantic-sunset': '浪漫夕陽', 'heartCard.background.winter-night': '冬夜星光', 'heartCard.background.sakura-moonlight': '櫻花月夜', 'heartCard.background.myPhoto': '我的照片', 'heartCard.choosePhoto': '選擇照片', 'heartCard.changePhoto': '更換照片', 'heartCard.photoLoadError': '照片載入失敗，請再試一次。',
    'heartCard.expand': '展開', 'heartCard.collapse': '收合', 'heartCard.write': '寫一句話', 'heartCard.create': '製作心意卡', 'heartCard.textLabel': '心意卡文字', 'heartCard.preview': '預覽心意卡', 'heartCard.backToEdit': '返回修改', 'heartCard.shareImage': '分享圖片', 'heartCard.saveImage': '儲存心意卡', 'heartCard.ready': '已準備好你的心意卡。', 'heartCard.readyChip': '心意卡已準備好', 'heartCard.generateError': '圖片產生失敗，請再試一次。', 'heartCard.shareUnsupported': '此裝置不支援直接分享圖片，已準備好可儲存的心意卡。', 'heartCard.shareError': '圖片分享失敗，請再試一次。', 'heartCard.previewLabel': '星星心意卡預覽', 'heartCard.count': '{current} / {max}', 'heartCard.emptyRequired': '請先寫下心意卡文字。', 'heartCard.brand': '星星戀愛日記', 'heartCard.tagline': '和你一起，收集更多閃閃發光的日子', 'heartCard.backLine': '記錄戀愛的心情，也記得更喜歡自己。',
  },
  en: {
    'heartCard.hint': 'Turn your full message into a starlight card, up to 300 characters.', 'heartCard.tooLong': 'A starlight card can use up to 300 characters.',
    'heartCard.limitExceeded': 'This message exceeds the 300-character limit for a starlight card. Your original message is still fully kept; shorten it to 300 characters or fewer to create a card.', 'heartCard.layoutOverflow': 'This message cannot fit safely on the starlight card. Try using fewer line breaks or shortening it slightly.',
    'heartCard.chooseBackground': 'Choose a background', 'heartCard.background.original-night': 'Original starry night', 'heartCard.background.sunny-garden': 'Sunny garden', 'heartCard.background.blue-beach': 'Blue beach', 'heartCard.background.romantic-sunset': 'Romantic sunset', 'heartCard.background.winter-night': 'Winter starlight', 'heartCard.background.sakura-moonlight': 'Sakura moonlight', 'heartCard.background.myPhoto': 'My photo', 'heartCard.choosePhoto': 'Choose photo', 'heartCard.changePhoto': 'Change photo', 'heartCard.photoLoadError': 'Could not load the photo. Please try again.',
    'heartCard.expand': 'Expand', 'heartCard.collapse': 'Collapse', 'heartCard.write': 'Write a note', 'heartCard.create': 'Create a heart card', 'heartCard.textLabel': 'Heart card message', 'heartCard.preview': 'Preview heart card', 'heartCard.backToEdit': 'Back to edit', 'heartCard.shareImage': 'Share image', 'heartCard.saveImage': 'Save heart card', 'heartCard.ready': 'Your heart card is ready.', 'heartCard.readyChip': 'Heart card ready', 'heartCard.generateError': 'Could not create the image. Please try again.', 'heartCard.shareUnsupported': 'This device cannot share images directly. Your heart card is ready to save.', 'heartCard.shareError': 'Could not share the image. Please try again.', 'heartCard.previewLabel': 'Starlove heart card preview', 'heartCard.count': '{current} / {max}', 'heartCard.emptyRequired': 'Write a heart card message first.', 'heartCard.brand': 'Starlove Diary', 'heartCard.tagline': 'Collect more sparkling days together', 'heartCard.backLine': 'Record the feelings of affection, and remember to like yourself more, too.',
  },
  ja: {
    'heartCard.hint': '伝えたい内容を星明かりのカードにできます。最大300文字です。', 'heartCard.tooLong': '星明かりのカードは300文字までです。',
    'heartCard.limitExceeded': 'この内容は星明かりカードの300文字上限を超えています。元の内容はそのまま保持されます。カードを作るには300文字以内に短くしてください。', 'heartCard.layoutOverflow': 'この文章は星明かりカードの表示範囲に収まりません。改行を減らすか、少し短くしてからもう一度お試しください。',
    'heartCard.chooseBackground': '背景を選ぶ', 'heartCard.background.original-night': '星空の夜', 'heartCard.background.sunny-garden': '晴れの庭', 'heartCard.background.blue-beach': '青い海辺', 'heartCard.background.romantic-sunset': 'ロマンチックな夕日', 'heartCard.background.winter-night': '冬の星明かり', 'heartCard.background.sakura-moonlight': '桜と月夜', 'heartCard.background.myPhoto': 'マイ写真', 'heartCard.choosePhoto': '写真を選ぶ', 'heartCard.changePhoto': '写真を変更', 'heartCard.photoLoadError': '写真を読み込めませんでした。もう一度お試しください。',
    'heartCard.expand': '開く', 'heartCard.collapse': '閉じる', 'heartCard.write': 'ひとこと書く', 'heartCard.create': '気持ちのカードをつくる', 'heartCard.textLabel': 'カードのメッセージ', 'heartCard.preview': 'カードをプレビュー', 'heartCard.backToEdit': '編集に戻る', 'heartCard.shareImage': '画像を共有', 'heartCard.saveImage': 'カードを保存', 'heartCard.ready': '気持ちのカードができました。', 'heartCard.readyChip': 'カードの準備ができました', 'heartCard.generateError': '画像を作成できませんでした。もう一度お試しください。', 'heartCard.shareUnsupported': 'この端末では画像を直接共有できません。カードを保存できます。', 'heartCard.shareError': '画像を共有できませんでした。もう一度お試しください。', 'heartCard.previewLabel': '星の気持ちカードのプレビュー', 'heartCard.count': '{current} / {max}', 'heartCard.emptyRequired': 'カードのメッセージを書いてください。', 'heartCard.brand': '星の恋愛日記', 'heartCard.tagline': '一緒に、きらめく日々を集めよう', 'heartCard.backLine': '恋する気持ちを記録しながら、自分をもっと好きになることも忘れない。',
  },
  ko: {
    'heartCard.hint': '전체 메시지를 별빛 카드로 만들 수 있어요. 최대 300자예요.', 'heartCard.tooLong': '별빛 카드는 최대 300자까지 가능해요.',
    'heartCard.limitExceeded': '이 내용은 별빛 카드의 300자 한도를 넘어요. 원문은 그대로 보관되며, 카드를 만들려면 300자 이내로 줄여 주세요.', 'heartCard.layoutOverflow': '이 문장은 별빛 카드의 표시 영역에 안전하게 들어가지 않아요. 줄바꿈을 줄이거나 조금 짧게 해 주세요.',
    'heartCard.chooseBackground': '배경 선택', 'heartCard.background.original-night': '원래 별밤', 'heartCard.background.sunny-garden': '맑은 정원', 'heartCard.background.blue-beach': '푸른 해변', 'heartCard.background.romantic-sunset': '낭만적인 노을', 'heartCard.background.winter-night': '겨울 별빛', 'heartCard.background.sakura-moonlight': '벚꽃 달빛', 'heartCard.background.myPhoto': '내 사진', 'heartCard.choosePhoto': '사진 선택', 'heartCard.changePhoto': '사진 변경', 'heartCard.photoLoadError': '사진을 불러오지 못했어요. 다시 시도해 주세요.',
    'heartCard.expand': '펼치기', 'heartCard.collapse': '접기', 'heartCard.write': '한마디 쓰기', 'heartCard.create': '마음 카드 만들기', 'heartCard.textLabel': '마음 카드 문구', 'heartCard.preview': '마음 카드 미리 보기', 'heartCard.backToEdit': '수정으로 돌아가기', 'heartCard.shareImage': '이미지 공유', 'heartCard.saveImage': '마음 카드 저장', 'heartCard.ready': '마음 카드가 준비되었어요.', 'heartCard.readyChip': '마음 카드 준비 완료', 'heartCard.generateError': '이미지를 만들지 못했어요. 다시 시도해 주세요.', 'heartCard.shareUnsupported': '이 기기에서는 이미지를 바로 공유할 수 없어요. 카드를 저장할 수 있어요.', 'heartCard.shareError': '이미지를 공유하지 못했어요. 다시 시도해 주세요.', 'heartCard.previewLabel': '별빛 마음 카드 미리 보기', 'heartCard.count': '{current} / {max}', 'heartCard.emptyRequired': '먼저 카드 문구를 적어 주세요.', 'heartCard.brand': '별빛 연애일기', 'heartCard.tagline': '함께 더 반짝이는 날들을 모아요', 'heartCard.backLine': '설레는 마음을 기록하고, 나를 더 좋아하는 일도 기억해요.',
  },
  es: {
    'heartCard.hint': 'Convierte tu mensaje completo en una tarjeta de luz estelar, hasta 300 caracteres.', 'heartCard.tooLong': 'La tarjeta admite hasta 300 caracteres.',
    'heartCard.limitExceeded': 'Este mensaje supera el límite de 300 caracteres de la tarjeta. El original se conservará completo; acórtalo a 300 caracteres o menos para crearla.', 'heartCard.layoutOverflow': 'Este mensaje no cabe con seguridad en la tarjeta. Prueba con menos saltos de línea o acórtalo un poco.',
    'heartCard.chooseBackground': 'Elegir fondo', 'heartCard.background.original-night': 'Noche estrellada original', 'heartCard.background.sunny-garden': 'Jardín soleado', 'heartCard.background.blue-beach': 'Playa azul', 'heartCard.background.romantic-sunset': 'Atardecer romántico', 'heartCard.background.winter-night': 'Luz estelar de invierno', 'heartCard.background.sakura-moonlight': 'Luz lunar de cerezos', 'heartCard.background.myPhoto': 'Mi foto', 'heartCard.choosePhoto': 'Elegir foto', 'heartCard.changePhoto': 'Cambiar foto', 'heartCard.photoLoadError': 'No se pudo cargar la foto. Inténtalo de nuevo.',
    'heartCard.expand': 'Desplegar', 'heartCard.collapse': 'Contraer', 'heartCard.write': 'Escribir una frase', 'heartCard.create': 'Crear una tarjeta', 'heartCard.textLabel': 'Mensaje de la tarjeta', 'heartCard.preview': 'Vista previa de la tarjeta', 'heartCard.backToEdit': 'Volver a editar', 'heartCard.shareImage': 'Compartir imagen', 'heartCard.saveImage': 'Guardar tarjeta', 'heartCard.ready': 'Tu tarjeta está lista.', 'heartCard.readyChip': 'Tarjeta lista', 'heartCard.generateError': 'No se pudo crear la imagen. Inténtalo de nuevo.', 'heartCard.shareUnsupported': 'Este dispositivo no permite compartir imágenes directamente. Puedes guardar tu tarjeta.', 'heartCard.shareError': 'No se pudo compartir la imagen. Inténtalo de nuevo.', 'heartCard.previewLabel': 'Vista previa de tarjeta Starlove', 'heartCard.count': '{current} / {max}', 'heartCard.emptyRequired': 'Escribe primero el mensaje de la tarjeta.', 'heartCard.brand': 'Starlove Diary', 'heartCard.tagline': 'Juntemos más días que brillen', 'heartCard.backLine': 'Registra lo que sientes y recuerda quererte un poco más.',
  },
  fr: {
    'heartCard.hint': 'Transformez votre message complet en carte étoilée, jusqu’à 300 caractères.', 'heartCard.tooLong': 'La carte accepte jusqu’à 300 caractères.',
    'heartCard.limitExceeded': 'Ce message dépasse la limite de 300 caractères de la carte. Le texte original est conservé intégralement ; raccourcissez-le à 300 caractères ou moins pour créer la carte.', 'heartCard.layoutOverflow': 'Ce message ne tient pas correctement sur la carte. Réduisez les retours à la ligne ou raccourcissez-le légèrement.',
    'heartCard.chooseBackground': 'Choisir un fond', 'heartCard.background.original-night': 'Nuit étoilée originale', 'heartCard.background.sunny-garden': 'Jardin ensoleillé', 'heartCard.background.blue-beach': 'Plage bleue', 'heartCard.background.romantic-sunset': 'Coucher de soleil romantique', 'heartCard.background.winter-night': 'Lueur hivernale', 'heartCard.background.sakura-moonlight': 'Clair de lune aux cerisiers', 'heartCard.background.myPhoto': 'Ma photo', 'heartCard.choosePhoto': 'Choisir une photo', 'heartCard.changePhoto': 'Changer la photo', 'heartCard.photoLoadError': 'Impossible de charger la photo. Réessayez.',
    'heartCard.expand': 'Développer', 'heartCard.collapse': 'Réduire', 'heartCard.write': 'Écrire un mot', 'heartCard.create': 'Créer une carte', 'heartCard.textLabel': 'Message de la carte', 'heartCard.preview': 'Aperçu de la carte', 'heartCard.backToEdit': 'Revenir à la modification', 'heartCard.shareImage': 'Partager l’image', 'heartCard.saveImage': 'Enregistrer la carte', 'heartCard.ready': 'Votre carte est prête.', 'heartCard.readyChip': 'Carte prête', 'heartCard.generateError': 'Impossible de créer l’image. Réessayez.', 'heartCard.shareUnsupported': 'Cet appareil ne peut pas partager les images directement. Votre carte peut être enregistrée.', 'heartCard.shareError': 'Impossible de partager l’image. Réessayez.', 'heartCard.previewLabel': 'Aperçu de la carte Starlove', 'heartCard.count': '{current} / {max}', 'heartCard.emptyRequired': 'Écrivez d’abord le message de la carte.', 'heartCard.brand': 'Starlove Diary', 'heartCard.tagline': 'Recueillons ensemble plus de jours scintillants', 'heartCard.backLine': 'Notez vos élans et souvenez-vous de vous apprécier davantage.',
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
