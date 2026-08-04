import { useEtatSync } from '../../sync/useEtatSync'

const COULEURS: Record<string, string> = {
  gris: 'bg-slate-600',
  vert: 'bg-emerald-500',
  orange: 'bg-amber-500',
  rouge: 'bg-red-500',
}

export function IndicateurSync({ onClick }: { onClick?: () => void }) {
  const etat = useEtatSync()

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-8 items-center gap-1.5 rounded-full border border-slate-300 px-2 py-1 text-xs text-slate-500"
      title={etat.horodatage ? `Dernière sync : ${new Date(etat.horodatage).toLocaleString('fr-FR')}` : 'Jamais synchronisé'}
    >
      <span className={`h-2 w-2 rounded-full ${COULEURS[etat.couleur]}`} />
      Sync
    </button>
  )
}
