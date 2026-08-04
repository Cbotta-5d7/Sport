import { useState } from 'react'

interface Props {
  titre: string
  valeurInitiale: number
  autoriserDecimales: boolean
  onValider: (valeur: number) => void
  onFermer: () => void
}

const TOUCHES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫']

export function ClavierNumerique({ titre, valeurInitiale, autoriserDecimales, onValider, onFermer }: Props) {
  const [saisie, setSaisie] = useState(() => valeurInitiale.toString().replace('.', ','))

  function appuyerTouche(touche: string) {
    if (touche === '⌫') {
      setSaisie((s) => s.slice(0, -1))
      return
    }
    if (touche === ',') {
      if (!autoriserDecimales || saisie.includes(',')) return
      setSaisie((s) => (s === '' ? '0,' : `${s},`))
      return
    }
    setSaisie((s) => {
      if (s === '0') return touche
      return s + touche
    })
  }

  function valider() {
    const nombre = Number(saisie.replace(',', '.'))
    if (!Number.isFinite(nombre)) {
      onFermer()
      return
    }
    onValider(nombre)
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60" onClick={onFermer}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-2 text-sm text-slate-500">{titre}</p>
        <div className="mb-4 min-h-16 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-right text-3xl font-semibold text-slate-900">
          {saisie || '0'}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {TOUCHES.map((touche) => (
            <button
              key={touche}
              type="button"
              onClick={() => appuyerTouche(touche)}
              disabled={touche === ',' && !autoriserDecimales}
              className="min-h-14 rounded-2xl bg-slate-100 text-xl font-medium text-slate-800 disabled:opacity-30"
            >
              {touche}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={onFermer}
            className="min-h-14 flex-1 rounded-2xl border border-slate-300 text-slate-600"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={valider}
            className="min-h-14 flex-1 rounded-2xl bg-accent font-semibold text-slate-950"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
