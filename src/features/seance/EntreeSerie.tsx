import { useState } from 'react'
import { useAppuiRepete } from '../../hooks/useAppuiRepete'
import { ClavierNumerique } from './ClavierNumerique'
import { SelecteurRIR } from './SelecteurRIR'
import { formatKg } from '../../utils/nombres'

interface Props {
  numeroSerie: number
  poidsKg: number
  reps: number
  incrementKg: number
  rir: number | null
  onChangerPoids: (poids: number) => void
  onChangerReps: (reps: number) => void
  onChoisirRir: (rir: number) => void
  onValider: () => void
}

export function EntreeSerie({
  numeroSerie,
  poidsKg,
  reps,
  incrementKg,
  rir,
  onChangerPoids,
  onChangerReps,
  onChoisirRir,
  onValider,
}: Props) {
  const [clavier, setClavier] = useState<'poids' | 'reps' | null>(null)

  const appuiMoinsPoids = useAppuiRepete(() => onChangerPoids(Math.max(0, poidsKg - incrementKg)))
  const appuiPlusPoids = useAppuiRepete(() => onChangerPoids(poidsKg + incrementKg))
  const appuiMoinsReps = useAppuiRepete(() => onChangerReps(Math.max(0, reps - 1)))
  const appuiPlusReps = useAppuiRepete(() => onChangerReps(reps + 1))

  const rirManquant = rir === null

  return (
    <div
      className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 pt-3"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
    >
      <p className="text-center text-sm text-slate-400">Série {numeroSerie}</p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          {...appuiMoinsPoids}
          className="flex min-h-14 min-w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-800 select-none"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setClavier('poids')}
          className="flex min-h-14 flex-1 flex-col items-center justify-center rounded-2xl border border-slate-300"
        >
          <span className="text-2xl font-semibold text-slate-900">{formatKg(poidsKg)} kg</span>
        </button>
        <button
          type="button"
          {...appuiPlusPoids}
          className="flex min-h-14 min-w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-800 select-none"
        >
          +
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          {...appuiMoinsReps}
          className="flex min-h-14 min-w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-800 select-none"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setClavier('reps')}
          className="flex min-h-14 flex-1 flex-col items-center justify-center rounded-2xl border border-slate-300"
        >
          <span className="text-2xl font-semibold text-slate-900">{reps} reps</span>
        </button>
        <button
          type="button"
          {...appuiPlusReps}
          className="flex min-h-14 min-w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-800 select-none"
        >
          +
        </button>
      </div>

      <div>
        <p className="mb-1 text-xs text-slate-400">RIR (répétitions en réserve)</p>
        <SelecteurRIR valeur={rir} onChoisir={onChoisirRir} />
      </div>

      <button
        type="button"
        onClick={onValider}
        disabled={rirManquant}
        className="min-h-14 rounded-2xl bg-accent text-lg font-semibold text-slate-950 disabled:opacity-40"
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
