import { useEffect, useState } from 'react'
import { db } from '../../db/schema'
import { synchroniserMaintenant, lireConfigGitHub } from '../../sync/synchroniser'
import { verifierAcces } from '../../sync/github'
import { useEtatSync } from '../../sync/useEtatSync'
import { IndicateurSync } from './IndicateurSync'

interface Props {
  onRetour: () => void
  onOuvrirSauvegardes: () => void
}

export function ReglagesScreen({ onRetour, onOuvrirSauvegardes }: Props) {
  const [proprietaire, setProprietaire] = useState('')
  const [depot, setDepot] = useState('')
  const [jeton, setJeton] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const etat = useEtatSync()

  useEffect(() => {
    Promise.all([
      db.reglages.get('githubProprietaire'),
      db.reglages.get('githubDepot'),
      db.reglages.get('githubJeton'),
    ]).then(([p, d, j]) => {
      setProprietaire(p?.valeur ?? '')
      setDepot(d?.valeur ?? '')
      setJeton(j?.valeur ?? '')
    })
  }, [])

  async function enregistrer() {
    await Promise.all([
      db.reglages.put({ cle: 'githubProprietaire', valeur: proprietaire.trim() }),
      db.reglages.put({ cle: 'githubDepot', valeur: depot.trim() }),
      db.reglages.put({ cle: 'githubJeton', valeur: jeton.trim() }),
    ])
    setMessage('Enregistré.')
  }

  async function tester() {
    setEnCours(true)
    setMessage(null)
    await enregistrer()
    const config = await lireConfigGitHub()
    if (!config) {
      setMessage('Renseigne le propriétaire, le dépôt et le jeton.')
      setEnCours(false)
      return
    }
    const resultat = await verifierAcces(config)
    setMessage(resultat.ok ? 'Connexion au dépôt privé réussie.' : (resultat.erreur ?? 'Erreur inconnue'))
    setEnCours(false)
  }

  async function synchroniser() {
    setEnCours(true)
    setMessage(null)
    await enregistrer()
    const resultat = await synchroniserMaintenant()
    if (resultat.statut === 'non_configure') setMessage('Renseigne le propriétaire, le dépôt et le jeton.')
    else if (resultat.statut === 'erreur') setMessage(`Échec de synchronisation : ${resultat.message}`)
    else setMessage(resultat.message ?? 'Synchronisation réussie.')
    setEnCours(false)
  }

  return (
    <div
      className="flex min-h-dvh flex-col px-4 pb-10"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRetour}
            className="min-h-11 min-w-11 rounded-lg border border-slate-700 text-slate-300"
          >
            ←
          </button>
          <h1 className="text-xl font-semibold">Réglages</h1>
        </div>
        <IndicateurSync />
      </header>

      <h2 className="mb-2 text-sm font-medium text-slate-400">Sauvegarde GitHub</h2>
      <p className="mb-4 text-xs text-slate-500">
        Dépôt privé dédié aux données uniquement (jamais le dépôt public du code). Le jeton reste stocké
        uniquement sur cet appareil.
      </p>

      <label className="mb-1 text-xs text-slate-500">Propriétaire (utilisateur ou organisation)</label>
      <input
        type="text"
        value={proprietaire}
        onChange={(e) => setProprietaire(e.target.value)}
        placeholder="ex. Cbotta-5d7"
        className="mb-3 min-h-12 rounded-xl border border-slate-700 bg-slate-950 px-4 text-slate-50 outline-none focus:border-accent"
      />

      <label className="mb-1 text-xs text-slate-500">Nom du dépôt privé</label>
      <input
        type="text"
        value={depot}
        onChange={(e) => setDepot(e.target.value)}
        placeholder="ex. sport-data"
        className="mb-3 min-h-12 rounded-xl border border-slate-700 bg-slate-950 px-4 text-slate-50 outline-none focus:border-accent"
      />

      <label className="mb-1 text-xs text-slate-500">Jeton d'accès (fine-grained, Contents: Read & write)</label>
      <input
        type="password"
        value={jeton}
        onChange={(e) => setJeton(e.target.value)}
        placeholder="ghp_..."
        autoComplete="off"
        className="mb-4 min-h-12 rounded-xl border border-slate-700 bg-slate-950 px-4 text-slate-50 outline-none focus:border-accent"
      />

      {message && <p className="mb-4 text-sm text-slate-300">{message}</p>}

      <div className="mb-3 flex gap-3">
        <button
          type="button"
          onClick={tester}
          disabled={enCours}
          className="min-h-12 flex-1 rounded-xl border border-slate-700 text-sm text-slate-200 disabled:opacity-40"
        >
          Tester la connexion
        </button>
        <button
          type="button"
          onClick={synchroniser}
          disabled={enCours}
          className="min-h-12 flex-1 rounded-xl bg-accent text-sm font-semibold text-slate-950 disabled:opacity-40"
        >
          Synchroniser maintenant
        </button>
      </div>

      <p className="mb-6 text-xs text-slate-500">
        {etat.horodatage
          ? `Dernière synchronisation réussie : ${new Date(etat.horodatage).toLocaleString('fr-FR')}`
          : "Aucune synchronisation pour l'instant."}
      </p>

      <button
        type="button"
        onClick={onOuvrirSauvegardes}
        className="min-h-14 rounded-xl border border-slate-700 text-slate-200"
      >
        Sauvegardes (historique et restauration)
      </button>
    </div>
  )
}
