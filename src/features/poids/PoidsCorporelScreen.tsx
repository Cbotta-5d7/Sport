import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { db } from '../../db/schema'
import { poidsCorporelAvecMoyenne, type PointPoidsCorporel } from '../../db/graphiques'
import { vitessePriseDeMasse } from '../../db/dashboard'
import { nowIso } from '../../utils/dates'
import { formatKg } from '../../utils/nombres'
import { ClavierNumerique } from '../seance/ClavierNumerique'

const AXE_STYLE = { fontSize: 11, fill: '#64748b' }
const TOOLTIP_STYLE = { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }

interface Props {
  onRetour: () => void
}

export function PoidsCorporelScreen({ onRetour }: Props) {
  const [clavierOuvert, setClavierOuvert] = useState(false)
  const [courbe, setCourbe] = useState<PointPoidsCorporel[]>([])
  const [vitesse, setVitesse] = useState<number | null>(null)

  const mesures = useLiveQuery(() => db.poidsCorporel.orderBy('date').reverse().limit(15).toArray(), [], [])

  useEffect(() => {
    let annule = false
    Promise.all([poidsCorporelAvecMoyenne(), vitessePriseDeMasse(new Date())]).then(([c, v]) => {
      if (annule) return
      setCourbe(c.slice(-90))
      setVitesse(v)
    })
    return () => {
      annule = true
    }
  }, [mesures])

  async function ajouter(poidsKg: number) {
    await db.poidsCorporel.add({ date: nowIso(), poidsKg })
    setClavierOuvert(false)
  }

  const dernierPoids = mesures[0]?.poidsKg ?? 80

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
        <h1 className="text-xl font-semibold">Poids de corps</h1>
      </header>

      <button
        type="button"
        onClick={() => setClavierOuvert(true)}
        className="mb-4 min-h-14 rounded-xl bg-accent text-lg font-semibold text-slate-950"
      >
        + Saisir mon poids
      </button>

      {vitesse !== null && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            vitesse >= 200 && vitesse <= 400
              ? 'border-emerald-700 bg-emerald-950 text-emerald-300'
              : 'border-amber-700 bg-amber-950 text-amber-300'
          }`}
        >
          Vitesse de prise de masse : {Math.round(vitesse)} g/semaine (cible 200 à 400 g)
        </div>
      )}

      <div className="mb-6 h-48 rounded-xl border border-slate-800 bg-slate-900 p-2">
        {courbe.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-slate-500">Aucune mesure.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={courbe}>
              <CartesianGrid stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" tick={AXE_STYLE} tickFormatter={(d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} />
              <YAxis tick={AXE_STYLE} width={35} domain={['dataMin - 1', 'dataMax + 1']} tickFormatter={(v: number) => formatKg(v)} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="poidsKg" name="Poids" stroke="#334155" dot={false} strokeWidth={1} />
              <Line type="monotone" dataKey="moyenne7" name="Moyenne 7j" stroke="#f97316" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-400">Dernières mesures</h2>
      <div className="flex flex-col gap-2">
        {mesures.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2 text-sm">
            <span className="text-slate-300">{new Date(m.date).toLocaleDateString('fr-FR')}</span>
            <span className="text-slate-100">{formatKg(m.poidsKg)} kg</span>
            <button type="button" onClick={() => db.poidsCorporel.delete(m.id)} className="min-h-8 min-w-8 text-slate-500">
              ✕
            </button>
          </div>
        ))}
      </div>

      {clavierOuvert && (
        <ClavierNumerique
          titre="Poids (kg)"
          valeurInitiale={dernierPoids}
          autoriserDecimales
          onValider={ajouter}
          onFermer={() => setClavierOuvert(false)}
        />
      )}
    </div>
  )
}
