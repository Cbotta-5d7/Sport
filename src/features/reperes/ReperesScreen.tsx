import { useLiveQuery } from 'dexie-react-hooks'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { db } from '../../db/schema'
import type { Exercice } from '../../db/types'
import { derniereSeanceExercicePourExercice } from '../../db/queries'
import { chargeEt1RMParSeance, type PointChargeRM } from '../../db/graphiques'
import { joursDepuis } from '../../utils/dates'

const AXE_STYLE = { fontSize: 11, fill: '#64748b' }
const TOOLTIP_STYLE = { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }

interface RepereAvecDonnees {
  exercice: Exercice
  courbe: PointChargeRM[]
  joursDepuisDerniere: number | null
}

interface Props {
  onRetour: () => void
}

export function ReperesScreen({ onRetour }: Props) {
  const reperes = useLiveQuery(async () => {
    const exercices = (await db.exercices.toArray()).filter((e) => e.estRepere && !e.archive)
    const resultats: RepereAvecDonnees[] = []
    for (const exo of exercices) {
      const courbe = await chargeEt1RMParSeance(exo.id)
      const derniere = await derniereSeanceExercicePourExercice(exo.id)
      resultats.push({
        exercice: exo,
        courbe,
        joursDepuisDerniere: derniere ? joursDepuis(derniere.seance.date) : null,
      })
    }
    return resultats
  }, [], null)

  return (
    <div
      className="flex min-h-dvh flex-col px-4 pb-10"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onRetour}
          className="min-h-11 min-w-11 rounded-xl border border-slate-300 text-slate-600"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold">Exercices repères</h1>
      </header>

      {reperes && reperes.length === 0 && (
        <p className="text-sm text-slate-400">Aucun exercice repère. Marque-en depuis la fiche d'un exercice.</p>
      )}

      {reperes?.map(({ exercice, courbe, joursDepuisDerniere }) => (
        <div key={exercice.id} className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700">★ {exercice.nom}</h2>
            <span className="text-xs text-slate-400">{exercice.groupeMusculaire}</span>
          </div>
          {joursDepuisDerniere !== null && joursDepuisDerniere > 21 && (
            <p className="mb-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
              Tu perds ton fil de mesure sur ce groupe : pas travaillé depuis {joursDepuisDerniere} jours.
            </p>
          )}
          <div className="h-40 rounded-2xl border border-slate-200 bg-white p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={courbe}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={AXE_STYLE}
                  tickFormatter={(d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis tick={AXE_STYLE} width={30} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="chargeMax" name="Charge max" stroke="#f97316" dot={false} strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="score" name="Score de charge" stroke="#0284c7" dot={false} strokeWidth={2} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  )
}
