import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  radarGroupes,
  carteChaleurSeances,
  poidsCorporelAvecMoyenne,
  volumeTotalParSemaine,
  type PointRadarGroupe,
  type JourChaleur,
  type PointPoidsCorporel,
  type PointVolumeSemaine,
} from '../../db/graphiques'
import { formatKg } from '../../utils/nombres'

const AXE_STYLE = { fontSize: 11, fill: '#64748b' }
const TOOLTIP_STYLE = { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }

interface Props {
  onRetour: () => void
}

function CarteChaleur({ jours }: { jours: JourChaleur[] }) {
  const max = Math.max(1, ...jours.map((j) => j.intensite))
  const semaines: JourChaleur[][] = []
  for (let i = 0; i < jours.length; i += 7) semaines.push(jours.slice(i, i + 7))

  function couleur(intensite: number): string {
    if (intensite === 0) return '#e2e8f0'
    const ratio = intensite / max
    if (ratio > 0.66) return '#c2410c'
    if (ratio > 0.33) return '#f97316'
    return '#fed7aa'
  }

  return (
    <div className="flex gap-1 overflow-x-auto">
      {semaines.map((semaine, i) => (
        <div key={i} className="flex flex-col gap-1">
          {semaine.map((j) => (
            <div
              key={j.date}
              title={`${j.date} : ${j.intensite} séance(s)`}
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: couleur(j.intensite) }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function VueGlobaleScreen({ onRetour }: Props) {
  const [radar, setRadar] = useState<PointRadarGroupe[]>([])
  const [chaleur, setChaleur] = useState<JourChaleur[]>([])
  const [poids, setPoids] = useState<PointPoidsCorporel[]>([])
  const [volume, setVolume] = useState<PointVolumeSemaine[]>([])

  useEffect(() => {
    let annule = false
    Promise.all([radarGroupes(), carteChaleurSeances(), poidsCorporelAvecMoyenne(), volumeTotalParSemaine()]).then(
      ([r, c, p, v]) => {
        if (annule) return
        setRadar(r)
        setChaleur(c)
        setPoids(p.slice(-60))
        setVolume(v)
      },
    )
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
          className="min-h-11 min-w-11 rounded-xl border border-slate-300 text-slate-600"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold">Vue globale</h1>
      </header>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Radar des 8 groupes, réalisé contre cible</h2>
      <div className="mb-6 h-56 rounded-2xl border border-slate-200 bg-white p-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radar}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="groupe" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <PolarRadiusAxis tick={{ fontSize: 9, fill: '#64748b' }} />
            <Radar name="Cible" dataKey="cible" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.4} />
            <Radar name="Réalisé" dataKey="realise" stroke="#f97316" fill="#f97316" fillOpacity={0.4} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Carte de chaleur des séances (12 semaines)</h2>
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-3">
        <CarteChaleur jours={chaleur} />
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Poids de corps, moyenne glissante 7 jours</h2>
      <div className="mb-6 h-44 rounded-2xl border border-slate-200 bg-white p-2">
        {poids.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-slate-400">Aucune mesure.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={poids}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" tick={AXE_STYLE} tickFormatter={(d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} />
              <YAxis tick={AXE_STYLE} width={35} domain={['dataMin - 1', 'dataMax + 1']} tickFormatter={(v: number) => formatKg(v)} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="poidsKg" name="Poids" stroke="#94a3b8" dot={false} strokeWidth={1} />
              <Line type="monotone" dataKey="moyenne7" name="Moyenne 7j" stroke="#f97316" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Volume total par semaine</h2>
      <div className="mb-6 h-44 rounded-2xl border border-slate-200 bg-white p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={volume}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="semaine" tick={AXE_STYLE} />
            <YAxis tick={AXE_STYLE} width={40} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="volume" name="Volume (kg)" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
