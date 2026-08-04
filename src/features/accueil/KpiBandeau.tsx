import { useEffect, useState } from 'react'
import { calculerKPI, type KPI } from '../../db/dashboard'
import { formatKg, formatPourcent } from '../../utils/nombres'

interface Tuile {
  titre: string
  valeur: string
  fleche: '▲' | '▼' | '─' | null
  sousTitre?: string
}

function fleche(actuel: number | null, precedent: number | null): '▲' | '▼' | '─' | null {
  if (actuel === null || precedent === null) return null
  if (actuel > precedent) return '▲'
  if (actuel < precedent) return '▼'
  return '─'
}

function construireTuiles(actuel: KPI, precedent: KPI): Tuile[] {
  return [
    {
      titre: 'Séries efficaces',
      valeur: String(actuel.seriesEfficaces),
      fleche: fleche(actuel.seriesEfficaces, precedent.seriesEfficaces),
    },
    {
      titre: "Taux d'atteinte",
      valeur: `${formatPourcent(actuel.tauxAtteinte, 0)} %`,
      fleche: fleche(actuel.tauxAtteinte, precedent.tauxAtteinte),
    },
    {
      titre: 'Progression repères',
      valeur: actuel.indiceProgression === null ? '—' : `${formatPourcent(actuel.indiceProgression, 0)} %`,
      fleche: fleche(actuel.indiceProgression, precedent.indiceProgression),
    },
    {
      titre: 'Régularité',
      valeur: `${actuel.regulariteFaites}/${actuel.regulariteCible}`,
      fleche: fleche(actuel.regulariteFaites, precedent.regulariteFaites),
      sousTitre: 'séances sur 4 sem.',
    },
    {
      titre: 'Prise de masse',
      valeur: actuel.vitessePriseDeMasseGSemaine === null ? '—' : `${Math.round(actuel.vitessePriseDeMasseGSemaine)} g/sem`,
      fleche: fleche(actuel.vitessePriseDeMasseGSemaine, precedent.vitessePriseDeMasseGSemaine),
      sousTitre: 'cible 200 à 400 g',
    },
    {
      titre: 'Densité',
      valeur: actuel.densite === null ? '—' : `${formatKg(actuel.densite)} kg/min`,
      fleche: fleche(actuel.densite, precedent.densite),
    },
  ]
}

export function KpiBandeau() {
  const [tuiles, setTuiles] = useState<Tuile[] | null>(null)

  useEffect(() => {
    let annule = false
    async function charger() {
      const maintenant = new Date()
      const ilYaUneSemaine = new Date(maintenant)
      ilYaUneSemaine.setDate(ilYaUneSemaine.getDate() - 7)
      const [actuel, precedent] = await Promise.all([calculerKPI(maintenant), calculerKPI(ilYaUneSemaine)])
      if (!annule) setTuiles(construireTuiles(actuel, precedent))
    }
    charger()
    return () => {
      annule = true
    }
  }, [])

  if (!tuiles) return null

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {tuiles.map((t) => (
        <div key={t.titre} className="min-w-[7.5rem] shrink-0 rounded-2xl border border-slate-200 bg-white shadow-sm px-3 py-2">
          <p className="text-xs text-slate-400">{t.titre}</p>
          <p className="text-lg font-semibold text-slate-900">
            {t.valeur} {t.fleche && <span className="text-sm text-slate-500">{t.fleche}</span>}
          </p>
          {t.sousTitre && <p className="text-[10px] text-slate-400">{t.sousTitre}</p>}
        </div>
      ))}
    </div>
  )
}
