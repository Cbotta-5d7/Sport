import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

const INTERVALLE_VERIF_MAJ_MS = 60_000

// Une mise à jour ne doit jamais recharger la page pendant une utilisation active (ex : en plein
// milieu d'une saisie de série), au risque d'interrompre une écriture IndexedDB en cours ou une
// saisie non validée dans le clavier numérique. On applique la mise à jour seulement quand l'onglet
// passe en arrière-plan (verrouillage du téléphone, changement d'appli), jamais pendant que
// l'utilisateur regarde l'écran.
let miseAJourEnAttente = false

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    miseAJourEnAttente = true
    if (document.visibilityState === 'hidden') {
      updateSW(true)
    }
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    setInterval(() => {
      registration.update()
    }, INTERVALLE_VERIF_MAJ_MS)
  },
})

document.addEventListener('visibilitychange', () => {
  if (miseAJourEnAttente && document.visibilityState === 'hidden') {
    updateSW(true)
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
