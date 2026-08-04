import { db } from '../db/schema'
import type { Reglage } from '../db/types'

export interface Snapshot {
  version: 1
  exportedAt: string
  tables: {
    exercices: unknown[]
    programmes: unknown[]
    programmeExercices: unknown[]
    seances: unknown[]
    seanceExercices: unknown[]
    series: unknown[]
    ciblesVolume: unknown[]
    poidsCorporel: unknown[]
    reglages: Reglage[]
  }
}

function reglageAPersister(cle: string): boolean {
  if (cle === 'githubJeton') return false
  if (cle.startsWith('minuteur')) return false
  if (cle.startsWith('previsionSeries:')) return false
  return true
}

export async function construireSnapshot(): Promise<Snapshot> {
  const [exercices, programmes, programmeExercices, seances, seanceExercices, series, ciblesVolume, poidsCorporel, reglages] =
    await Promise.all([
      db.exercices.toArray(),
      db.programmes.toArray(),
      db.programmeExercices.toArray(),
      db.seances.toArray(),
      db.seanceExercices.toArray(),
      db.series.toArray(),
      db.ciblesVolume.toArray(),
      db.poidsCorporel.toArray(),
      db.reglages.toArray(),
    ])

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: {
      exercices,
      programmes,
      programmeExercices,
      seances,
      seanceExercices,
      series,
      ciblesVolume,
      poidsCorporel,
      reglages: reglages.filter((r) => reglageAPersister(r.cle)),
    },
  }
}

export async function appliquerSnapshot(snapshot: Snapshot): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.exercices,
      db.programmes,
      db.programmeExercices,
      db.seances,
      db.seanceExercices,
      db.series,
      db.ciblesVolume,
      db.poidsCorporel,
      db.reglages,
    ],
    async () => {
      const jetonActuel = await db.reglages.get('githubJeton')

      await Promise.all([
        db.exercices.clear(),
        db.programmes.clear(),
        db.programmeExercices.clear(),
        db.seances.clear(),
        db.seanceExercices.clear(),
        db.series.clear(),
        db.ciblesVolume.clear(),
        db.poidsCorporel.clear(),
        db.reglages.clear(),
      ])

      await Promise.all([
        db.exercices.bulkAdd(snapshot.tables.exercices as never[]),
        db.programmes.bulkAdd(snapshot.tables.programmes as never[]),
        db.programmeExercices.bulkAdd(snapshot.tables.programmeExercices as never[]),
        db.seances.bulkAdd(snapshot.tables.seances as never[]),
        db.seanceExercices.bulkAdd(snapshot.tables.seanceExercices as never[]),
        db.series.bulkAdd(snapshot.tables.series as never[]),
        db.ciblesVolume.bulkAdd(snapshot.tables.ciblesVolume as never[]),
        db.poidsCorporel.bulkAdd(snapshot.tables.poidsCorporel as never[]),
        db.reglages.bulkAdd(snapshot.tables.reglages),
      ])

      if (jetonActuel) {
        await db.reglages.put(jetonActuel)
      }
    },
  )
}
