import { OPTIONS_RIR } from '../../db/rir'

interface Props {
  valeur: number | null
  onChoisir: (valeur: number) => void
}

export function SelecteurRIR({ valeur, onChoisir }: Props) {
  return (
    <div className="flex gap-2">
      {OPTIONS_RIR.map((option) => (
        <button
          key={option.valeur}
          type="button"
          onClick={() => onChoisir(option.valeur)}
          className={`min-h-14 flex-1 rounded-xl border-2 text-sm font-medium ${
            valeur === option.valeur
              ? 'border-accent bg-accent text-slate-950'
              : 'border-slate-700 text-slate-300'
          }`}
        >
          {option.libelle}
        </button>
      ))}
    </div>
  )
}
