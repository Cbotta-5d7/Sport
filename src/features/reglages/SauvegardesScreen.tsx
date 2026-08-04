import { useEffect, useState } from 'react'
import { lireConfigGitHub } from '../../sync/synchroniser'
import { listerCommits, lireFichierAVersion, type CommitInfo } from '../../sync/github'
import { appliquerSnapshot } from '../../sync/snapshot'

interface Props {
  onRetour: () => void
}

export function SauvegardesScreen({ onRetour }: Props) {
  const [commits, setCommits] = useState<CommitInfo[] | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<CommitInfo | null>(null)
  const [restaurationEnCours, setRestaurationEnCours] = useState(false)
  const [restaurationOk, setRestaurationOk] = useState(false)

  useEffect(() => {
    async function charger() {
      const config = await lireConfigGitHub()
      if (!config) {
        setErreur('Renseigne d\'abord le dépôt privé et le jeton dans les réglages.')
        return
      }
      try {
        const liste = await listerCommits(config, 20)
        setCommits(liste)
      } catch (e) {
        setErreur(e instanceof Error ? e.message : String(e))
      }
    }
    charger()
  }, [])

  async function restaurer(commit: CommitInfo) {
    const config = await lireConfigGitHub()
    if (!config) return
    setRestaurationEnCours(true)
    try {
      const snapshot = await lireFichierAVersion(config, commit.sha)
      await appliquerSnapshot(snapshot)
      setRestaurationOk(true)
      setConfirmation(null)
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e))
    } finally {
      setRestaurationEnCours(false)
    }
  }

  if (restaurationOk) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg text-slate-800">Sauvegarde restaurée.</p>
        <button
          type="button"
          onClick={onRetour}
          className="min-h-14 rounded-2xl bg-accent px-6 font-semibold text-slate-950"
        >
          Retour
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-dvh flex-col px-4 pb-10"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <header className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onRetour}
          className="min-h-11 min-w-11 rounded-xl border border-slate-300 text-slate-600"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold">Sauvegardes</h1>
      </header>

      {erreur && <p className="mb-4 text-sm text-red-600">{erreur}</p>}

      {!erreur && !commits && <p className="text-slate-400">Chargement des sauvegardes…</p>}

      <div className="flex flex-col gap-2">
        {commits?.map((c) => (
          <button
            key={c.sha}
            type="button"
            onClick={() => setConfirmation(c)}
            className="flex min-h-14 flex-col items-start rounded-2xl border border-slate-200 px-4 py-2 text-left"
          >
            <span className="text-slate-800">{new Date(c.date).toLocaleString('fr-FR')}</span>
            <span className="text-xs text-slate-400">{c.message}</span>
          </button>
        ))}
        {commits && commits.length === 0 && (
          <p className="text-sm text-slate-400">Aucune sauvegarde pour l'instant.</p>
        )}
      </div>

      {confirmation && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60" onClick={() => setConfirmation(null)}>
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-5"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Restaurer cette sauvegarde ?</h2>
            <p className="mb-4 text-sm text-slate-500">
              {new Date(confirmation.date).toLocaleString('fr-FR')} — toutes les données locales actuelles seront
              remplacées par celles de cette sauvegarde. Cette action est irréversible sur cet appareil.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="min-h-14 flex-1 rounded-2xl border border-slate-300 text-slate-600"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => restaurer(confirmation)}
                disabled={restaurationEnCours}
                className="min-h-14 flex-1 rounded-2xl bg-red-700 font-semibold text-slate-900 disabled:opacity-40"
              >
                Restaurer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
