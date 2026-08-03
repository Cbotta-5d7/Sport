import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/schema'
import { initialiserDonneesParDefaut } from './db/seed'

function App() {
  const [pret, setPret] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    initialiserDonneesParDefaut()
      .then(() => setPret(true))
      .catch((e) => setErreur(String(e)))

    if (navigator.storage?.persist) {
      navigator.storage.persist().catch(() => {})
    }
  }, [])

  const nbExercices = useLiveQuery(() => db.exercices.count(), [], undefined)
  const nbCibles = useLiveQuery(() => db.ciblesVolume.count(), [], undefined)

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <h1 className="text-3xl font-semibold text-slate-50">Musculation</h1>

      {erreur && (
        <p className="max-w-sm text-sm text-red-400">
          Erreur d'initialisation : {erreur}
        </p>
      )}

      {!erreur && (
        <div className="flex flex-col items-center gap-1 text-slate-300">
          <p>
            {pret ? 'Base locale initialisée.' : "Initialisation en cours..."}
          </p>
          {pret && (
            <p className="text-sm text-slate-400">
              {nbExercices ?? '…'} exercices, {nbCibles ?? '…'} cibles de volume
            </p>
          )}
        </div>
      )}

      <p className="mt-8 max-w-sm text-xs text-slate-500">
        Phase 1 : socle technique. Les écrans de séance arrivent en phase 2 et 3.
      </p>
    </div>
  )
}

export default App
