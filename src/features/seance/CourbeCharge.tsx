import type { ProgressionCharge } from '../../utils/progressionCharge'

const LARGEUR = 56
const HAUTEUR = 22

export function CourbeCharge({ progression }: { progression: ProgressionCharge }) {
  const { historique, actuel, stagne } = progression
  const points = [...historique, actuel].filter((v): v is number => v !== null)

  if (points.length === 0) return null

  const min = Math.min(...points)
  const max = Math.max(...points)
  const amplitude = max - min || 1
  const pas = points.length > 1 ? LARGEUR / (points.length - 1) : 0
  const coords = points.map((v, i) => {
    const x = points.length > 1 ? i * pas : LARGEUR / 2
    const y = HAUTEUR - 2 - ((v - min) / amplitude) * (HAUTEUR - 4)
    return [x, y] as const
  })
  const chemin = coords.map(([x, y]) => `${x},${y}`).join(' ')

  const dernierEstAujourdhui = actuel !== null
  const couleurPoint = stagne ? '#dc2626' : '#059669'

  const couleurFond = stagne === true ? 'bg-red-50' : stagne === false ? 'bg-emerald-50' : 'bg-slate-100'
  const couleurTexte = stagne === true ? 'text-red-600' : stagne === false ? 'text-emerald-600' : 'text-slate-500'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 ${couleurFond}`}>
      <svg width={LARGEUR} height={HAUTEUR} className="shrink-0" aria-hidden="true">
        {coords.length > 1 && (
          <polyline
            points={chemin}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {coords.map(([x, y], i) => {
          const estAujourdhui = dernierEstAujourdhui && i === coords.length - 1
          return <circle key={i} cx={x} cy={y} r={estAujourdhui ? 3 : 2} fill={estAujourdhui ? couleurPoint : '#cbd5e1'} />
        })}
      </svg>
      {stagne !== null && <span className={`text-xs font-bold ${couleurTexte}`}>{stagne ? 'Monte !' : 'Progresse'}</span>}
    </span>
  )
}
