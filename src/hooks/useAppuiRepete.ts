import { useRef } from 'react'

export function useAppuiRepete(action: () => void) {
  const intervalleRef = useRef<number | null>(null)
  const delaiRef = useRef<number | null>(null)

  function arreter() {
    if (delaiRef.current !== null) {
      clearTimeout(delaiRef.current)
      delaiRef.current = null
    }
    if (intervalleRef.current !== null) {
      clearInterval(intervalleRef.current)
      intervalleRef.current = null
    }
  }

  function demarrer() {
    action()
    delaiRef.current = window.setTimeout(() => {
      intervalleRef.current = window.setInterval(action, 100)
    }, 450)
  }

  return {
    onPointerDown: demarrer,
    onPointerUp: arreter,
    onPointerLeave: arreter,
    onPointerCancel: arreter,
  }
}
