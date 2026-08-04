import { useState } from 'react'
import { db } from '../../db/schema'
import { TYPES_CHARGE, INCREMENTS_KG, GROUPES_PAR_PRIORITE, type Exercice } from '../../db/types'

interface Props {
  exercice: Exercice
  onEnregistre: (exercice: Exercice) => void
  onFermer: () => void
}

export function ModaleEditionExercice({ exercice, onEnregistre, onFermer }: Props) {
  const [nom, setNom] = useState(exercice.nom)
  const [groupeMusculaire, setGroupeMusculaire] = useState(exercice.groupeMusculaire)
  const [typeCharge, setTypeCharge] = useState(exercice.typeCharge)
  const [incrementKg, setIncrementKg] = useState(exercice.incrementKg)
  const [reposDefautSec, setReposDefautSec] = useState(exercice.reposDefautSec)
  const [repsCibleMin, setRepsCibleMin] = useState(exercice.repsCibleMin)
  const [repsCibleMax, setRepsCibleMax] = useState(exercice.repsCibleMax)
  const [notes, setNotes] = useState(exercice.notes)

  async function enregistrer() {
    const nomPropre = nom.trim()
    if (!nomPropre) return
    const maj: Exercice = {
      ...exercice,
      nom: nomPropre,
      groupeMusculaire,
      typeCharge,
      incrementKg,
      reposDefautSec,
      repsCibleMin,
      repsCibleMax: Math.max(repsCibleMax, repsCibleMin),
      notes,
    }
    await db.exercices.update(exercice.id, maj)
    onEnregistre(maj)
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60" onClick={onFermer}>
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto rounded-t-2xl bg-slate-900 p-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-lg font-semibold text-slate-50">Modifier l'exercice</h2>

        <label className="mb-1 text-xs text-slate-500">Nom</label>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="mb-3 min-h-12 rounded-xl border border-slate-700 bg-slate-950 px-4 text-slate-50 outline-none focus:border-accent"
        />

        <label className="mb-1 text-xs text-slate-500">Groupe musculaire</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {GROUPES_PAR_PRIORITE.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroupeMusculaire(g)}
              className={`min-h-9 rounded-lg border px-3 text-sm ${groupeMusculaire === g ? 'border-accent text-accent' : 'border-slate-700 text-slate-400'}`}
            >
              {g}
            </button>
          ))}
        </div>

        <label className="mb-1 text-xs text-slate-500">Type de charge</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {TYPES_CHARGE.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeCharge(t)}
              className={`min-h-9 rounded-lg border px-3 text-sm ${typeCharge === t ? 'border-accent text-accent' : 'border-slate-700 text-slate-400'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="mb-1 text-xs text-slate-500">Incrément (kg)</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {INCREMENTS_KG.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIncrementKg(i)}
              className={`min-h-9 rounded-lg border px-3 text-sm ${incrementKg === i ? 'border-accent text-accent' : 'border-slate-700 text-slate-400'}`}
            >
              {i.toString().replace('.', ',')}
            </button>
          ))}
        </div>

        <label className="mb-1 text-xs text-slate-500">Repos par défaut (secondes)</label>
        <div className="mb-3 flex items-center gap-2">
          <button type="button" onClick={() => setReposDefautSec((r) => Math.max(0, r - 15))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300">−</button>
          <span className="w-16 text-center text-slate-100">{reposDefautSec} s</span>
          <button type="button" onClick={() => setReposDefautSec((r) => r + 15)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300">+</button>
        </div>

        <label className="mb-1 text-xs text-slate-500">Fourchette de répétitions</label>
        <div className="mb-3 flex items-center gap-2">
          <button type="button" onClick={() => setRepsCibleMin((r) => Math.max(1, r - 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300">−</button>
          <span className="w-10 text-center text-slate-100">{repsCibleMin}</span>
          <button type="button" onClick={() => setRepsCibleMin((r) => r + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300">+</button>
          <span className="text-slate-500">à</span>
          <button type="button" onClick={() => setRepsCibleMax((r) => Math.max(1, r - 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300">−</button>
          <span className="w-10 text-center text-slate-100">{repsCibleMax}</span>
          <button type="button" onClick={() => setRepsCibleMax((r) => r + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300">+</button>
        </div>

        <label className="mb-1 text-xs text-slate-500">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mb-4 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none focus:border-accent"
        />

        <div className="flex gap-3">
          <button type="button" onClick={onFermer} className="min-h-14 flex-1 rounded-xl border border-slate-700 text-slate-300">
            Annuler
          </button>
          <button type="button" onClick={enregistrer} className="min-h-14 flex-1 rounded-xl bg-accent font-semibold text-slate-950">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
