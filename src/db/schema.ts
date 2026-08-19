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

    this.version(2)
      .stores({
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
      .upgrade(async (tx) => {
        // 1) Chaque exercice existant reçoit une valeur par défaut pour le nouveau champ.
        await tx
          .table('exercices')
          .toCollection()
          .modify((e: Exercice) => {
            e.seriesCibleDefaut = 3
          })

        // 2) Renommage/ajustement nominatif préservant l'historique.
        const renommages: Record<string, Partial<Exercice>> = {
          'Développé couché': { nom: 'Développé couché barre', repsCibleMin: 6, repsCibleMax: 8, reposDefautSec: 165, seriesCibleDefaut: 4 },
          'Développé incliné haltères': { repsCibleMin: 8, repsCibleMax: 10, reposDefautSec: 120, seriesCibleDefaut: 4 },
          'Écarté poulie vis-à-vis': { nom: 'Écarté à la poulie', repsCibleMin: 10, repsCibleMax: 15, reposDefautSec: 90, seriesCibleDefaut: 4 },
          'Dips': { nom: 'Dips buste penché ou Pec Deck', repsCibleMin: 10, repsCibleMax: 15, reposDefautSec: 90, seriesCibleDefaut: 4 },
          'Tirage vertical': { nom: 'Tirage vertical (prise large)', repsCibleMin: 6, repsCibleMax: 10, reposDefautSec: 120, seriesCibleDefaut: 4 },
          'Tirage horizontal poulie': { repsCibleMin: 10, repsCibleMax: 12, reposDefautSec: 105, seriesCibleDefaut: 5 },
          'Rowing barre': {
            nom: 'Rowing machine poitrine appuyée',
            typeCharge: 'machine',
            incrementKg: 2.5,
            repsCibleMin: 8,
            repsCibleMax: 10,
            reposDefautSec: 120,
            seriesCibleDefaut: 5,
          },
          'Développé militaire': {
            nom: 'Développé militaire haltères',
            typeCharge: 'haltères',
            incrementKg: 1,
            repsCibleMin: 6,
            repsCibleMax: 10,
            reposDefautSec: 120,
            seriesCibleDefaut: 4,
          },
          'Élévations latérales haltères': { nom: 'Élévations latérales', repsCibleMin: 12, repsCibleMax: 20, reposDefautSec: 90, seriesCibleDefaut: 5 },
          'Oiseau poulie': {
            nom: 'Oiseau à la machine',
            typeCharge: 'machine',
            incrementKg: 2.5,
            repsCibleMin: 12,
            repsCibleMax: 20,
            reposDefautSec: 90,
            seriesCibleDefaut: 3,
          },
          'Curl barre': { nom: 'Curl barre EZ', repsCibleMin: 8, repsCibleMax: 10, reposDefautSec: 120, seriesCibleDefaut: 4 },
          'Curl haltères alterné': { nom: 'Curl incliné haltères', repsCibleMin: 10, repsCibleMax: 12, reposDefautSec: 90, seriesCibleDefaut: 3 },
          'Curl pupitre': { repsCibleMin: 10, repsCibleMax: 15, reposDefautSec: 90, seriesCibleDefaut: 3 },
          'Barre au front': { estRepere: true, repsCibleMin: 8, repsCibleMax: 10, reposDefautSec: 120, seriesCibleDefaut: 4 },
          'Pushdown corde': { nom: 'Extension corde à la poulie', repsCibleMin: 10, repsCibleMax: 12, reposDefautSec: 90, seriesCibleDefaut: 3 },
          'Extension nuque haltère': { nom: 'Extension unilatérale au-dessus de la tête', repsCibleMin: 12, repsCibleMax: 15, reposDefautSec: 90, seriesCibleDefaut: 3 },
          'Squat barre': {
            nom: 'Squat ou Hack Squat',
            groupeMusculaire: 'Quadriceps',
            repsCibleMin: 6,
            repsCibleMax: 8,
            reposDefautSec: 180,
            seriesCibleDefaut: 4,
            estRepere: true,
          },
          'Presse à cuisses': {
            groupeMusculaire: 'Quadriceps',
            repsCibleMin: 10,
            repsCibleMax: 12,
            reposDefautSec: 120,
            seriesCibleDefaut: 3,
            estRepere: false,
          },
          'Leg extension': {
            nom: 'Leg Extension',
            groupeMusculaire: 'Quadriceps',
            repsCibleMin: 12,
            repsCibleMax: 15,
            reposDefautSec: 90,
            seriesCibleDefaut: 3,
          },
          'Leg curl allongé': {
            nom: 'Leg Curl allongé ou assis',
            groupeMusculaire: 'Ischio-jambiers',
            repsCibleMin: 10,
            repsCibleMax: 12,
            reposDefautSec: 90,
            seriesCibleDefaut: 3,
            estRepere: true,
          },
          'Mollets debout': { repsCibleMin: 10, repsCibleMax: 15, reposDefautSec: 90, seriesCibleDefaut: 3 },
          'Mollets assis': { repsCibleMin: 12, repsCibleMax: 20, reposDefautSec: 90, seriesCibleDefaut: 3 },
        }

        for (const [ancienNom, maj] of Object.entries(renommages)) {
          await tx.table('exercices').where('nom').equals(ancienNom).modify(maj)
        }

        // 3) Exercices sans correspondance raisonnable dans le nouveau programme : archivés (historique conservé).
        const aArchiver = [
          'Développé couché machine',
          'Rowing haltère unilatéral',
          'Tractions',
          'Développé haltères assis',
          'Élévations latérales poulie',
          'Curl poulie basse',
          'Curl marteau haltères',
          'Extension triceps poulie',
          'Dips triceps',
          'Fentes haltères',
          'Mollets à la presse',
          'Mollets debout haltère',
          'Mollets poulie',
          'Crunch poulie haute',
          'Relevé de jambes suspendu',
          'Crunch machine',
          'Gainage lesté',
          'Rotation poulie',
        ]
        await tx.table('exercices').where('nom').anyOf(aArchiver).modify({ archive: true })

        // 4) Nouvel exercice sans ancien équivalent.
        const dejaPresent = await tx.table('exercices').where('nom').equals('Soulevé de terre jambes tendues').count()
        if (dejaPresent === 0) {
          await tx.table('exercices').add({
            nom: 'Soulevé de terre jambes tendues',
            groupeMusculaire: 'Ischio-jambiers',
            typeCharge: 'barre',
            incrementKg: 2.5,
            reposDefautSec: 120,
            repsCibleMin: 8,
            repsCibleMax: 10,
            seriesCibleDefaut: 3,
            estRepere: false,
            archive: false,
            notes: '',
          })
        }

        // 5) Cibles de volume hebdomadaires : mise à jour, scission Cuisses -> Quadriceps/Ischio-jambiers, suppression Abdominaux.
        const ciblesMaj: Record<string, number> = {
          Pectoraux: 16,
          Dos: 14,
          Épaules: 12,
          Biceps: 10,
          Triceps: 10,
          Mollets: 6,
        }
        for (const [groupe, seriesCibleSemaine] of Object.entries(ciblesMaj)) {
          await tx.table('ciblesVolume').update(groupe, { seriesCibleSemaine })
        }
        await tx.table('ciblesVolume').delete('Cuisses')
        await tx.table('ciblesVolume').delete('Abdominaux')
        await tx.table('ciblesVolume').bulkPut([
          { groupeMusculaire: 'Quadriceps', seriesCibleSemaine: 10, seancesCibleSemaine: 2 },
          { groupeMusculaire: 'Ischio-jambiers', seriesCibleSemaine: 6, seancesCibleSemaine: 1 },
        ])
      })

    this.version(3)
      .stores({
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
      .upgrade(async (tx) => {
        await tx
          .table('seances')
          .toCollection()
          .modify((s: Seance) => {
            s.dejaTerminee = false
          })
      })

    this.version(4)
      .stores({
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
      .upgrade(async (tx) => {
        const renommagesJours: Record<string, string> = {
          'Push A': 'Lundi',
          'Pull + Legs A': 'Mardi',
          'Push B': 'Jeudi',
          'Pull + Legs B': 'Vendredi',
        }
        await tx
          .table('programmes')
          .toCollection()
          .modify((p: Programme) => {
            const nouveau = renommagesJours[p.nom]
            if (nouveau) p.nom = nouveau
          })
      })

    this.version(5)
      .stores({
        exercices: '++id, nom, groupeMusculaire, archive, estRepere, ordre',
        programmes: '++id, ordre, archive',
        programmeExercices: '++id, programmeId, exerciceId, ordre',
        seances: '++id, date, statut',
        seanceExercices: '++id, seanceId, exerciceId, ordre, statut',
        series: '++id, seanceExerciceId, numeroSerie, horodatage',
        ciblesVolume: 'groupeMusculaire',
        poidsCorporel: '++id, date',
        reglages: 'cle',
      })
      .upgrade(async (tx) => {
        const exercices = ((await tx.table('exercices').toArray()) as Exercice[]).sort((a, b) =>
          a.nom.localeCompare(b.nom, 'fr'),
        )
        await Promise.all(exercices.map((e, index) => tx.table('exercices').update(e.id, { ordre: index })))
      })
  }
}

export const db = new MusculationDB()
