import { db } from './schema'
import type { CibleVolume, Exercice } from './types'

type NouvelExercice = Omit<Exercice, 'id'>

const POLY = { min: 8, max: 12, repos: 150 }
const ISOLATION = { min: 10, max: 15, repos: 90 }
const MOLLETS = { min: 12, max: 20, repos: 60 }

function exo(
  nom: string,
  groupeMusculaire: Exercice['groupeMusculaire'],
  typeCharge: Exercice['typeCharge'],
  incrementKg: Exercice['incrementKg'],
  fourchette: { min: number; max: number; repos: number },
  estRepere = false,
): NouvelExercice {
  return {
    nom,
    groupeMusculaire,
    typeCharge,
    incrementKg,
    reposDefautSec: fourchette.repos,
    repsCibleMin: fourchette.min,
    repsCibleMax: fourchette.max,
    estRepere,
    archive: false,
    notes: '',
  }
}

export const EXERCICES_DEPART: NouvelExercice[] = [
  // Pectoraux
  exo('Développé couché', 'Pectoraux', 'barre', 2.5, POLY, true),
  exo('Développé incliné haltères', 'Pectoraux', 'haltères', 1, POLY),
  exo('Écarté poulie vis-à-vis', 'Pectoraux', 'poulie', 0.5, ISOLATION),
  exo('Dips', 'Pectoraux', 'poids du corps', 2.5, POLY),
  exo('Développé couché machine', 'Pectoraux', 'machine', 2.5, POLY),

  // Dos
  exo('Tirage vertical', 'Dos', 'poulie', 2.5, POLY, true),
  exo('Rowing barre', 'Dos', 'barre', 2.5, POLY),
  exo('Tirage horizontal poulie', 'Dos', 'poulie', 2.5, POLY),
  exo('Rowing haltère unilatéral', 'Dos', 'haltères', 1, POLY),
  exo('Tractions', 'Dos', 'poids du corps', 2.5, POLY),

  // Épaules
  exo('Développé militaire', 'Épaules', 'barre', 2.5, POLY, true),
  exo('Élévations latérales haltères', 'Épaules', 'haltères', 1, ISOLATION),
  exo('Développé haltères assis', 'Épaules', 'haltères', 1, POLY),
  exo('Oiseau poulie', 'Épaules', 'poulie', 0.5, ISOLATION),
  exo('Élévations latérales poulie', 'Épaules', 'poulie', 0.5, ISOLATION),

  // Biceps
  exo('Curl barre', 'Biceps', 'barre', 2.5, ISOLATION, true),
  exo('Curl haltères alterné', 'Biceps', 'haltères', 1, ISOLATION),
  exo('Curl pupitre', 'Biceps', 'machine', 2.5, ISOLATION),
  exo('Curl poulie basse', 'Biceps', 'poulie', 0.5, ISOLATION),
  exo('Curl marteau haltères', 'Biceps', 'haltères', 1, ISOLATION),

  // Triceps
  exo('Extension triceps poulie', 'Triceps', 'poulie', 0.5, ISOLATION, true),
  exo('Barre au front', 'Triceps', 'barre', 2.5, ISOLATION),
  exo('Extension nuque haltère', 'Triceps', 'haltères', 1, ISOLATION),
  exo('Dips triceps', 'Triceps', 'poids du corps', 2.5, POLY),
  exo('Pushdown corde', 'Triceps', 'poulie', 0.5, ISOLATION),

  // Cuisses
  exo('Presse à cuisses', 'Cuisses', 'machine', 2.5, POLY, true),
  exo('Squat barre', 'Cuisses', 'barre', 2.5, POLY),
  exo('Fentes haltères', 'Cuisses', 'haltères', 1, POLY),
  exo('Leg extension', 'Cuisses', 'machine', 2.5, ISOLATION),
  exo('Leg curl allongé', 'Cuisses', 'machine', 2.5, ISOLATION),

  // Mollets
  exo('Mollets debout', 'Mollets', 'machine', 2.5, MOLLETS, true),
  exo('Mollets assis', 'Mollets', 'machine', 2.5, MOLLETS),
  exo('Mollets à la presse', 'Mollets', 'machine', 2.5, MOLLETS),
  exo('Mollets debout haltère', 'Mollets', 'haltères', 1, MOLLETS),
  exo('Mollets poulie', 'Mollets', 'poulie', 0.5, MOLLETS),

  // Abdominaux
  exo('Crunch poulie haute', 'Abdominaux', 'poulie', 0.5, ISOLATION),
  exo('Relevé de jambes suspendu', 'Abdominaux', 'poids du corps', 2.5, ISOLATION),
  exo('Crunch machine', 'Abdominaux', 'machine', 2.5, ISOLATION),
  exo('Gainage lesté', 'Abdominaux', 'lestée', 2.5, ISOLATION),
  exo('Rotation poulie', 'Abdominaux', 'poulie', 0.5, ISOLATION),
]

export const CIBLES_VOLUME_DEPART: CibleVolume[] = [
  { groupeMusculaire: 'Pectoraux', seriesCibleSemaine: 15, seancesCibleSemaine: 2 },
  { groupeMusculaire: 'Biceps', seriesCibleSemaine: 10, seancesCibleSemaine: 2 },
  { groupeMusculaire: 'Triceps', seriesCibleSemaine: 10, seancesCibleSemaine: 2 },
  { groupeMusculaire: 'Dos', seriesCibleSemaine: 11, seancesCibleSemaine: 2 },
  { groupeMusculaire: 'Épaules', seriesCibleSemaine: 7, seancesCibleSemaine: 2 },
  { groupeMusculaire: 'Cuisses', seriesCibleSemaine: 8, seancesCibleSemaine: 2 },
  { groupeMusculaire: 'Mollets', seriesCibleSemaine: 4, seancesCibleSemaine: 1 },
  { groupeMusculaire: 'Abdominaux', seriesCibleSemaine: 4, seancesCibleSemaine: 2 },
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
