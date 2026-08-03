import { useEffect, useState } from 'react'

export function useChronometre(dateDebutIso: string | undefined): number {
  const [secondes, setSecondes] = useState(() =>
    dateDebutIso ? Math.max(0, Math.floor((Date.now() - new Date(dateDebutIso).getTime()) / 1000)) : 0,
  )

  useEffect(() => {
    if (!dateDebutIso) return
    const id = setInterval(() => {
      setSecondes(Math.max(0, Math.floor((Date.now() - new Date(dateDebutIso).getTime()) / 1000)))
    }, 1000)
    return () => clearInterval(id)
  }, [dateDebutIso])

  return secondes
}

export function formatDuree(secondes: number): string {
  const h = Math.floor(secondes / 3600)
  const m = Math.floor((secondes % 3600) / 60)
  const s = secondes % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}
