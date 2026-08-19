import { db } from './schema'
import type { CibleVolume, Exercice } from './types'

type NouvelExercice = Omit<Exercice, 'id'>

let compteurOrdre = 0

function exo(
  nom: string,
  groupeMusculaire: Exercice['groupeMusculaire'],
  typeCharge: Exercice['typeCharge'],
  incrementKg: Exercice['incrementKg'],
  repsCibleMin: number,
  repsCibleMax: number,
  reposDefautSec: number,
  seriesCibleDefaut: number,
  estRepere = false,
): NouvelExercice {
  return {
    nom,
    groupeMusculaire,
    typeCharge,
    incrementKg,
    reposDefautSec,
    repsCibleMin,
    repsCibleMax,
    seriesCibleDefaut,
    estRepere,
    archive: false,
    notes: '',
    ordre: compteurOrdre++,
  }
}

export const EXERCICES_DEPART: NouvelExercice[] = [
  // Pectoraux (16 séries)
  exo('Développé couché barre', 'Pectoraux', 'barre', 2.5, 6, 8, 165, 4, true),
  exo('Développé incliné haltères', 'Pectoraux', 'haltères', 1, 8, 10, 120, 4),
  exo('Écarté à la poulie', 'Pectoraux', 'poulie', 0.5, 10, 15, 90, 4),
  exo('Dips buste penché ou Pec Deck', 'Pectoraux', 'poids du corps', 2.5, 10, 15, 90, 4),

  // Dos (14 séries)
  exo('Tirage vertical (prise large)', 'Dos', 'poulie', 2.5, 6, 10, 120, 4, true),
  exo('Rowing machine poitrine appuyée', 'Dos', 'machine', 2.5, 8, 10, 120, 5),
  exo('Tirage horizontal poulie', 'Dos', 'poulie', 2.5, 10, 12, 105, 5),

  // Épaules (12 séries)
  exo('Développé militaire haltères', 'Épaules', 'haltères', 1, 6, 10, 120, 4, true),
  exo('Élévations latérales', 'Épaules', 'haltères', 1, 12, 20, 90, 5),
  exo('Oiseau à la machine', 'Épaules', 'machine', 2.5, 12, 20, 90, 3),

  // Biceps (10 séries)
  exo('Curl barre EZ', 'Biceps', 'barre', 2.5, 8, 10, 120, 4, true),
  exo('Curl incliné haltères', 'Biceps', 'haltères', 1, 10, 12, 90, 3),
  exo('Curl pupitre', 'Biceps', 'machine', 2.5, 10, 15, 90, 3),

  // Triceps (10 séries)
  exo('Barre au front', 'Triceps', 'barre', 2.5, 8, 10, 120, 4, true),
  exo('Extension corde à la poulie', 'Triceps', 'poulie', 0.5, 10, 12, 90, 3),
  exo('Extension unilatérale au-dessus de la tête', 'Triceps', 'haltères', 1, 12, 15, 90, 3),

  // Quadriceps (10 séries)
  exo('Squat ou Hack Squat', 'Quadriceps', 'barre', 2.5, 6, 8, 180, 4, true),
  exo('Presse à cuisses', 'Quadriceps', 'machine', 2.5, 10, 12, 120, 3),
  exo('Leg Extension', 'Quadriceps', 'machine', 2.5, 12, 15, 90, 3),

  // Ischio-jambiers (6 séries)
  exo('Leg Curl allongé ou assis', 'Ischio-jambiers', 'machine', 2.5, 10, 12, 90, 3, true),
  exo('Soulevé de terre jambes tendues', 'Ischio-jambiers', 'barre', 2.5, 8, 10, 120, 3),

  // Mollets (6 séries)
  exo('Mollets debout', 'Mollets', 'machine', 2.5, 10, 15, 90, 3, true),
  exo('Mollets assis', 'Mollets', 'machine', 2.5, 12, 20, 90, 3),
]

export const CIBLES_VOLUME_DEPART: CibleVolume[] = [
  { groupeMusculaire: 'Pectoraux', seriesCibleSemaine: 16, seancesCibleSemaine: 2 },
  { groupeMusculaire: 'Dos', seriesCibleSemaine: 14, seancesCibleSemaine: 2 },
  { groupeMusculaire: 'Épaules', seriesCibleSemaine: 12, seancesCibleSemaine: 2 },
  { groupeMusculaire: 'Biceps', seriesCibleSemaine: 10, seancesCibleSemaine: 2 },
  { groupeMusculaire: 'Triceps', seriesCibleSemaine: 10, seancesCibleSemaine: 2 },
  { groupeMusculaire: 'Quadriceps', seriesCibleSemaine: 10, seancesCibleSemaine: 2 },
  { groupeMusculaire: 'Ischio-jambiers', seriesCibleSemaine: 6, seancesCibleSemaine: 1 },
  { groupeMusculaire: 'Mollets', seriesCibleSemaine: 6, seancesCibleSemaine: 1 },
]

const REGLAGES_DEPART: Record<string, string> = {
  poidsBarreKg: '20',
  sonActif: 'true',
  vibrationActif: 'true',
  inventaireDisquesKg: JSON.stringify([25, 20, 15, 10, 5, 2.5, 1.25]),
  githubProprietaire: '',
  githubDepot: '',
  githubJeton: '',
  seancesCibleParSemaine: '3',
  vitessePriseDeMasseCibleMinGSemaine: '200',
  vitessePriseDeMasseCibleMaxGSemaine: '400',
}

interface ExerciceProgrammeDepart {
  nomExercice: string
  seriesCibles: number
}

interface ProgrammeDepart {
  nom: string
  exercices: ExerciceProgrammeDepart[]
}

const PROGRAMME_DEPART: ProgrammeDepart[] = [
  {
    nom: 'Lundi',
    exercices: [
      { nomExercice: 'Développé couché barre', seriesCibles: 3 },
      { nomExercice: 'Développé incliné haltères', seriesCibles: 3 },
      { nomExercice: 'Écarté à la poulie', seriesCibles: 2 },
      { nomExercice: 'Développé militaire haltères', seriesCibles: 3 },
      { nomExercice: 'Élévations latérales', seriesCibles: 3 },
      { nomExercice: 'Barre au front', seriesCibles: 3 },
      { nomExercice: 'Extension corde à la poulie', seriesCibles: 2 },
    ],
  },
  {
    nom: 'Mardi',
    exercices: [
      { nomExercice: 'Tirage vertical (prise large)', seriesCibles: 3 },
      { nomExercice: 'Rowing machine poitrine appuyée', seriesCibles: 2 },
      { nomExercice: 'Tirage horizontal poulie', seriesCibles: 2 },
      { nomExercice: 'Curl barre EZ', seriesCibles: 3 },
      { nomExercice: 'Curl incliné haltères', seriesCibles: 2 },
      { nomExercice: 'Squat ou Hack Squat', seriesCibles: 2 },
      { nomExercice: 'Leg Curl allongé ou assis', seriesCibles: 2 },
      { nomExercice: 'Soulevé de terre jambes tendues', seriesCibles: 2 },
    ],
  },
  {
    nom: 'Jeudi',
    exercices: [
      { nomExercice: 'Développé couché barre', seriesCibles: 3 },
      { nomExercice: 'Développé incliné haltères', seriesCibles: 3 },
      { nomExercice: 'Écarté à la poulie', seriesCibles: 2 },
      { nomExercice: 'Développé militaire haltères', seriesCibles: 3 },
      { nomExercice: 'Élévations latérales', seriesCibles: 3 },
      { nomExercice: 'Barre au front', seriesCibles: 3 },
      { nomExercice: 'Extension corde à la poulie', seriesCibles: 2 },
    ],
  },
  {
    nom: 'Vendredi',
    exercices: [
      { nomExercice: 'Tirage vertical (prise large)', seriesCibles: 3 },
      { nomExercice: 'Rowing machine poitrine appuyée', seriesCibles: 2 },
      { nomExercice: 'Tirage horizontal poulie', seriesCibles: 2 },
      { nomExercice: 'Curl barre EZ', seriesCibles: 3 },
      { nomExercice: 'Curl incliné haltères', seriesCibles: 2 },
      { nomExercice: 'Squat ou Hack Squat', seriesCibles: 2 },
      { nomExercice: 'Mollets debout', seriesCibles: 3 },
      { nomExercice: 'Mollets assis', seriesCibles: 3 },
    ],
  },
]

export async function initialiserProgrammeParDefaut(): Promise<void> {
  await db.transaction('rw', db.programmes, db.programmeExercices, db.exercices, async () => {
    const nbProgrammes = await db.programmes.count()
    if (nbProgrammes > 0) return

    for (const [index, jour] of PROGRAMME_DEPART.entries()) {
      const programmeId = await db.programmes.add({ nom: jour.nom, ordre: index, archive: false })
      for (const [ordre, item] of jour.exercices.entries()) {
        const exercice = await db.exercices.where('nom').equals(item.nomExercice).first()
        if (!exercice) continue
        await db.programmeExercices.add({
          programmeId,
          exerciceId: exercice.id,
          ordre,
          seriesCibles: item.seriesCibles,
          repsCibleMin: exercice.repsCibleMin,
          repsCibleMax: exercice.repsCibleMax,
          reposSec: exercice.reposDefautSec,
        })
      }
    }
  })
}

export async function initialiserDonneesParDefaut(): Promise<void> {
  await db.transaction(
    'rw',
    db.exercices,
    db.ciblesVolume,
    db.reglages,
    async () => {
      const nbExercices = await db.exercices.count()
      if (nbExercices === 0) {
        await db.exercices.bulkAdd(EXERCICES_DEPART)
      }

      const nbCibles = await db.ciblesVolume.count()
      if (nbCibles === 0) {
        await db.ciblesVolume.bulkAdd(CIBLES_VOLUME_DEPART)
      }

      for (const [cle, valeur] of Object.entries(REGLAGES_DEPART)) {
        const existant = await db.reglages.get(cle)
        if (!existant) {
          await db.reglages.put({ cle, valeur })
        }
      }
    },
  )
}
