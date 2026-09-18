import type { Locale } from './messages'

export const qa12DiagnosticsMessages = {
  'zh-TW': {
    'settings.qa12.title': 'QA-12 診斷', 'settings.qa12.export': '匯出 QA-12 診斷紀錄', 'settings.qa12.description': '僅包含本機技術事件，不包含你的內容或照片。', 'settings.qa12.preparing': '正在準備診斷紀錄…', 'settings.qa12.ready': '診斷紀錄已準備好，請選擇儲存或分享方式。', 'settings.qa12.downloaded': '診斷紀錄已下載。', 'settings.qa12.cancelled': '已取消匯出診斷紀錄。', 'settings.qa12.error': '無法匯出診斷紀錄，請稍後再試。',
  },
  en: {
    'settings.qa12.title': 'QA-12 diagnostics', 'settings.qa12.export': 'Export QA-12 diagnostic log', 'settings.qa12.description': 'Contains local technical events only, never your content or photos.', 'settings.qa12.preparing': 'Preparing diagnostic log…', 'settings.qa12.ready': 'Diagnostic log is ready. Choose how to save or share it.', 'settings.qa12.downloaded': 'Diagnostic log downloaded.', 'settings.qa12.cancelled': 'Diagnostic log export cancelled.', 'settings.qa12.error': 'Could not export diagnostic log. Please try again later.',
  },
  ja: {
    'settings.qa12.title': 'QA-12 診断', 'settings.qa12.export': 'QA-12 診断ログを書き出す', 'settings.qa12.description': '端末内の技術イベントのみを含み、内容や写真は含みません。', 'settings.qa12.preparing': '診断ログを準備しています…', 'settings.qa12.ready': '診断ログの準備ができました。保存または共有の方法を選択してください。', 'settings.qa12.downloaded': '診断ログをダウンロードしました。', 'settings.qa12.cancelled': '診断ログの書き出しをキャンセルしました。', 'settings.qa12.error': '診断ログを書き出せませんでした。後でもう一度お試しください。',
  },
  ko: {
    'settings.qa12.title': 'QA-12 진단', 'settings.qa12.export': 'QA-12 진단 기록 내보내기', 'settings.qa12.description': '기기의 기술 이벤트만 포함하며, 내용이나 사진은 포함하지 않습니다.', 'settings.qa12.preparing': '진단 기록을 준비하고 있어요…', 'settings.qa12.ready': '진단 기록을 준비했어요. 저장하거나 공유할 방법을 선택해 주세요.', 'settings.qa12.downloaded': '진단 기록을 다운로드했어요.', 'settings.qa12.cancelled': '진단 기록 내보내기를 취소했어요.', 'settings.qa12.error': '진단 기록을 내보내지 못했어요. 잠시 후 다시 시도해 주세요.',
  },
  es: {
    'settings.qa12.title': 'Diagnóstico QA-12', 'settings.qa12.export': 'Exportar registro de diagnóstico QA-12', 'settings.qa12.description': 'Solo contiene eventos técnicos locales; nunca tu contenido ni fotos.', 'settings.qa12.preparing': 'Preparando el registro de diagnóstico…', 'settings.qa12.ready': 'El registro está listo. Elige cómo guardarlo o compartirlo.', 'settings.qa12.downloaded': 'Registro de diagnóstico descargado.', 'settings.qa12.cancelled': 'Se canceló la exportación del registro de diagnóstico.', 'settings.qa12.error': 'No se pudo exportar el registro de diagnóstico. Inténtalo más tarde.',
  },
  fr: {
    'settings.qa12.title': 'Diagnostic QA-12', 'settings.qa12.export': 'Exporter le journal de diagnostic QA-12', 'settings.qa12.description': 'Contient uniquement des événements techniques locaux, jamais vos contenus ni photos.', 'settings.qa12.preparing': 'Préparation du journal de diagnostic…', 'settings.qa12.ready': 'Le journal est prêt. Choisissez comment l’enregistrer ou le partager.', 'settings.qa12.downloaded': 'Journal de diagnostic téléchargé.', 'settings.qa12.cancelled': 'L’export du journal de diagnostic a été annulé.', 'settings.qa12.error': 'Impossible d’exporter le journal de diagnostic. Réessayez plus tard.',
  },
} as const satisfies Record<Locale, Record<string, string>>
