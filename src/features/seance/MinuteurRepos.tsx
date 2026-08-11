import { useMinuteurRepos } from '../../hooks/useMinuteurRepos'

export function MinuteurRepos() {
  const etat = useMinuteurRepos()
  if (!etat) return null

  const minutes = Math.floor(etat.secondesRestantes / 60)
  const secondes = etat.secondesRestantes % 60

  return (
    <span className={`text-sm font-normal ${etat.termine ? 'text-red-500' : 'text-slate-400'}`}>
      · repos {minutes}:{String(secondes).padStart(2, '0')}
    </span>
  )
}
