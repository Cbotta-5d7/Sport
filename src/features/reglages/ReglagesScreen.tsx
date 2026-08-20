import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { synchroniserMaintenant, lireConfigGitHub } from '../../sync/synchroniser'
import { verifierAcces } from '../../sync/github'
import { telechargerExportJSON } from '../../sync/export'
import { useEtatSync } from '../../sync/useEtatSync'
import { IndicateurSync } from './IndicateurSync'
import { ReglagesVolume } from './ReglagesVolume'

const PLAGES_DISQUES = [25, 20, 15, 10, 5, 2.5, 1.25, 1, 0.5]

interface Props {
  onRetour: () => void
  onOuvrirSauvegardes: () => void
  onOuvrirCalculateur: () => void
  onOuvrirProgramme: () => void
}

export function ReglagesScreen({ onRetour, onOuvrirSauvegardes, onOuvrirCalculateur, onOuvrirProgramme }: Props) {
  const [proprietaire, setProprietaire] = useState('')
  const [depot, setDepot] = useState('')
  const [jeton, setJeton] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const etat = useEtatSync()

  const reglagesDivers = useLiveQuery(
    () => db.reglages.bulkGet(['poidsBarreKg', 'inventaireDisquesKg', 'sonActif', 'vibrationActif', 'seancesCibleParSemaine']),
    [],
    undefined,
  )

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

  const poidsBarreKg = reglagesDivers?.[0]?.valeur ?? '20'
  const inventaireDisques: number[] = reglagesDivers?.[1]?.valeur ? JSON.parse(reglagesDivers[1].valeur) : []
  const sonActif = reglagesDivers?.[2]?.valeur !== 'false'
  const vibrationActif = reglagesDivers?.[3]?.valeur !== 'false'
  const seancesCibleParSemaine = reglagesDivers?.[4]?.valeur ?? '3'

  async function changerPoidsBarre(valeur: string) {
    if (!/^\d*([.,]\d*)?$/.test(valeur)) return
    await db.reglages.put({ cle: 'poidsBarreKg', valeur: valeur.replace(',', '.') })
  }

  async function changerSeancesCible(valeur: string) {
    if (!/^\d*$/.test(valeur)) return
    await db.reglages.put({ cle: 'seancesCibleParSemaine', valeur })
  }

  async function basculerDisque(poids: number) {
    const nouvelInventaire = inventaireDisques.includes(poids)
      ? inventaireDisques.filter((d) => d !== poids)
      : [...inventaireDisques, poids]
    await db.reglages.put({ cle: 'inventaireDisquesKg', valeur: JSON.stringify(nouvelInventaire) })
  }

  async function basculerSon() {
    await db.reglages.put({ cle: 'sonActif', valeur: String(!sonActif) })
  }
  async function basculerVibration() {
    await db.reglages.put({ cle: 'vibrationActif', valeur: String(!vibrationActif) })
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
            className="min-h-11 min-w-11 rounded-xl border border-slate-300 text-slate-600"
          >
            ←
          </button>
          <h1 className="text-xl font-semibold">Réglages</h1>
        </div>
        <IndicateurSync />
      </header>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Programme</h2>
      <button
        type="button"
        onClick={onOuvrirProgramme}
        className="mb-6 min-h-14 rounded-2xl border border-slate-300 text-slate-700"
      >
        📋 Jours d'entraînement et séries par exercice
      </button>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Séances</h2>
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
        <span className="text-sm text-slate-700">Cible de séances par semaine</span>
        <input
          type="text"
          inputMode="numeric"
          value={seancesCibleParSemaine}
          onChange={(e) => changerSeancesCible(e.target.value)}
          className="w-14 rounded-xl border border-slate-300 bg-slate-50 px-2 py-1 text-center text-slate-900"
        />
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Cibles de volume par groupe</h2>
      <div className="mb-6">
        <ReglagesVolume />
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Matériel</h2>
      <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
        <span className="text-sm text-slate-700">Poids de la barre (kg)</span>
        <input
          type="text"
          inputMode="decimal"
          value={poidsBarreKg}
          onChange={(e) => changerPoidsBarre(e.target.value)}
          className="w-16 rounded-xl border border-slate-300 bg-slate-50 px-2 py-1 text-center text-slate-900"
        />
      </div>
      <p className="mb-2 text-xs text-slate-400">Inventaire de disques disponibles (par côté)</p>
      <div className="mb-6 flex flex-wrap gap-2">
        {PLAGES_DISQUES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => basculerDisque(p)}
            className={`min-h-10 rounded-xl border px-3 text-sm ${
              inventaireDisques.includes(p) ? 'border-accent text-accent' : 'border-slate-300 text-slate-400'
            }`}
          >
            {p.toString().replace('.', ',')} kg
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onOuvrirCalculateur}
        className="mb-6 min-h-12 rounded-2xl border border-slate-300 text-sm text-slate-700"
      >
        Ouvrir le calculateur de disques
      </button>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Son et vibration</h2>
      <div className="mb-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={basculerSon}
          className="flex min-h-12 items-center justify-between rounded-2xl border border-slate-200 px-4 text-sm text-slate-700"
        >
          Son du minuteur
          <span className={sonActif ? 'text-accent' : 'text-slate-400'}>{sonActif ? 'Activé' : 'Désactivé'}</span>
        </button>
        <button
          type="button"
          onClick={basculerVibration}
          className="flex min-h-12 items-center justify-between rounded-2xl border border-slate-200 px-4 text-sm text-slate-700"
        >
          Vibration
          <span className={vibrationActif ? 'text-accent' : 'text-slate-400'}>{vibrationActif ? 'Activée' : 'Désactivée'}</span>
        </button>
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Sauvegarde GitHub</h2>
      <p className="mb-4 text-xs text-slate-400">
        Dépôt privé dédié aux données uniquement (jamais le dépôt public du code). Le jeton reste stocké
        uniquement sur cet appareil.
      </p>

      <label className="mb-1 text-xs text-slate-400">Propriétaire (utilisateur ou organisation)</label>
      <input
        type="text"
        value={proprietaire}
        onChange={(e) => setProprietaire(e.target.value)}
        placeholder="ex. Cbotta-5d7"
        className="mb-3 min-h-12 rounded-2xl border border-slate-300 bg-slate-50 px-4 text-slate-900 outline-none focus:border-accent"
      />

      <label className="mb-1 text-xs text-slate-400">Nom du dépôt privé</label>
      <input
        type="text"
        value={depot}
        onChange={(e) => setDepot(e.target.value)}
        placeholder="ex. sport-data"
        className="mb-3 min-h-12 rounded-2xl border border-slate-300 bg-slate-50 px-4 text-slate-900 outline-none focus:border-accent"
      />

      <label className="mb-1 text-xs text-slate-400">Jeton d'accès (fine-grained, Contents: Read & write)</label>
      <input
        type="password"
        value={jeton}
        onChange={(e) => setJeton(e.target.value)}
        placeholder="ghp_..."
        autoComplete="off"
        className="mb-4 min-h-12 rounded-2xl border border-slate-300 bg-slate-50 px-4 text-slate-900 outline-none focus:border-accent"
      />

      {message && <p className="mb-4 text-sm text-slate-600">{message}</p>}

      <div className="mb-3 flex gap-3">
        <button
          type="button"
          onClick={tester}
          disabled={enCours}
          className="min-h-12 flex-1 rounded-2xl border border-slate-300 text-sm text-slate-700 disabled:opacity-40"
        >
          Tester la connexion
        </button>
        <button
          type="button"
          onClick={synchroniser}
          disabled={enCours}
          className="min-h-12 flex-1 rounded-2xl bg-accent text-sm font-semibold text-slate-950 disabled:opacity-40"
        >
          Synchroniser maintenant
        </button>
      </div>

      <p className="mb-6 text-xs text-slate-400">
        {etat.horodatage
          ? `Dernière synchronisation réussie : ${new Date(etat.horodatage).toLocaleString('fr-FR')}`
          : "Aucune synchronisation pour l'instant."}
      </p>

      <button
        type="button"
        onClick={onOuvrirSauvegardes}
        className="mb-3 min-h-14 rounded-2xl border border-slate-300 text-slate-700"
      >
        Sauvegardes (historique et restauration)
      </button>

      <button
        type="button"
        onClick={() => telechargerExportJSON()}
        className="min-h-14 rounded-2xl border border-slate-300 text-slate-700"
      >
        Export JSON manuel
      </button>

      <p className="mt-6 text-center text-xs text-slate-300">
        Version {__BUILD_COMMIT__} · {new Date(__BUILD_TIME__).toLocaleString('fr-FR')}
      </p>
    </div>
  )
}
