import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { calculerRepartition } from '../../utils/disques'
import { formatKg } from '../../utils/nombres'
import { ClavierNumerique } from '../seance/ClavierNumerique'

interface Props {
  onRetour: () => void
}

export function CalculateurDisquesScreen({ onRetour }: Props) {
  const [poidsCible, setPoidsCible] = useState(60)
  const [clavierOuvert, setClavierOuvert] = useState(false)

  const reglages = useLiveQuery(
    () => db.reglages.bulkGet(['poidsBarreKg', 'inventaireDisquesKg']),
    [],
    undefined,
  )

  const poidsBarreKg = Number(reglages?.[0]?.valeur ?? 20)
  const inventaireDisquesKg: number[] = reglages?.[1]?.valeur ? JSON.parse(reglages[1].valeur) : []

  const resultat = calculerRepartition(poidsCible, poidsBarreKg, inventaireDisquesKg)

  return (
    <div
      className="flex min-h-dvh flex-col px-4 pb-10"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <header className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onRetour}
          className="min-h-11 min-w-11 rounded-xl border border-slate-300 text-slate-600"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold">Calculateur de disques</h1>
      </header>

      <p className="mb-1 text-xs text-slate-400">Poids cible</p>
      <button
        type="button"
        onClick={() => setClavierOuvert(true)}
        className="mb-4 flex min-h-16 items-center justify-center rounded-2xl border border-slate-300 text-3xl font-semibold text-slate-900"
      >
        {formatKg(poidsCible)} kg
      </button>

      <p className="mb-6 text-sm text-slate-500">
        Barre {formatKg(poidsBarreKg)} kg + {formatKg(resultat.poidsParCote)} kg par côté
      </p>

      {inventaireDisquesKg.length === 0 ? (
        <p className="text-sm text-slate-400">
          Renseigne d'abord ton inventaire de disques dans Réglages.
        </p>
      ) : resultat.parCote.length === 0 ? (
        <p className="text-sm text-slate-400">Pas de disque nécessaire.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {resultat.parCote.map((d) => (
            <div
              key={d.poidsKg}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white shadow-sm px-4 py-3"
            >
              <span className="text-lg text-slate-800">{formatKg(d.poidsKg)} kg</span>
              <span className="text-slate-500">x {d.quantite} par côté</span>
            </div>
          ))}
        </div>
      )}

      {resultat.reste > 0 && (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Poids exact impossible avec cet inventaire. Il manque {formatKg(resultat.reste * 2)} kg
          (atteignable : {formatKg(resultat.poidsAtteint)} kg).
        </p>
      )}

      {clavierOuvert && (
        <ClavierNumerique
          titre="Poids cible (kg)"
          valeurInitiale={poidsCible}
          autoriserDecimales
          onValider={(v) => {
            setPoidsCible(v)
            setClavierOuvert(false)
          }}
          onFermer={() => setClavierOuvert(false)}
        />
      )}
    </div>
  )
}
