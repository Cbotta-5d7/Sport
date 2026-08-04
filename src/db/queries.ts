import { db } from './schema'
import { ordrePriorite } from './types'
import type { Exercice, GroupeMusculaire, Seance, SeanceExercice, Serie } from './types'
import { estDansSemaine, joursDepuis } from '../utils/dates'
import { serieEstEfficace } from './rir'

export interface EtatGroupe {
  groupe: GroupeMusculaire
  derniereDateIso: string | null
  joursDepuisDerniere: number | null
  cibleSeriesSemaine: number
  cibleSeancesSemaine: number
  seriesEfficacesSemaine: number
}

async function exercicesIdsParGroupe(groupe: GroupeMusculaire): Promise<number[]> {
  const exercices = await db.exercices.where('groupeMusculaire').equals(groupe).toArray()
  return exercices.map((e) => e.id!).filter((id) => id !== undefined)
}

export async function derniereSeanceTerminee(groupe: GroupeMusculaire): Promise<Seance | null> {
  const idsExercices = await exercicesIdsParGroupe(groupe)
  if (idsExercices.length === 0) return null

  const seances = await db.seances
    .where('statut')
    .equals('terminee')
    .reverse()
    .sortBy('date')

  for (const seance of seances.reverse()) {
    const seanceExercices = await db.seanceExercices
      .where('seanceId')
      .equals(seance.id!)
      .toArray()
    if (seanceExercices.some((se) => idsExercices.includes(se.exerciceId))) {
      return seance
    }
  }
  return null
}

export async function seriesEfficacesSemaine(groupe: GroupeMusculaire): Promise<number> {
  const idsExercices = await exercicesIdsParGroupe(groupe)
  if (idsExercices.length === 0) return 0

  const seanceExercices = await db.seanceExercices
    .where('exerciceId')
    .anyOf(idsExercices)
    .toArray()
  const idsSeanceExercices = seanceExercices.map((se) => se.id!)
  if (idsSeanceExercices.length === 0) return 0

  const seancesParId = new Map<number, Seance>()
  for (const se of seanceExercices) {
    if (!seancesParId.has(se.seanceId)) {
      const seance = await db.seances.get(se.seanceId)
      if (seance) seancesParId.set(se.seanceId, seance)
    }
  }

  const series = await db.series.where('seanceExerciceId').anyOf(idsSeanceExercices).toArray()

  let total = 0
  for (const s of series) {
    if (!serieEstEfficace(s)) continue
    const se = seanceExercices.find((x) => x.id === s.seanceExerciceId)
    if (!se) continue
    const seance = seancesParId.get(se.seanceId)
    if (!seance || !estDansSemaine(seance.date)) continue
    total += 1
  }
  return total
}

export async function etatsGroupes(): Promise<EtatGroupe[]> {
  const cibles = (await db.ciblesVolume.toArray()).sort(
    (a, b) => ordrePriorite(a.groupeMusculaire) - ordrePriorite(b.groupeMusculaire),
  )
  const resultats: EtatGroupe[] = []

  for (const cible of cibles) {
    const derniere = await derniereSeanceTerminee(cible.groupeMusculaire)
    const efficaces = await seriesEfficacesSemaine(cible.groupeMusculaire)
    resultats.push({
      groupe: cible.groupeMusculaire,
      derniereDateIso: derniere?.date ?? null,
      joursDepuisDerniere: derniere ? joursDepuis(derniere.date) : null,
      cibleSeriesSemaine: cible.seriesCibleSemaine,
      cibleSeancesSemaine: cible.seancesCibleSemaine,
      seriesEfficacesSemaine: efficaces,
    })
  }
  return resultats
}

export async function exercicesActifsParGroupes(groupes: GroupeMusculaire[]): Promise<Exercice[]> {
  const exercices = await db.exercices
    .where('groupeMusculaire')
    .anyOf(groupes)
    .toArray()
  return exercices.filter((e) => !e.archive).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

export async function idsExercicesDerniereSeance(groupes: GroupeMusculaire[]): Promise<Set<number>> {
  const resultat = new Set<number>()
  for (const groupe of groupes) {
    const derniere = await derniereSeanceTerminee(groupe)
    if (!derniere) continue
    const idsGroupe = new Set(await exercicesIdsParGroupe(groupe))
    const seanceExercices = await db.seanceExercices
      .where('seanceId')
      .equals(derniere.id!)
      .toArray()
    for (const se of seanceExercices) {
      if (idsGroupe.has(se.exerciceId)) resultat.add(se.exerciceId)
    }
  }
  return resultat
}

export async function seanceEnCours(): Promise<Seance | null> {
  const seances = await db.seances.where('statut').equals('en_cours').toArray()
  return seances[0] ?? null
}

export interface SeanceExerciceDetail {
  seance: Seance
  seanceExercice: SeanceExercice
  series: Serie[]
}

export async function derniereSeanceExercicePourExercice(
  exerciceId: number,
  exclureSeanceId?: number,
): Promise<SeanceExerciceDetail | null> {
  const candidats = await db.seanceExercices.where('exerciceId').equals(exerciceId).toArray()

  let meilleur: { seance: Seance; se: SeanceExercice } | null = null
  for (const se of candidats) {
    if (se.seanceId === exclureSeanceId) continue
    const seance = await db.seances.get(se.seanceId)
    if (!seance || seance.statut !== 'terminee') continue
    if (!meilleur || seance.date > meilleur.seance.date) {
      meilleur = { seance, se }
    }
  }
  if (!meilleur) return null

  const series = (await db.series.where('seanceExerciceId').equals(meilleur.se.id).toArray()).sort(
    (a, b) => a.numeroSerie - b.numeroSerie,
  )
  return { seance: meilleur.seance, seanceExercice: meilleur.se, series }
}

export async function historiqueExercice(
  exerciceId: number,
  limite = 12,
): Promise<{ seance: Seance; series: Serie[] }[]> {
  const seanceExercices = await db.seanceExercices.where('exerciceId').equals(exerciceId).toArray()
  const resultats: { seance: Seance; series: Serie[] }[] = []

  for (const se of seanceExercices) {
    const seance = await db.seances.get(se.seanceId)
    if (!seance || seance.statut !== 'terminee') continue
    const series = (await db.series.where('seanceExerciceId').equals(se.id).toArray()).sort(
      (a, b) => a.numeroSerie - b.numeroSerie,
    )
    resultats.push({ seance, series })
  }

  resultats.sort((a, b) => b.seance.date.localeCompare(a.seance.date))
  return resultats.slice(0, limite)
}

export interface SeanceExerciceAvecExercice extends SeanceExercice {
  exercice: Exercice
}

export async function seanceExercicesAvecDetails(seanceId: number): Promise<SeanceExerciceAvecExercice[]> {
  const liste = await db.seanceExercices.where('seanceId').equals(seanceId).sortBy('ordre')
  const resultats: SeanceExerciceAvecExercice[] = []
  for (const se of liste) {
    const exercice = await db.exercices.get(se.exerciceId)
    if (exercice) resultats.push({ ...se, exercice })
  }
  return resultats
}

export async function seriesPourSeanceExercice(seanceExerciceId: number): Promise<Serie[]> {
  return (await db.series.where('seanceExerciceId').equals(seanceExerciceId).toArray()).sort(
    (a, b) => a.numeroSerie - b.numeroSerie,
  )
}
