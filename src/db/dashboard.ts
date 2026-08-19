import { db } from './schema'
import { ordrePriorite } from './types'
import type { GroupeMusculaire } from './types'
import { estDansSemaine, debutSemaine } from '../utils/dates'

export interface StatGroupeSemaine {
  groupe: GroupeMusculaire
  cibleSeries: number
  totalSeries: number
}

export interface TableauBordSemaine {
  groupes: StatGroupeSemaine[]
  seancesFaites: number
  seancesCible: number
  seancesRestantes: number
  totalRealise: number
  totalCible: number
  totalReste: number
}

async function chargerDonneesSemaine(reference: Date) {
  const [ciblesBrutes, tousExercices, toutesSeances, tousSeanceExercices] = await Promise.all([
    db.ciblesVolume.toArray(),
    db.exercices.toArray(),
    db.seances.toArray(),
    db.seanceExercices.toArray(),
  ])
  const cibles = ciblesBrutes.sort(
    (a, b) => ordrePriorite(a.groupeMusculaire) - ordrePriorite(b.groupeMusculaire),
  )

  const seancesSemaine = toutesSeances.filter((s) => estDansSemaine(s.date, reference))
  const seanceIdsSemaine = new Set(seancesSemaine.map((s) => s.id))
  const seanceExercicesSemaine = tousSeanceExercices.filter((se) => seanceIdsSemaine.has(se.seanceId))
  const idsSE = seanceExercicesSemaine.map((se) => se.id)
  const seriesSemaine = idsSE.length ? await db.series.where('seanceExerciceId').anyOf(idsSE).toArray() : []

  return { cibles, tousExercices, seancesSemaine, seanceExercicesSemaine, seriesSemaine }
}

export async function tableauBordSemaine(reference = new Date()): Promise<TableauBordSemaine> {
  const { cibles, tousExercices, seancesSemaine, seanceExercicesSemaine, seriesSemaine } =
    await chargerDonneesSemaine(reference)

  const exerciceParId = new Map(tousExercices.map((e) => [e.id, e]))
  const seParId = new Map(seanceExercicesSemaine.map((se) => [se.id, se]))

  const parGroupe = new Map<GroupeMusculaire, { total: number }>()
  for (const c of cibles) parGroupe.set(c.groupeMusculaire, { total: 0 })

  for (const s of seriesSemaine) {
    if (!s.validee || s.type === 'échauffement') continue
    const se = seParId.get(s.seanceExerciceId)
    if (!se) continue
    const exo = exerciceParId.get(se.exerciceId)
    if (!exo) continue
    const stats = parGroupe.get(exo.groupeMusculaire)
    if (!stats) continue
    stats.total += 1
  }

  const seancesCibleReglage = await db.reglages.get('seancesCibleParSemaine')
  const seancesCible = Number(seancesCibleReglage?.valeur ?? 3)
  const seancesFaites = seancesSemaine.filter((s) => s.statut === 'terminee').length
  const seancesRestantes = Math.max(0, seancesCible - seancesFaites)

  const groupes: StatGroupeSemaine[] = cibles.map((c) => {
    const stats = parGroupe.get(c.groupeMusculaire) ?? { total: 0 }
    return {
      groupe: c.groupeMusculaire,
      cibleSeries: c.seriesCibleSemaine,
      totalSeries: stats.total,
    }
  })

  const totalRealise = groupes.reduce((a, g) => a + g.totalSeries, 0)
  const totalCible = groupes.reduce((a, g) => a + g.cibleSeries, 0)
  const totalReste = groupes.reduce((a, g) => a + Math.max(0, g.cibleSeries - g.totalSeries), 0)

  return { groupes, seancesFaites, seancesCible, seancesRestantes, totalRealise, totalCible, totalReste }
}

export function debutSemaineActuelle(reference = new Date()): Date {
  return debutSemaine(reference)
}

export interface RecapSemaine {
  debut: Date
  totalRealise: number
  totalCible: number
  seancesFaites: number
}

export async function recapitulatifQuatreSemaines(reference = new Date()): Promise<RecapSemaine[]> {
  const resultats: RecapSemaine[] = []
  for (let i = 0; i < 5; i++) {
    const ref = new Date(reference)
    ref.setDate(ref.getDate() - i * 7)
    const t = await tableauBordSemaine(ref)
    resultats.push({
      debut: debutSemaine(ref),
      totalRealise: t.totalRealise,
      totalCible: t.totalCible,
      seancesFaites: t.seancesFaites,
    })
  }
  return resultats
}
