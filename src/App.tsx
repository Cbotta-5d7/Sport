import { useEffect, lazy, Suspense, useState, type ReactNode } from 'react'
import { initialiserDonneesParDefaut, initialiserProgrammeParDefaut } from './db/seed'
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
const ProgrammeScreen = lazy(() =>
  import('./features/programme/ProgrammeScreen').then((m) => ({ default: m.ProgrammeScreen })),
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
  | { nom: 'programme' }

function App() {
  const [vue, setVue] = useState<Vue>({ nom: 'chargement' })
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    async function demarrer() {
      await initialiserDonneesParDefaut()
      await initialiserProgrammeParDefaut()
      if (navigator.storage?.persist) {
        navigator.storage.persist().catch(() => {})
      }
      const enCours = await seanceEnCours()
      const vueInitiale: Vue = enCours ? { nom: 'seance', seanceId: enCours.id } : { nom: 'accueil' }
      window.history.replaceState(vueInitiale, '')
      setVue(vueInitiale)
      synchroniserMaintenant().catch(() => {})
    }
    demarrer().catch((e) => setErreur(String(e)))
  }, [])

  useEffect(() => {
    function onPopState(e: PopStateEvent) {
      setVue((e.state as Vue | null) ?? { nom: 'accueil' })
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  function naviguer(nouvelleVue: Vue) {
    window.history.pushState(nouvelleVue, '')
    setVue(nouvelleVue)
  }

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
        onContinuer={(groupes) => naviguer({ nom: 'selection', groupes })}
        onOuvrirReglages={() => naviguer({ nom: 'reglages' })}
        onOuvrirExercices={() => naviguer({ nom: 'exercices' })}
        onOuvrirReperes={() => naviguer({ nom: 'reperes' })}
        onOuvrirPoids={() => naviguer({ nom: 'poids' })}
        onOuvrirGlobale={() => naviguer({ nom: 'globale' })}
        onOuvrirGroupe={(groupe) => naviguer({ nom: 'groupeDetail', groupe })}
        onOuvrirHistorique={() => naviguer({ nom: 'historique' })}
        onOuvrirProgramme={() => naviguer({ nom: 'programme' })}
      />
    )
  } else if (vue.nom === 'selection') {
    contenu = (
      <SelectionScreen
        groupes={vue.groupes}
        onRetour={() => naviguer({ nom: 'accueil' })}
        onDemarrer={(seanceId) => naviguer({ nom: 'seance', seanceId })}
      />
    )
  } else if (vue.nom === 'seance') {
    contenu = (
      <SeanceScreen
        seanceId={vue.seanceId}
        onTerminee={() => naviguer({ nom: 'finSeance', seanceId: vue.seanceId })}
        onAnnulee={() => naviguer({ nom: 'accueil' })}
        onVoirAccueil={() => naviguer({ nom: 'accueil' })}
        onVoirHistorique={() => naviguer({ nom: 'historique' })}
      />
    )
  } else if (vue.nom === 'finSeance') {
    contenu = (
      <FinSeanceScreen
        seanceId={vue.seanceId}
        onFermer={() => {
          synchroniserMaintenant().catch(() => {})
          naviguer({ nom: 'accueil' })
        }}
      />
    )
  } else if (vue.nom === 'reglages') {
    contenu = (
      <ReglagesScreen
        onRetour={() => naviguer({ nom: 'accueil' })}
        onOuvrirSauvegardes={() => naviguer({ nom: 'sauvegardes' })}
        onOuvrirCalculateur={() => naviguer({ nom: 'calculateur' })}
        onOuvrirProgramme={() => naviguer({ nom: 'programme' })}
      />
    )
  } else if (vue.nom === 'calculateur') {
    contenu = (
      <Suspense fallback={<ChargementEcran />}>
        <CalculateurDisquesScreen onRetour={() => naviguer({ nom: 'reglages' })} />
      </Suspense>
    )
  } else if (vue.nom === 'sauvegardes') {
    contenu = <SauvegardesScreen onRetour={() => naviguer({ nom: 'reglages' })} />
  } else if (vue.nom === 'exercices') {
    contenu = (
      <ExercicesListScreen
        onRetour={() => naviguer({ nom: 'accueil' })}
        onOuvrirExercice={(exerciceId) => naviguer({ nom: 'exerciceDetail', exerciceId })}
      />
    )
  } else if (vue.nom === 'exerciceDetail') {
    contenu = (
      <Suspense fallback={<ChargementEcran />}>
        <ExerciceDetailScreen exerciceId={vue.exerciceId} onRetour={() => naviguer({ nom: 'exercices' })} />
      </Suspense>
    )
  } else if (vue.nom === 'groupeDetail') {
    contenu = (
      <Suspense fallback={<ChargementEcran />}>
        <GroupeDetailScreen groupe={vue.groupe} onRetour={() => naviguer({ nom: 'accueil' })} />
      </Suspense>
    )
  } else if (vue.nom === 'globale') {
    contenu = (
      <Suspense fallback={<ChargementEcran />}>
        <VueGlobaleScreen onRetour={() => naviguer({ nom: 'accueil' })} />
      </Suspense>
    )
  } else if (vue.nom === 'reperes') {
    contenu = (
      <Suspense fallback={<ChargementEcran />}>
        <ReperesScreen onRetour={() => naviguer({ nom: 'accueil' })} />
      </Suspense>
    )
  } else if (vue.nom === 'poids') {
    contenu = (
      <Suspense fallback={<ChargementEcran />}>
        <PoidsCorporelScreen onRetour={() => naviguer({ nom: 'accueil' })} />
      </Suspense>
    )
  } else if (vue.nom === 'historique') {
    contenu = (
      <Suspense fallback={<ChargementEcran />}>
        <HistoriqueScreen
          onRetour={() => naviguer({ nom: 'accueil' })}
          onOuvrirSeance={(seanceId) => naviguer({ nom: 'historiqueDetail', seanceId })}
        />
      </Suspense>
    )
  } else if (vue.nom === 'historiqueDetail') {
    contenu = (
      <Suspense fallback={<ChargementEcran />}>
        <HistoriqueDetailScreen
          seanceId={vue.seanceId}
          onRetour={() => naviguer({ nom: 'historique' })}
          onSupprimee={() => naviguer({ nom: 'historique' })}
          onReprise={() => naviguer({ nom: 'seance', seanceId: vue.seanceId })}
        />
      </Suspense>
    )
  } else {
    contenu = (
      <Suspense fallback={<ChargementEcran />}>
        <ProgrammeScreen onRetour={() => naviguer({ nom: 'accueil' })} />
      </Suspense>
    )
  }

  return (
    <>
      {vue.nom !== 'seance' && (
        <BanniereSeanceEnCours onReprendre={(seanceId) => naviguer({ nom: 'seance', seanceId })} />
      )}
      {contenu}
    </>
  )
}

export default App
