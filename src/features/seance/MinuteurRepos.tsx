import { useEffect, useRef, useState } from 'react'
import { useMinuteurRepos } from '../../hooks/useMinuteurRepos'

export function MinuteurRepos() {
  const etat = useMinuteurRepos()
  const [flash, setFlash] = useState(false)
  const dernierFlash = useRef<number | null>(null)

  useEffect(() => {
    if (!etat?.termine || dernierFlash.current === etat.serieId) return
    dernierFlash.current = etat.serieId
    setFlash(true)
    const id = setTimeout(() => setFlash(false), 2000)
    return () => clearTimeout(id)
  }, [etat?.termine, etat?.serieId])

  if (!etat) return null

  const minutes = Math.floor(etat.secondesRestantes / 60)
  const secondes = etat.secondesRestantes % 60

  return (
    <>
      {flash && <div className="pointer-events-none fixed inset-0 z-50 bg-emerald-400/70" />}
      <span
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-20 select-none text-center text-[7.5rem] font-bold leading-none text-red-600/10"
      >
        {minutes}:{String(secondes).padStart(2, '0')}
      </span>
    </>
  )
}
