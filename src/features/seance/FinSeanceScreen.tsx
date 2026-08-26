import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import type { Exercice, GroupeMusculaire, Seance, Serie } from '../../db/types'
import { seanceExercicesAvecDetails } from '../../db/queries'
import { tonnageTotal, estSerieDeTravail, variationPourcent } from '../../utils/calculs'
import { formatKg, formatPourcent } from '../../utils/nombres'
import { formatDuree } from '../../hooks/useChronometre'

interface Props {
  seanceId: number
  onFermer: () => void
}

interface RecapGroupe {
  groupe: GroupeMusculaire
  nombreSeries: number
  tonnage: number
}

interface RecordAffiche {
  exercice: string
  poidsKg: number
  reps: number
}

interface Recap {
  seance: Seance
  tonnageTotal: number
  parGroupe: RecapGroupe[]
  records: RecordAffiche[]
  variationTonnagePrecedente: number | null
}

async function construireRecap(seanceId: number): Promise<Recap | null> {
  const seance = await db.seances.get(seanceId)
  if (!seance) return null

  const seanceExercices = await seanceExercicesAvecDetails(seanceId)
  const parGroupeMap = new Map<GroupeMusculaire, { series: Serie[]; exercice: Exercice }[]>()
  const records: RecordAffiche[] = []
  let toutesLesSeries: Serie[] = []

  for (const se of seanceExercices) {
    const series = await db.series.where('seanceExerciceId').equals(se.id).toArray()
    toutesLesSeries = toutesLesSeries.concat(series)
    for (const s of series) {
      if (s.estRecord) records.push({ exercice: se.exercice.nom, poidsKg: s.poidsKg, reps: s.reps })
    }
    const liste = parGroupeMap.get(se.exercice.groupeMusculaire) ?? []
    liste.push({ series, exercice: se.exercice })
    parGroupeMap.set(se.exercice.groupeMusculaire, liste)
  }

  const parGroupe: RecapGroupe[] = Array.from(parGroupeMap.entries()).map(([groupe, entrees]) => {
    const series = entrees.flatMap((e) => e.series)
    return {
      groupe,
      nombreSeries: series.filter((s) => s.validee && estSerieDeTravail(s)).length,
      tonnage: tonnageTotal(series),
    }
  })

  const tonnageSeance = tonnageTotal(toutesLesSeries.filter(estSerieDeTravail))

  // "vs séance précédente" ne veut dire quelque chose que comparé à une séance de même composition
  // (mêmes groupes musculaires) : comparer le tonnage/série d'une séance Épaules à la dernière
  // séance tout court (ex : une séance Jambes bien plus lourde) donne un écart absurde et trompeur.
  const groupesActuels = new Set(seanceExercices.map((se) => se.exercice.groupeMusculaire))
  const precedentesTerminees = (await db.seances.where('statut').equals('terminee').toArray())
    .filter((s) => s.id !== seanceId && s.date < seance.date)
    .sort((a, b) => b.date.localeCompare(a.date))

  let avant: Seance | undefined
  for (const candidate of precedentesTerminees) {
    const sesExosCandidat = await seanceExercicesAvecDetails(candidate.id)
    const groupesCandidat = new Set(sesExosCandidat.map((se) => se.exercice.groupeMusculaire))
    const memeComposition =
      groupesCandidat.size === groupesActuels.size && [...groupesActuels].every((g) => groupesCandidat.has(g))
    if (memeComposition) {
      avant = candidate
      break
    }
  }

  let variationTonnagePrecedente: number | null = null
  if (avant) {
    const sesExosAvant = await seanceExercicesAvecDetails(avant.id)
    let seriesAvant: Serie[] = []
    for (const se of sesExosAvant) {
      seriesAvant = seriesAvant.concat(await db.series.where('seanceExerciceId').equals(se.id).toArray())
    }
    const travailAvant = seriesAvant.filter(estSerieDeTravail)
    const tonnageParSerieAvant = travailAvant.length > 0 ? tonnageTotal(travailAvant) / travailAvant.length : 0
    const travailActuel = toutesLesSeries.filter(estSerieDeTravail)
    const tonnageParSerieActuel = travailActuel.length > 0 ? tonnageSeance / travailActuel.length : 0
    variationTonnagePrecedente =
      tonnageParSerieAvant > 0 ? variationPourcent(tonnageParSerieActuel, tonnageParSerieAvant) : null
  }

  return { seance, tonnageTotal: tonnageSeance, parGroupe, records, variationTonnagePrecedente }
}

export function FinSeanceScreen({ seanceId, onFermer }: Props) {
  const recap = useLiveQuery(() => construireRecap(seanceId), [seanceId], null)

  if (!recap) {
    return <div className="flex min-h-dvh items-center justify-center text-slate-400">Chargement…</div>
  }

  return (
    <div
      className="flex min-h-dvh flex-col px-4 py-6"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
    >
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Séance terminée</h1>
      <p className="mb-6 text-slate-500">Durée {formatDuree(recap.seance.dureeSec)}</p>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm px-4 py-3">
        <p className="text-lg font-semibold text-slate-900">Tonnage total {formatKg(recap.tonnageTotal)} kg</p>
        {recap.variationTonnagePrecedente !== null && (
          <p
            className={
              recap.variationTonnagePrecedente > 2
                ? 'text-emerald-600'
                : recap.variationTonnagePrecedente < -2
                  ? 'text-red-600'
                  : 'text-slate-500'
            }
          >
            vs séance précédente {recap.variationTonnagePrecedente > 0 ? '+' : ''}
            {formatPourcent(recap.variationTonnagePrecedente)} %
          </p>
        )}
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Séries par groupe</h2>
      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200">
        {recap.parGroupe.map((g) => (
          <div key={g.groupe} className="flex justify-between border-b border-slate-200 px-4 py-2 last:border-0">
            <span className="text-slate-800">{g.groupe}</span>
            <span className="text-slate-500">
              {g.nombreSeries} séries · {formatKg(g.tonnage)} kg
            </span>
          </div>
        ))}
      </div>

      {recap.records.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-medium text-slate-500">Records battus</h2>
          <div className="mb-6 flex flex-col gap-2">
            {recap.records.map((r, i) => (
              <p key={i} className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                🏆 {r.exercice} · {formatKg(r.poidsKg)} kg x {r.reps}
              </p>
            ))}
          </div>
        </>
      )}

      {recap.seance.notes && (
        <div className="mb-6 rounded-2xl border border-slate-200 px-4 py-3">
          <p className="mb-1 text-sm font-medium text-slate-500">Note</p>
          <p className="text-slate-800">{recap.seance.notes}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onFermer}
        className="mt-auto min-h-14 rounded-2xl bg-accent text-lg font-semibold text-slate-950"
      >
        Retour à l'accueil
      </button>
    </div>
  )
}
