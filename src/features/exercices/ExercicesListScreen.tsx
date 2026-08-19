import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { deplacerExercice } from '../../db/exercices'
import { GROUPES_MUSCULAIRES, type GroupeMusculaire, type Exercice } from '../../db/types'
import { ModaleCreationExercice } from './ModaleCreationExercice'

interface Props {
  onRetour: () => void
  onOuvrirExercice: (id: number) => void
}

export function ExercicesListScreen({ onRetour, onOuvrirExercice }: Props) {
  const [recherche, setRecherche] = useState('')
  const [filtreGroupe, setFiltreGroupe] = useState<GroupeMusculaire | null>(null)
  const [creationOuverte, setCreationOuverte] = useState(false)

  const exercices = useLiveQuery(() => db.exercices.toArray(), [], [])

  const filtres = exercices
    .filter((e) => !e.archive)
    .filter((e) => !filtreGroupe || e.groupeMusculaire === filtreGroupe)
    .filter((e) => e.nom.toLowerCase().includes(recherche.toLowerCase()))
    .sort((a, b) => a.ordre - b.ordre)
  const idsVisibles = filtres.map((e) => e.id)

  function apresCreation(exercice: Exercice) {
    setCreationOuverte(false)
    onOuvrirExercice(exercice.id)
  }

  return (
    <div
      className="flex min-h-dvh flex-col px-4 pb-10"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onRetour}
          className="min-h-11 min-w-11 rounded-xl border border-slate-300 text-slate-600"
        >
          ←
        </button>
        <h1 className="flex-1 text-xl font-semibold">Exercices</h1>
        <button
          type="button"
          onClick={() => setCreationOuverte(true)}
          className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm text-accent"
        >
          + Nouvel exercice
        </button>
      </header>

      <input
        type="text"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher..."
        className="mb-3 min-h-12 rounded-2xl border border-slate-300 bg-slate-50 px-4 text-slate-900 outline-none focus:border-accent"
      />

      <div className="mb-4 flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setFiltreGroupe(null)}
          className={`min-h-9 shrink-0 rounded-xl border px-3 text-sm ${!filtreGroupe ? 'border-accent text-accent' : 'border-slate-300 text-slate-500'}`}
        >
          Tous
        </button>
        {GROUPES_MUSCULAIRES.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setFiltreGroupe(g)}
            className={`min-h-9 shrink-0 rounded-xl border px-3 text-sm ${filtreGroupe === g ? 'border-accent text-accent' : 'border-slate-300 text-slate-500'}`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {filtres.map((e, index) => (
          <div
            key={e.id}
            className="flex items-center gap-1 rounded-2xl border border-slate-200 pl-1 pr-4"
          >
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                onClick={() => deplacerExercice(idsVisibles, e.id, 'haut')}
                disabled={index === 0}
                aria-label={`Monter ${e.nom}`}
                className="flex h-6 w-6 items-center justify-center text-slate-400 disabled:opacity-20"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => deplacerExercice(idsVisibles, e.id, 'bas')}
                disabled={index === filtres.length - 1}
                aria-label={`Descendre ${e.nom}`}
                className="flex h-6 w-6 items-center justify-center text-slate-400 disabled:opacity-20"
              >
                ▼
              </button>
            </div>
            <button
              type="button"
              onClick={() => onOuvrirExercice(e.id)}
              className="flex min-h-14 flex-1 items-center justify-between text-left"
            >
              <span className="text-slate-800">
                {e.estRepere && <span className="mr-1 text-amber-600">★</span>}
                {e.notes.trim() && <span className="mr-1">📝</span>}
                {e.nom}
              </span>
              <span className="text-xs text-slate-400">{e.groupeMusculaire}</span>
            </button>
          </div>
        ))}
        {filtres.length === 0 && <p className="text-sm text-slate-400">Aucun exercice.</p>}
      </div>

      {creationOuverte && (
        <ModaleCreationExercice
          groupe={filtreGroupe ?? 'Pectoraux'}
          onCree={apresCreation}
          onFermer={() => setCreationOuverte(false)}
        />
      )}
    </div>
  )
}
