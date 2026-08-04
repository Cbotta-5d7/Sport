import { useEffect, useState } from 'react'
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

export function BlocDerniereFois({ exerciceId, exerciceRemplaceId, seriesActuelles }: Props) {
  const [mode, setMode] = useState<Mode>('cache')
  const [dernieresSeries, setDernieresSeries] = useState<Serie[] | null>(null)
  const [dateDerniere, setDateDerniere] = useState<string | null>(null)
  const [estReference, setEstReference] = useState(false)
  const [historique, setHistorique] = useState<{ seance: { date: string }; series: Serie[] }[] | null>(null)
  const [aHistorique, setAHistorique] = useState<boolean | null>(null)
  const [idPourHistorique, setIdPourHistorique] = useState<number | null>(null)

  useEffect(() => {
    let annule = false
    async function charger() {
      const propre = await derniereSeanceExercicePourExercice(exerciceId)
      if (annule) return
      if (propre) {
        setAHistorique(true)
        setEstReference(false)
        setDernieresSeries(propre.series)
        setDateDerniere(propre.seance.date)
        setIdPourHistorique(exerciceId)
        return
      }
      if (exerciceRemplaceId) {
        const reference = await derniereSeanceExercicePourExercice(exerciceRemplaceId)
        if (annule) return
        if (reference) {
          setAHistorique(true)
          setEstReference(true)
          setDernieresSeries(reference.series)
          setDateDerniere(reference.seance.date)
          setIdPourHistorique(exerciceRemplaceId)
          return
        }
      }
      setAHistorique(false)
    }
    charger()
    return () => {
      annule = true
    }
  }, [exerciceId, exerciceRemplaceId])

  async function basculer() {
    if (mode === 'cache') {
      setMode('resume')
    } else if (mode === 'resume') {
      if (idPourHistorique !== null) {
        const h = await historiqueExercice(idPourHistorique)
        setHistorique(h)
      }
      setMode('historique')
    } else {
      setMode('cache')
    }
  }

  if (aHistorique === null) return null

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
