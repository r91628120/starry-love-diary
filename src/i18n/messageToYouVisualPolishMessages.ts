import type { Locale } from './messages'

export const messageToYouVisualPolishMessages = {
  'zh-TW': {
    'messageV1.prompt': '今天，有什麼想對他／她說？',
    'messageV1.entryCount': '{count} 則',
    'heartCard.previewLabel': 'Starry Love Diary 星光小卡預覽',
    'heartCard.brand': 'Starry Love Diary',
  },
  en: {
    'messageV1.prompt': 'What would you like to say today?',
    'messageV1.entryCount': '{count} entries',
    'heartCard.previewLabel': 'Starry Love Diary heart card preview',
    'heartCard.brand': 'Starry Love Diary',
  },
  ja: {
    'messageV1.prompt': '今日は、何を伝えたい？',
    'messageV1.entryCount': '{count}件',
    'heartCard.previewLabel': 'Starry Love Diary の星明かりカードのプレビュー',
    'heartCard.brand': 'Starry Love Diary',
  },
  ko: {
    'messageV1.prompt': '오늘은 어떤 말을 전하고 싶나요?',
    'messageV1.entryCount': '{count}개',
    'heartCard.previewLabel': 'Starry Love Diary 별빛 카드 미리 보기',
    'heartCard.brand': 'Starry Love Diary',
  },
  es: {
    'messageV1.prompt': '¿Qué quieres decir hoy?',
    'messageV1.entryCount': '{count} mensajes',
    'heartCard.previewLabel': 'Vista previa de tarjeta de Starry Love Diary',
    'heartCard.brand': 'Starry Love Diary',
  },
  fr: {
    'messageV1.prompt': 'Qu’aimeriez-vous dire aujourd’hui ?',
    'messageV1.entryCount': '{count} messages',
    'heartCard.previewLabel': 'Aperçu de la carte Starry Love Diary',
    'heartCard.brand': 'Starry Love Diary',
  },
} as const satisfies Record<Locale, Record<string, string>>
