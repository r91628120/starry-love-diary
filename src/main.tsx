import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './app/App'
import { I18nProvider } from './i18n/I18nProvider'
import { resolveLocale } from './i18n/locale'
import { initializePersistence } from './data/persistence'
import { PersistenceProvider } from './data/PersistenceContext'
import './theme/index.css'

async function start() {
  const persistence = await initializePersistence({ defaultLocale: resolveLocale(globalThis.navigator?.language) })
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <PersistenceProvider runtime={persistence}>
        <I18nProvider initialLocale={persistence.initial.settings.locale}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </I18nProvider>
      </PersistenceProvider>
    </StrictMode>,
  )
}

void start()
