import type { Locale } from './messages'

export const exportAppDataMessages = {
  'zh-TW': {
    'settings.diary.exportAppData': '匯出 App 資料',
    'exportAppData.description': '可供之後匯入 App，不包含照片。',
    'exportAppData.preparing': '正在準備 App 資料…',
    'exportAppData.success': 'App 資料已匯出。',
    'exportAppData.error': 'App 資料匯出失敗，請稍後再試。',
  },
  en: {
    'settings.diary.exportAppData': 'Export app data',
    'exportAppData.description': 'For a future app import. Photos are not included.',
    'exportAppData.preparing': 'Preparing app data…',
    'exportAppData.success': 'App data exported.',
    'exportAppData.error': 'Could not export app data. Please try again later.',
  },
  ja: {
    'settings.diary.exportAppData': 'アプリデータを書き出す',
    'exportAppData.description': '今後のアプリへの取り込み用です。写真は含まれません。',
    'exportAppData.preparing': 'アプリデータを準備しています…',
    'exportAppData.success': 'アプリデータを書き出しました。',
    'exportAppData.error': 'アプリデータを書き出せませんでした。後でもう一度お試しください。',
  },
  ko: {
    'settings.diary.exportAppData': '앱 데이터 내보내기',
    'exportAppData.description': '나중에 앱으로 가져오기 위한 파일이며, 사진은 포함되지 않습니다.',
    'exportAppData.preparing': '앱 데이터를 준비하고 있어요…',
    'exportAppData.success': '앱 데이터를 내보냈어요.',
    'exportAppData.error': '앱 데이터를 내보내지 못했어요. 잠시 후 다시 시도해 주세요.',
  },
  es: {
    'settings.diary.exportAppData': 'Exportar datos de la app',
    'exportAppData.description': 'Para importarlos en la app más adelante. No incluye fotos.',
    'exportAppData.preparing': 'Preparando los datos de la app…',
    'exportAppData.success': 'Datos de la app exportados.',
    'exportAppData.error': 'No se pudieron exportar los datos de la app. Inténtalo de nuevo más tarde.',
  },
  fr: {
    'settings.diary.exportAppData': 'Exporter les données de l’app',
    'exportAppData.description': 'Pour une future importation dans l’app. Les photos ne sont pas incluses.',
    'exportAppData.preparing': 'Préparation des données de l’app…',
    'exportAppData.success': 'Données de l’app exportées.',
    'exportAppData.error': 'Impossible d’exporter les données de l’app. Réessayez plus tard.',
  },
} as const satisfies Record<Locale, Record<string, string>>
