import { useEffect, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { db } from '../../db/schema'
import type { Exercice } from '../../db/types'
import { derniereSeanceExercicePourExercice } from '../../db/queries'
import { chargeEt1RMParSemaine, type PointChargeRM } from '../../db/graphiques'
import { joursDepuis } from '../../utils/dates'

const AXE_STYLE = { fontSize: 11, fill: '#64748b' }
const TOOLTIP_STYLE = { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }

interface RepereAvecDonnees {
  exercice: Exercice
  courbe: PointChargeRM[]
  joursDepuisDerniere: number | null
}

interface Props {
  onRetour: () => void
}

export function ReperesScreen({ onRetour }: Props) {
  const [reperes, setReperes] = useState<RepereAvecDonnees[] | null>(null)

  useEffect(() => {
    let annule = false
    async function charger() {
      const exercices = (await db.exercices.toArray()).filter((e) => e.estRepere && !e.archive)
      const resultats: RepereAvecDonnees[] = []
      for (const exo of exercices) {
        const courbe = await chargeEt1RMParSemaine(exo.id)
        const derniere = await derniereSeanceExercicePourExercice(exo.id)
        resultats.push({
          exercice: exo,
          courbe,
          joursDepuisDerniere: derniere ? joursDepuis(derniere.seance.date) : null,
        })
      }
      if (!annule) setReperes(resultats)
    }
    charger()
    return () => {
      annule = true
    }
  }, [])

  return (
    <div
      className="flex min-h-dvh flex-col px-4 pb-10"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onRetour}
          className="min-h-11 min-w-11 rounded-lg border border-slate-700 text-slate-300"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold">Exercices repères</h1>
      </header>

      {reperes && reperes.length === 0 && (
        <p className="text-sm text-slate-500">Aucun exercice repère. Marque-en depuis la fiche d'un exercice.</p>
      )}

      {reperes?.map(({ exercice, courbe, joursDepuisDerniere }) => (
        <div key={exercice.id} className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-200">★ {exercice.nom}</h2>
            <span className="text-xs text-slate-500">{exercice.groupeMusculaire}</span>
          </div>
          {joursDepuisDerniere !== null && joursDepuisDerniere > 21 && (
            <p className="mb-2 rounded-lg border border-amber-700 bg-amber-950/40 px-3 py-1.5 text-xs text-amber-300">
              Tu perds ton fil de mesure sur ce groupe : pas travaillé depuis {joursDepuisDerniere} jours.
            </p>
          )}
          <div className="h-40 rounded-xl border border-slate-800 bg-slate-900 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={courbe}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="semaine" tick={AXE_STYLE} />
                <YAxis tick={AXE_STYLE} width={30} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="chargeMax" name="Charge max" stroke="#f97316" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="rm1" name="1RM estimé" stroke="#38bdf8" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  )
}
