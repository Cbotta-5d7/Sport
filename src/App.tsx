import { useEffect, lazy, Suspense, useState, type ReactNode } from 'react'
import { initialiserDonneesParDefaut } from './db/seed'
import { seanceEnCours } from './db/queries'
import { synchroniserMaintenant } from './sync/synchroniser'
import { AccueilScreen } from './features/accueil/AccueilScreen'
import { SelectionScreen } from './features/selection/SelectionScreen'
import { SeanceScreen } from './features/seance/SeanceScreen'
import { FinSeanceScreen } from './features/seance/FinSeanceScreen'
import { BanniereSeanceEnCours } from './features/seance/BanniereSeanceEnCours'
import { ReglagesScreen } from './features/reglages/ReglagesScreen'
import { SauvegardesScreen } from './features/reglages/SauvegardesScreen'
import { ExercicesListScreen } from './features/exercices/ExercicesListScreen'
import type { GroupeMusculaire } from './db/types'

const CalculateurDisquesScreen = lazy(() =>
  import('./features/reglages/CalculateurDisquesScreen').then((m) => ({ default: m.CalculateurDisquesScreen })),
)

const ExerciceDetailScreen = lazy(() =>
  import('./features/exercices/ExerciceDetailScreen').then((m) => ({ default: m.ExerciceDetailScreen })),
)
const PoidsCorporelScreen = lazy(() =>
  import('./features/poids/PoidsCorporelScreen').then((m) => ({ default: m.PoidsCorporelScreen })),
)
const GroupeDetailScreen = lazy(() =>
  import('./features/groupes/GroupeDetailScreen').then((m) => ({ default: m.GroupeDetailScreen })),
)
const VueGlobaleScreen = lazy(() =>
  import('./features/globale/VueGlobaleScreen').then((m) => ({ default: m.VueGlobaleScreen })),
)
const ReperesScreen = lazy(() =>
  import('./features/reperes/ReperesScreen').then((m) => ({ default: m.ReperesScreen })),
)
const HistoriqueScreen = lazy(() =>
  import('./features/historique/HistoriqueScreen').then((m) => ({ default: m.HistoriqueScreen })),
)
const HistoriqueDetailScreen = lazy(() =>
  import('./features/historique/HistoriqueDetailScreen').then((m) => ({ default: m.HistoriqueDetailScreen })),
)

function ChargementEcran() {
  return <div className="flex min-h-dvh items-center justify-center text-slate-400">Chargement…</div>
}

type Vue =
  | { nom: 'chargement' }
  | { nom: 'accueil' }
  | { nom: 'selection'; groupes: GroupeMusculaire[] }
  | { nom: 'seance'; seanceId: number }
  | { nom: 'finSeance'; seanceId: number }
  | { nom: 'reglages' }
  | { nom: 'sauvegardes' }
  | { nom: 'exercices' }
  | { nom: 'exerciceDetail'; exerciceId: number }
  | { nom: 'groupeDetail'; groupe: GroupeMusculaire }
  | { nom: 'globale' }
  | { nom: 'reperes' }
  | { nom: 'poids' }
  | { nom: 'calculateur' }
  | { nom: 'historique' }
  | { nom: 'historiqueDetail'; seanceId: number }

function App() {
  const [vue, setVue] = useState<Vue>({ nom: 'chargement' })
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    async function demarrer() {
      await initialiserDonneesParDefaut()
      if (navigator.storage?.persist) {
        navigator.storage.persist().catch(() => {})
      }
      const enCours = await seanceEnCours()
      setVue(enCours ? { nom: 'seance', seanceId: enCours.id } : { nom: 'accueil' })
      synchroniserMaintenant().catch(() => {})
    }
    demarrer().catch((e) => setErreur(String(e)))
  }, [])

  if (erreur) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6 text-center text-red-600">
        Erreur d'initialisation : {erreur}
      </div>
    )
  }

  if (vue.nom === 'chargement') {
    return <div className="flex min-h-dvh items-center justify-center text-slate-400">Chargement…</div>
  }

  let contenu: ReactNode = null

  if (vue.nom === 'accueil') {
    contenu = (
      <AccueilScreen
        onContinuer={(groupes) => setVue({ nom: 'selection', groupes })}
        onOuvrirReglages={() => setVue({ nom: 'reglages' })}
        onOuvrirExercices={() => setVue({ nom: 'exercices' })}
        onOuvrirReperes={() => setVue({ nom: 'reperes' })}
        onOuvrirPoids={() => setVue({ nom: 'poids' })}
        onOuvrirGlobale={() => setVue({ nom: 'globale' })}
        onOuvrirGroupe={(groupe) => setVue({ nom: 'groupeDetail', groupe })}
        onOuvrirHistorique={() => setVue({ nom: 'historique' })}
      />
    )
  } else if (vue.nom === 'selection') {
    contenu = (
      <SelectionScreen
        groupes={vue.groupes}
        onRetour={() => setVue({ nom: 'accueil' })}
        onDemarrer={(seanceId) => setVue({ nom: 'seance', seanceId })}
      />
    )
  } else if (vue.nom === 'seance') {
    contenu = (
      <SeanceScreen
        seanceId={vue.seanceId}
        onTerminee={() => setVue({ nom: 'finSeance', seanceId: vue.seanceId })}
        onAnnulee={() => setVue({ nom: 'accueil' })}
        onVoirAccueil={() => setVue({ nom: 'accueil' })}
        onVoirHistorique={() => setVue({ nom: 'historique' })}
      />
    )
  } else if (vue.nom === 'finSeance') {
    contenu = (
      <FinSeanceScreen
        seanceId={vue.seanceId}
        onFermer={() => {
          synchroniserMaintenant().catch(() => {})
          setVue({ nom: 'accueil' })
        }}
      />
    )
  } else if (vue.nom === 'reglages') {
    contenu = (
      <ReglagesScreen
        onRetour={() => setVue({ nom: 'accueil' })}
        onOuvrirSauvegardes={() => setVue({ nom: 'sauvegardes' })}
        onOuvrirCalculateur={() => setVue({ nom: 'calculateur' })}
      />
    )
  } else if (vue.nom === 'calculateur') {
    contenu = (
      <Suspense fallback={<ChargementEcran />}>
        <CalculateurDisquesScreen onRetour={() => setVue({ nom: 'reglages' })} />
      </Suspense>
    )
  } else if (vue.nom === 'sauvegardes') {
    contenu = <SauvegardesScreen onRetour={() => setVue({ nom: 'reglages' })} />
  } else if (vue.nom === 'exercices') {
    contenu = (
      <ExercicesListScreen
        onRetour={() => setVue({ nom: 'accueil' })}
        onOuvrirExercice={(exerciceId) => setVue({ nom: 'exerciceDetail', exerciceId })}
      />
    )
  } else if (vue.nom === 'exerciceDetail') {
    contenu = (
      <Suspense fallback={<ChargementEcran />}>
        <ExerciceDetailScreen exerciceId={vue.exerciceId} onRetour={() => setVue({ nom: 'exercices' })} />
      </Suspense>
    )
  } else if (vue.nom === 'groupeDetail') {
    contenu = (
      <Suspense fallback={<ChargementEcran />}>
        <GroupeDetailScreen groupe={vue.groupe} onRetour={() => setVue({ nom: 'accueil' })} />
      </Suspense>
    )
  } else if (vue.nom === 'globale') {
    contenu = (
      <Suspense fallback={<ChargementEcran />}>
        <VueGlobaleScreen onRetour={() => setVue({ nom: 'accueil' })} />
      </Suspense>
    )
  } else if (vue.nom === 'reperes') {
    contenu = (
      <Suspense fallback={<ChargementEcran />}>
        <ReperesScreen onRetour={() => setVue({ nom: 'accueil' })} />
      </Suspense>
    )
  } else if (vue.nom === 'poids') {
    contenu = (
      <Suspense fallback={<ChargementEcran />}>
        <PoidsCorporelScreen onRetour={() => setVue({ nom: 'accueil' })} />
      </Suspense>
    )
  } else if (vue.nom === 'historique') {
    contenu = (
      <Suspense fallback={<ChargementEcran />}>
        <HistoriqueScreen
          onRetour={() => setVue({ nom: 'accueil' })}
          onOuvrirSeance={(seanceId) => setVue({ nom: 'historiqueDetail', seanceId })}
        />
      </Suspense>
    )
  } else {
    contenu = (
      <Suspense fallback={<ChargementEcran />}>
        <HistoriqueDetailScreen
          seanceId={vue.seanceId}
          onRetour={() => setVue({ nom: 'historique' })}
          onSupprimee={() => setVue({ nom: 'historique' })}
          onReprise={() => setVue({ nom: 'seance', seanceId: vue.seanceId })}
        />
      </Suspense>
    )
  }

  return (
    <>
      {vue.nom !== 'seance' && (
        <BanniereSeanceEnCours onReprendre={(seanceId) => setVue({ nom: 'seance', seanceId })} />
      )}
      {contenu}
    </>
  )
}

export default App
