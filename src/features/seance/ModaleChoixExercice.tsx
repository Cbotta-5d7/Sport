import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import type { Exercice } from '../../db/types'

interface Props {
  titre: string
  exclureId?: number
  onChoisir: (exercice: Exercice) => void
  onFermer: () => void
}

export function ModaleChoixExercice({ titre, exclureId, onChoisir, onFermer }: Props) {
  const [recherche, setRecherche] = useState('')
  const exercices = useLiveQuery(
    async () => {
      const liste = await db.exercices.filter((e) => !e.archive).toArray()
      return liste.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    },
    [],
    [] as Exercice[],
  )

  const filtres = exercices.filter(
    (e) => e.id !== exclureId && e.nom.toLowerCase().includes(recherche.toLowerCase()),
  )

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60" onClick={onFermer}>
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-t-3xl bg-white p-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-lg font-semibold text-slate-900">{titre}</h2>
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher..."
          className="mb-3 min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-slate-900 outline-none focus:border-accent"
        />
        <div className="flex-1 overflow-y-auto">
          {filtres.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onChoisir(e)}
              className="flex min-h-14 w-full items-center border-b border-slate-200 text-left text-slate-800"
            >
              <span className="flex-1">{e.nom}</span>
              <span className="text-xs text-slate-400">{e.groupeMusculaire}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onFermer}
          className="mt-3 min-h-14 rounded-2xl border border-slate-300 text-slate-600"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
