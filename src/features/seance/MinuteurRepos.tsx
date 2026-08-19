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

  return (
    <>
      {flash && <div className="pointer-events-none fixed inset-0 z-50 bg-emerald-400/70" />}
      {etat && (
        <span className="select-none text-3xl font-extrabold leading-none text-red-600">
          {Math.floor(etat.secondesRestantes / 60)}:{String(etat.secondesRestantes % 60).padStart(2, '0')}
        </span>
      )}
    </>
  )
}
