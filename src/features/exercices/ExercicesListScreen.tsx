import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { GROUPES_MUSCULAIRES, type GroupeMusculaire } from '../../db/types'

interface Props {
  onRetour: () => void
  onOuvrirExercice: (id: number) => void
}

export function ExercicesListScreen({ onRetour, onOuvrirExercice }: Props) {
  const [recherche, setRecherche] = useState('')
  const [filtreGroupe, setFiltreGroupe] = useState<GroupeMusculaire | null>(null)

  const exercices = useLiveQuery(() => db.exercices.toArray(), [], [])

  const filtres = exercices
    .filter((e) => !e.archive)
    .filter((e) => !filtreGroupe || e.groupeMusculaire === filtreGroupe)
    .filter((e) => e.nom.toLowerCase().includes(recherche.toLowerCase()))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

  return (
    <div
      className="flex min-h-dvh flex-col px-4 pb-10"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onRetour}
          className="min-h-11 min-w-11 rounded-lg border border-slate-700 text-slate-300"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold">Exercices</h1>
      </header>

      <input
        type="text"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher..."
        className="mb-3 min-h-12 rounded-xl border border-slate-700 bg-slate-950 px-4 text-slate-50 outline-none focus:border-accent"
      />

      <div className="mb-4 flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setFiltreGroupe(null)}
          className={`min-h-9 shrink-0 rounded-lg border px-3 text-sm ${!filtreGroupe ? 'border-accent text-accent' : 'border-slate-700 text-slate-400'}`}
        >
          Tous
        </button>
        {GROUPES_MUSCULAIRES.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setFiltreGroupe(g)}
            className={`min-h-9 shrink-0 rounded-lg border px-3 text-sm ${filtreGroupe === g ? 'border-accent text-accent' : 'border-slate-700 text-slate-400'}`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {filtres.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => onOuvrirExercice(e.id)}
            className="flex min-h-14 items-center justify-between rounded-xl border border-slate-800 px-4 text-left"
          >
            <span className="text-slate-100">
              {e.estRepere && <span className="mr-1 text-amber-400">★</span>}
              {e.nom}
            </span>
            <span className="text-xs text-slate-500">{e.groupeMusculaire}</span>
          </button>
        ))}
        {filtres.length === 0 && <p className="text-sm text-slate-500">Aucun exercice.</p>}
      </div>
    </div>
  )
}
