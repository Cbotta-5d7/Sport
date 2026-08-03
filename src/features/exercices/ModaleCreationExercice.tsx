import { useState } from 'react'
import { db } from '../../db/schema'
import { defautsPourGroupe } from '../../db/defautsGroupe'
import type { Exercice, GroupeMusculaire } from '../../db/types'

interface Props {
  groupe: GroupeMusculaire
  onCree: (exercice: Exercice) => void
  onFermer: () => void
}

export function ModaleCreationExercice({ groupe, onCree, onFermer }: Props) {
  const [nom, setNom] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function creer() {
    const nomPropre = nom.trim()
    if (!nomPropre || enCours) return
    setEnCours(true)
    const defauts = defautsPourGroupe(groupe)
    const exercice: Omit<Exercice, 'id'> = {
      nom: nomPropre,
      groupeMusculaire: groupe,
      estRepere: false,
      archive: false,
      notes: '',
      ...defauts,
    }
    const id = await db.exercices.add(exercice)
    onCree({ ...exercice, id })
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60" onClick={onFermer}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-slate-900 p-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold text-slate-50">Nouvel exercice</h2>
        <p className="mb-4 text-sm text-slate-400">Groupe : {groupe}</p>
        <input
          autoFocus
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom de l'exercice"
          className="mb-4 min-h-14 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-lg text-slate-50 outline-none focus:border-accent"
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onFermer}
            className="min-h-14 flex-1 rounded-xl border border-slate-700 text-slate-300"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={creer}
            disabled={!nom.trim() || enCours}
            className="min-h-14 flex-1 rounded-xl bg-accent font-semibold text-slate-950 disabled:opacity-40"
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  )
}
