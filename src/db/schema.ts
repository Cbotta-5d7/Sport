import Dexie, { type EntityTable } from 'dexie'
import type {
  CibleVolume,
  Exercice,
  PoidsCorporel,
  Programme,
  ProgrammeExercice,
  Reglage,
  Seance,
  SeanceExercice,
  Serie,
} from './types'

export class MusculationDB extends Dexie {
  exercices!: EntityTable<Exercice, 'id'>
  programmes!: EntityTable<Programme, 'id'>
  programmeExercices!: EntityTable<ProgrammeExercice, 'id'>
  seances!: EntityTable<Seance, 'id'>
  seanceExercices!: EntityTable<SeanceExercice, 'id'>
  series!: EntityTable<Serie, 'id'>
  ciblesVolume!: EntityTable<CibleVolume, 'groupeMusculaire'>
  poidsCorporel!: EntityTable<PoidsCorporel, 'id'>
  reglages!: EntityTable<Reglage, 'cle'>

  constructor() {
    super('musculation-db')
    this.version(1).stores({
      exercices: '++id, nom, groupeMusculaire, archive, estRepere',
      programmes: '++id, ordre, archive',
      programmeExercices: '++id, programmeId, exerciceId, ordre',
      seances: '++id, date, statut',
      seanceExercices: '++id, seanceId, exerciceId, ordre, statut',
      series: '++id, seanceExerciceId, numeroSerie, horodatage',
      ciblesVolume: 'groupeMusculaire',
      poidsCorporel: '++id, date',
      reglages: 'cle',
    })
  }
}

export const db = new MusculationDB()
