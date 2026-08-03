export type GroupeMusculaire =
  | 'Pectoraux'
  | 'Dos'
  | 'Épaules'
  | 'Biceps'
  | 'Triceps'
  | 'Cuisses'
  | 'Mollets'
  | 'Abdominaux'

export const GROUPES_MUSCULAIRES: GroupeMusculaire[] = [
  'Pectoraux',
  'Dos',
  'Épaules',
  'Biceps',
  'Triceps',
  'Cuisses',
  'Mollets',
  'Abdominaux',
]

export type TypeCharge = 'barre' | 'haltères' | 'machine' | 'poulie' | 'poids du corps' | 'lestée'

export const TYPES_CHARGE: TypeCharge[] = [
  'barre',
  'haltères',
  'machine',
  'poulie',
  'poids du corps',
  'lestée',
]

export type IncrementKg = 0.5 | 1 | 1.25 | 2.5 | 5

export const INCREMENTS_KG: IncrementKg[] = [0.5, 1, 1.25, 2.5, 5]

export type TypeSerie = 'échauffement' | 'normale' | 'dégressive' | 'échec'

export type StatutSeance = 'en_cours' | 'terminee'

export type StatutSeanceExercice = 'a_faire' | 'en_cours' | 'fait' | 'passe'

export interface Exercice {
  id?: number
  nom: string
  groupeMusculaire: GroupeMusculaire
  typeCharge: TypeCharge
  incrementKg: IncrementKg
  reposDefautSec: number
  repsCibleMin: number
  repsCibleMax: number
  estRepere: boolean
  archive: boolean
  notes: string
}

export interface Programme {
  id?: number
  nom: string
  ordre: number
  archive: boolean
}

export interface ProgrammeExercice {
  id?: number
  programmeId: number
  exerciceId: number
  ordre: number
  seriesCibles: number
  repsCibleMin: number
  repsCibleMax: number
  reposSec: number
}

export interface Seance {
  id?: number
  date: string
  dateDebut: string
  dateFin: string | null
  dureeSec: number
  statut: StatutSeance
  notes: string
}

export interface SeanceExercice {
  id?: number
  seanceId: number
  exerciceId: number
  ordre: number
  statut: StatutSeanceExercice
  remplaceExerciceId: number | null
}

export interface Serie {
  id?: number
  seanceExerciceId: number
  numeroSerie: number
  poidsKg: number
  reps: number
  type: TypeSerie
  rir: number | null
  reposReelSec: number | null
  validee: boolean
  estRecord: boolean
  horodatage: string
}

export interface CibleVolume {
  groupeMusculaire: GroupeMusculaire
  seriesCibleSemaine: number
  seancesCibleSemaine: number
}

export interface PoidsCorporel {
  id?: number
  date: string
  poidsKg: number
}

export interface Reglage {
  cle: string
  valeur: string
}
