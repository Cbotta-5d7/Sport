import { useState } from 'react'
import { useAppuiRepete } from '../../hooks/useAppuiRepete'
import { ClavierNumerique } from './ClavierNumerique'
import { SelecteurRIR } from './SelecteurRIR'
import { formatKg } from '../../utils/nombres'
import type { TypeSerie } from '../../db/types'

const TYPES: { valeur: TypeSerie; libelle: string }[] = [
  { valeur: 'normale', libelle: 'Normale' },
  { valeur: 'échauffement', libelle: 'Échauffement' },
  { valeur: 'dégressive', libelle: 'Dégressive' },
  { valeur: 'échec', libelle: 'Échec' },
]

interface Props {
  numeroSerie: number
  poidsKg: number
  reps: number
  incrementKg: number
  rir: number | null
  type: TypeSerie
  estDerniereSerie: boolean
  onChangerPoids: (poids: number) => void
  onChangerReps: (reps: number) => void
  onChoisirRir: (rir: number) => void
  onChangerType: (type: TypeSerie) => void
  onValider: () => void
}

export function EntreeSerie({
  numeroSerie,
  poidsKg,
  reps,
  incrementKg,
  rir,
  type,
  estDerniereSerie,
  onChangerPoids,
  onChangerReps,
  onChoisirRir,
  onChangerType,
  onValider,
}: Props) {
  const [clavier, setClavier] = useState<'poids' | 'reps' | null>(null)

  const appuiMoinsPoids = useAppuiRepete(() => onChangerPoids(Math.max(0, poidsKg - incrementKg)))
  const appuiPlusPoids = useAppuiRepete(() => onChangerPoids(poidsKg + incrementKg))
  const appuiMoinsReps = useAppuiRepete(() => onChangerReps(Math.max(0, reps - 1)))
  const appuiPlusReps = useAppuiRepete(() => onChangerReps(reps + 1))

  const rirManquant = estDerniereSerie && rir === null

  return (
    <div
      className="flex flex-col gap-3 border-t border-slate-800 bg-slate-950 px-4 pt-3"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
    >
      <p className="text-center text-sm text-slate-500">Série {numeroSerie}</p>

      <div className="flex gap-2 overflow-x-auto">
        {TYPES.map((t) => (
          <button
            key={t.valeur}
            type="button"
            onClick={() => onChangerType(t.valeur)}
            className={`min-h-10 shrink-0 rounded-lg border px-3 text-sm ${
              type === t.valeur ? 'border-accent text-accent' : 'border-slate-700 text-slate-400'
            }`}
          >
            {t.libelle}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          {...appuiMoinsPoids}
          className="flex min-h-14 min-w-14 items-center justify-center rounded-xl bg-slate-800 text-2xl text-slate-100 select-none"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setClavier('poids')}
          className="flex min-h-14 flex-1 flex-col items-center justify-center rounded-xl border border-slate-700"
        >
          <span className="text-2xl font-semibold text-slate-50">{formatKg(poidsKg)} kg</span>
        </button>
        <button
          type="button"
          {...appuiPlusPoids}
          className="flex min-h-14 min-w-14 items-center justify-center rounded-xl bg-slate-800 text-2xl text-slate-100 select-none"
        >
          +
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          {...appuiMoinsReps}
          className="flex min-h-14 min-w-14 items-center justify-center rounded-xl bg-slate-800 text-2xl text-slate-100 select-none"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setClavier('reps')}
          className="flex min-h-14 flex-1 flex-col items-center justify-center rounded-xl border border-slate-700"
        >
          <span className="text-2xl font-semibold text-slate-50">{reps} reps</span>
        </button>
        <button
          type="button"
          {...appuiPlusReps}
          className="flex min-h-14 min-w-14 items-center justify-center rounded-xl bg-slate-800 text-2xl text-slate-100 select-none"
        >
          +
        </button>
      </div>

      {estDerniereSerie && (
        <div>
          <p className="mb-1 text-xs text-slate-500">RIR (répétitions en réserve)</p>
          <SelecteurRIR valeur={rir} onChoisir={onChoisirRir} />
        </div>
      )}

      <button
        type="button"
        onClick={onValider}
        disabled={rirManquant}
        className="min-h-14 rounded-xl bg-accent text-lg font-semibold text-slate-950 disabled:opacity-40"
      >
        Valider la série
      </button>

      {clavier && (
        <ClavierNumerique
          titre={clavier === 'poids' ? 'Poids (kg)' : 'Répétitions'}
          valeurInitiale={clavier === 'poids' ? poidsKg : reps}
          autoriserDecimales={clavier === 'poids'}
          onValider={(valeur) => {
            if (clavier === 'poids') onChangerPoids(valeur)
            else onChangerReps(Math.round(valeur))
            setClavier(null)
          }}
          onFermer={() => setClavier(null)}
        />
      )}
    </div>
  )
}
