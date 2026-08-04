import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { GROUPES_PAR_PRIORITE } from '../../db/types'

export function ReglagesVolume() {
  const cibles = useLiveQuery(() => db.ciblesVolume.toArray(), [], [])
  const parGroupe = new Map(cibles.map((c) => [c.groupeMusculaire, c]))

  async function modifier(groupe: (typeof GROUPES_PAR_PRIORITE)[number], champ: 'seriesCibleSemaine' | 'seancesCibleSemaine', delta: number) {
    const actuel = parGroupe.get(groupe)
    if (!actuel) return
    const nouvelleValeur = Math.max(0, actuel[champ] + delta)
    await db.ciblesVolume.update(groupe, { [champ]: nouvelleValeur })
  }

  return (
    <div className="flex flex-col gap-2">
      {GROUPES_PAR_PRIORITE.map((groupe) => {
        const cible = parGroupe.get(groupe)
        if (!cible) return null
        return (
          <div key={groupe} className="rounded-xl border border-slate-800 px-3 py-2">
            <p className="mb-1 text-sm text-slate-100">{groupe}</p>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>Séries/sem.</span>
                <button type="button" onClick={() => modifier(groupe, 'seriesCibleSemaine', -1)} className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700">−</button>
                <span className="w-5 text-center text-slate-100">{cible.seriesCibleSemaine}</span>
                <button type="button" onClick={() => modifier(groupe, 'seriesCibleSemaine', 1)} className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700">+</button>
              </div>
              <div className="flex items-center gap-2">
                <span>Passages/sem.</span>
                <button type="button" onClick={() => modifier(groupe, 'seancesCibleSemaine', -1)} className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700">−</button>
                <span className="w-5 text-center text-slate-100">{cible.seancesCibleSemaine}</span>
                <button type="button" onClick={() => modifier(groupe, 'seancesCibleSemaine', 1)} className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700">+</button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
