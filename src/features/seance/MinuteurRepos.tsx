import { useMinuteurRepos } from '../../hooks/useMinuteurRepos'
import { ajusterMinuteur, arreterMinuteur } from '../../db/minuteur'
import { db } from '../../db/schema'

const RAYON = 26
const CIRCONFERENCE = 2 * Math.PI * RAYON

export function MinuteurRepos() {
  const etat = useMinuteurRepos()
  if (!etat) return null

  const progression = etat.dureeSec > 0 ? 1 - etat.secondesRestantes / etat.dureeSec : 1
  const offset = CIRCONFERENCE * (1 - Math.min(1, Math.max(0, progression)))
  const minutes = Math.floor(etat.secondesRestantes / 60)
  const secondes = etat.secondesRestantes % 60

  async function passer() {
    const serie = await db.series.get(etat!.serieId)
    if (serie) {
      const reposReel = Math.max(0, etat!.dureeSec - etat!.secondesRestantes)
      await db.series.update(serie.id, { reposReelSec: reposReel })
    }
    await arreterMinuteur()
  }

  return (
    <div className="flex items-center justify-center gap-4 border-t border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
      <button
        type="button"
        onClick={() => ajusterMinuteur(-15)}
        className="flex min-h-14 min-w-14 items-center justify-center rounded-full border border-slate-700 text-slate-200"
      >
        −15s
      </button>

      <div className="relative flex h-16 w-16 items-center justify-center">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <circle cx="32" cy="32" r={RAYON} fill="none" stroke="#1e293b" strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r={RAYON}
            fill="none"
            stroke={etat.termine ? '#f87171' : '#f97316'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCONFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute text-sm font-semibold text-slate-100">
          {minutes}:{String(secondes).padStart(2, '0')}
        </span>
      </div>

      <button
        type="button"
        onClick={() => ajusterMinuteur(15)}
        className="flex min-h-14 min-w-14 items-center justify-center rounded-full border border-slate-700 text-slate-200"
      >
        +15s
      </button>

      <button
        type="button"
        onClick={passer}
        className="min-h-14 rounded-xl bg-slate-800 px-4 text-slate-200"
      >
        Passer
      </button>
    </div>
  )
}
