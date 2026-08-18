import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Serie } from '../../db/types'
import { derniereSeanceExercicePourExercice, historiqueExercice } from '../../db/queries'
import { formatKg } from '../../utils/nombres'
import { formatDateLongueFR } from '../../utils/dates'

interface Props {
  exerciceId: number
  exerciceRemplaceId?: number | null
  seriesActuelles: Pick<Serie, 'poidsKg' | 'reps' | 'numeroSerie'>[]
}

type Mode = 'cache' | 'resume' | 'historique'

function Fleche({ actuel, precedent }: { actuel?: number; precedent: number }) {
  if (actuel === undefined) return null
  if (actuel > precedent) return <span className="text-emerald-600">▲</span>
  if (actuel < precedent) return <span className="text-red-600">▼</span>
  return <span className="text-slate-400">─</span>
}

interface InfoDerniereFois {
  aHistorique: boolean
  estReference: boolean
  dernieresSeries: Serie[] | null
  dateDerniere: string | null
  idPourHistorique: number | null
}

async function chargerInfo(exerciceId: number, exerciceRemplaceId?: number | null): Promise<InfoDerniereFois> {
  const propre = await derniereSeanceExercicePourExercice(exerciceId)
  if (propre) {
    return {
      aHistorique: true,
      estReference: false,
      dernieresSeries: propre.series,
      dateDerniere: propre.seance.date,
      idPourHistorique: exerciceId,
    }
  }
  if (exerciceRemplaceId) {
    const reference = await derniereSeanceExercicePourExercice(exerciceRemplaceId)
    if (reference) {
      return {
        aHistorique: true,
        estReference: true,
        dernieresSeries: reference.series,
        dateDerniere: reference.seance.date,
        idPourHistorique: exerciceRemplaceId,
      }
    }
  }
  return { aHistorique: false, estReference: false, dernieresSeries: null, dateDerniere: null, idPourHistorique: null }
}

export function BlocDerniereFois({ exerciceId, exerciceRemplaceId, seriesActuelles }: Props) {
  const [mode, setMode] = useState<Mode>('historique')

  const info = useLiveQuery(() => chargerInfo(exerciceId, exerciceRemplaceId), [exerciceId, exerciceRemplaceId], null)
  const idPourHistorique = info?.idPourHistorique ?? null
  const historique = useLiveQuery(
    () => (idPourHistorique !== null ? historiqueExercice(idPourHistorique) : Promise.resolve(null)),
    [idPourHistorique],
    null,
  )

  function basculer() {
    setMode((m) => (m === 'cache' ? 'resume' : m === 'resume' ? 'historique' : 'cache'))
  }

  if (info === null) return null
  const { aHistorique, estReference, dernieresSeries, dateDerniere } = info

  if (!aHistorique) {
    return <p className="text-sm text-slate-400">Première fois sur cet exercice.</p>
  }

  return (
    <div className={estReference ? 'opacity-60' : ''}>
      <button type="button" onClick={basculer} className="min-h-10 text-sm font-medium text-accent">
        {mode === 'cache' && (estReference ? 'Référence (ancien exercice) ▾' : 'Dernière fois ▾')}
        {mode === 'resume' && 'Historique complet ▾'}
        {mode === 'historique' && 'Réduire ▴'}
      </button>

      {mode === 'resume' && dernieresSeries && (
        <div className="mt-2 max-h-48 overflow-y-auto overscroll-contain rounded-2xl border border-slate-200">
          {dateDerniere && (
            <p className="sticky top-0 border-b border-slate-200 bg-white shadow-sm px-3 py-1.5 text-xs text-slate-400">
              {formatDateLongueFR(new Date(dateDerniere))}
            </p>
          )}
          <table className="w-full text-sm">
            <tbody>
              {dernieresSeries.map((s, i) => {
                const actuelle = estReference ? undefined : seriesActuelles[i]
                return (
                  <tr key={s.id} className="border-b border-slate-200 last:border-0">
                    <td className="px-3 py-2 text-slate-500">Série {s.numeroSerie}</td>
                    <td className="px-3 py-2 text-slate-800">
                      {formatKg(s.poidsKg)} kg x {s.reps}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Fleche actuel={actuelle?.poidsKg} precedent={s.poidsKg} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Fleche actuel={actuelle?.reps} precedent={s.reps} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {mode === 'historique' && historique && (
        <div className="mt-2 max-h-64 overflow-y-auto overscroll-contain flex flex-col gap-2 pr-0.5">
          {historique.map((h, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 px-3 py-2">
              <p className="mb-1 text-xs text-slate-400">{formatDateLongueFR(new Date(h.seance.date))}</p>
              <p className="text-sm text-slate-800">
                {h.series.map((s) => `${formatKg(s.poidsKg)}x${s.reps}`).join(', ')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
