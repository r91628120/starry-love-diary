import type { Locale } from './messages'

type Key = 'title' | 'bodyOne' | 'bodyTwo' | 'continue' | 'privacy' | 'notRequired' | 'notNow' | 'loading' | 'credentialInUse' | 'failed'

export const appleIdentityGateMessages: Record<Locale, Record<`identityGate.${Key}`, string>> = {
  'zh-TW': {
    'identityGate.title': '一起走進我們的星空', 'identityGate.bodyOne': '當你想和另一個人建立連結時，需要先確認你的身分。', 'identityGate.bodyTwo': '這能讓你在重新開啟 App 後，仍然安全地回到你們的星空。', 'identityGate.continue': '使用 Apple 繼續', 'identityGate.privacy': 'Apple 帳號只用來確認你的身分。', 'identityGate.notRequired': '你的單人日記與清醒紀錄不需要登入也能繼續使用。', 'identityGate.notNow': '現在不要', 'identityGate.loading': '正在確認身分…', 'identityGate.credentialInUse': '這個 Apple 身分已連結到另一個帳號或裝置，無法自動合併。', 'identityGate.failed': '現在無法完成確認，請稍後再試一次。',
  },
  en: {
    'identityGate.title': 'Step into our starry sky together', 'identityGate.bodyOne': 'Before you connect with another person, we need to confirm your identity.', 'identityGate.bodyTwo': 'This helps you return safely to your shared starry sky when you reopen the app.', 'identityGate.continue': 'Continue with Apple', 'identityGate.privacy': 'Your Apple account is used only to confirm your identity.', 'identityGate.notRequired': 'Your personal diary and Clear records can continue without signing in.', 'identityGate.notNow': 'Not now', 'identityGate.loading': 'Confirming your identity…', 'identityGate.credentialInUse': 'This Apple identity is already connected to another account or device and cannot be merged automatically.', 'identityGate.failed': 'We could not confirm your identity right now. Please try again.',
  },
  ja: {
    'identityGate.title': 'ふたりの星空へ', 'identityGate.bodyOne': '誰かとつながる前に、あなたの本人確認が必要です。', 'identityGate.bodyTwo': 'アプリを開き直しても、ふたりの星空に安全に戻れるようにします。', 'identityGate.continue': 'Appleで続ける', 'identityGate.privacy': 'Appleアカウントは本人確認にだけ使用します。', 'identityGate.notRequired': 'ひとりの日記と心を整える記録は、ログインなしで続けられます。', 'identityGate.notNow': '今はしない', 'identityGate.loading': '本人確認中…', 'identityGate.credentialInUse': 'このApple IDは別のアカウントまたは端末に接続されているため、自動統合できません。', 'identityGate.failed': '今は本人確認を完了できません。もう一度お試しください。',
  },
  ko: {
    'identityGate.title': '함께 우리의 별하늘로', 'identityGate.bodyOne': '다른 사람과 연결하려면 먼저 본인 확인이 필요해요.', 'identityGate.bodyTwo': '앱을 다시 열어도 두 사람의 별하늘로 안전하게 돌아올 수 있어요.', 'identityGate.continue': 'Apple로 계속하기', 'identityGate.privacy': 'Apple 계정은 본인 확인에만 사용돼요.', 'identityGate.notRequired': '나만의 일기와 마음 정리 기록은 로그인 없이 계속할 수 있어요.', 'identityGate.notNow': '나중에 하기', 'identityGate.loading': '본인 확인 중…', 'identityGate.credentialInUse': '이 Apple 계정은 이미 다른 계정 또는 기기에 연결되어 있어 자동으로 합칠 수 없어요.', 'identityGate.failed': '지금은 본인 확인을 완료할 수 없어요. 다시 시도해 주세요.',
  },
  es: {
    'identityGate.title': 'Entren juntos en nuestro cielo estrellado', 'identityGate.bodyOne': 'Antes de conectar con otra persona, necesitamos confirmar tu identidad.', 'identityGate.bodyTwo': 'Así podrás volver con seguridad a su cielo estrellado al abrir la app de nuevo.', 'identityGate.continue': 'Continuar con Apple', 'identityGate.privacy': 'Tu cuenta de Apple solo se usa para confirmar tu identidad.', 'identityGate.notRequired': 'Tu diario personal y tus registros de claridad pueden seguir sin iniciar sesión.', 'identityGate.notNow': 'Ahora no', 'identityGate.loading': 'Confirmando tu identidad…', 'identityGate.credentialInUse': 'Esta identidad de Apple ya está conectada a otra cuenta o dispositivo y no se puede fusionar automáticamente.', 'identityGate.failed': 'No pudimos confirmar tu identidad ahora. Inténtalo de nuevo.',
  },
  fr: {
    'identityGate.title': 'Entrez ensemble dans notre ciel étoilé', 'identityGate.bodyOne': 'Avant de créer un lien avec quelqu’un, nous devons confirmer votre identité.', 'identityGate.bodyTwo': 'Vous pourrez ainsi revenir en sécurité vers votre ciel étoilé en rouvrant l’app.', 'identityGate.continue': 'Continuer avec Apple', 'identityGate.privacy': 'Votre compte Apple sert uniquement à confirmer votre identité.', 'identityGate.notRequired': 'Votre journal personnel et vos notes de clarté restent accessibles sans connexion.', 'identityGate.notNow': 'Pas maintenant', 'identityGate.loading': 'Confirmation de votre identité…', 'identityGate.credentialInUse': 'Cette identité Apple est déjà liée à un autre compte ou appareil et ne peut pas être fusionnée automatiquement.', 'identityGate.failed': 'Nous ne pouvons pas confirmer votre identité pour le moment. Réessayez.',
  },
}
