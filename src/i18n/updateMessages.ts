import type { Locale } from './messages'

type UpdateMessageKey = 'update.title' | 'update.body' | 'update.later' | 'update.now'

export const updateMessages = {
  'zh-TW': {
    'update.title': '有新版本可以更新 ✨',
    'update.body': '星星戀愛日記有新的版本囉！更新後可以使用最新的改善與功能。',
    'update.later': '稍後再說',
    'update.now': '前往更新',
  },
  en: {
    'update.title': 'A new version is ready ✨',
    'update.body': 'Starry Love Diary has an update with the latest improvements and features.',
    'update.later': 'Maybe later',
    'update.now': 'Update now',
  },
  ja: {
    'update.title': '新しいバージョンがあります ✨',
    'update.body': '星星恋愛日記に新しいバージョンが届きました。最新の改善と機能を利用できます。',
    'update.later': 'あとで',
    'update.now': '更新する',
  },
  ko: {
    'update.title': '새 버전을 업데이트할 수 있어요 ✨',
    'update.body': '별사랑 일기에 새로운 버전이 준비되었어요. 최신 개선 사항과 기능을 이용할 수 있어요.',
    'update.later': '나중에',
    'update.now': '업데이트하기',
  },
  es: {
    'update.title': 'Hay una nueva versión disponible ✨',
    'update.body': 'Starry Love Diary tiene una actualización con las últimas mejoras y funciones.',
    'update.later': 'Más tarde',
    'update.now': 'Actualizar',
  },
  fr: {
    'update.title': 'Une nouvelle version est disponible ✨',
    'update.body': 'Journal d’amour étoilé propose une mise à jour avec les dernières améliorations et fonctions.',
    'update.later': 'Plus tard',
    'update.now': 'Mettre à jour',
  },
} as const satisfies Record<Locale, Record<UpdateMessageKey, string>>
