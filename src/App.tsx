import { useEffect, useState } from 'react'
import { initialiserDonneesParDefaut } from './db/seed'
import { seanceEnCours } from './db/queries'
import { synchroniserMaintenant } from './sync/synchroniser'
import { AccueilScreen } from './features/accueil/AccueilScreen'
import { SelectionScreen } from './features/selection/SelectionScreen'
import { SeanceScreen } from './features/seance/SeanceScreen'
import { FinSeanceScreen } from './features/seance/FinSeanceScreen'
import { ReglagesScreen } from './features/reglages/ReglagesScreen'
import { SauvegardesScreen } from './features/reglages/SauvegardesScreen'
import type { GroupeMusculaire } from './db/types'

type Vue =
  | { nom: 'chargement' }
  | { nom: 'accueil' }
  | { nom: 'selection'; groupes: GroupeMusculaire[] }
  | { nom: 'seance'; seanceId: number }
  | { nom: 'finSeance'; seanceId: number }
  | { nom: 'reglages' }
  | { nom: 'sauvegardes' }

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
      <div className="flex min-h-dvh items-center justify-center px-6 text-center text-red-400">
        Erreur d'initialisation : {erreur}
      </div>
    )
  }

  if (vue.nom === 'chargement') {
    return <div className="flex min-h-dvh items-center justify-center text-slate-500">Chargement…</div>
  }

  if (vue.nom === 'accueil') {
    return (
      <AccueilScreen
        onContinuer={(groupes) => setVue({ nom: 'selection', groupes })}
        onOuvrirReglages={() => setVue({ nom: 'reglages' })}
      />
    )
  }

  if (vue.nom === 'selection') {
    return (
      <SelectionScreen
        groupes={vue.groupes}
        onRetour={() => setVue({ nom: 'accueil' })}
        onDemarrer={(seanceId) => setVue({ nom: 'seance', seanceId })}
      />
    )
  }

  if (vue.nom === 'seance') {
    return (
      <SeanceScreen
        seanceId={vue.seanceId}
        onTerminee={() => setVue({ nom: 'finSeance', seanceId: vue.seanceId })}
      />
    )
  }

  if (vue.nom === 'finSeance') {
    return (
      <FinSeanceScreen
        seanceId={vue.seanceId}
        onFermer={() => {
          synchroniserMaintenant().catch(() => {})
          setVue({ nom: 'accueil' })
        }}
      />
    )
  }

  if (vue.nom === 'reglages') {
    return (
      <ReglagesScreen
        onRetour={() => setVue({ nom: 'accueil' })}
        onOuvrirSauvegardes={() => setVue({ nom: 'sauvegardes' })}
      />
    )
  }

  return <SauvegardesScreen onRetour={() => setVue({ nom: 'reglages' })} />
}

export default App
