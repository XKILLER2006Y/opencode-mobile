import { useEffect, useState } from "react"

// One shared interval for every running tool card, ref-counted across
// subscribers. Per-card setInterval timers would each wake React and force a
// re-render of the whole list — with several tools running that's a
// re-render storm. A single module-scope timer bumps one shared clock and
// every subscriber re-renders from it.
type Listener = () => void

let subscribers = 0
let intervalID: ReturnType<typeof setInterval> | null = null
let now = Date.now()
const listeners = new Set<Listener>()

function tick() {
  now = Date.now()
  listeners.forEach((l) => l())
}

export function useLiveNow(active: boolean): number {
  const [, setVersion] = useState(0)

  useEffect(() => {
    if (!active) return
    const listener: Listener = () => setVersion((v) => v + 1)
    listeners.add(listener)
    subscribers += 1
    now = Date.now()
    if (intervalID === null) intervalID = setInterval(tick, 1000)
    return () => {
      listeners.delete(listener)
      subscribers -= 1
      if (subscribers === 0 && intervalID !== null) {
        clearInterval(intervalID)
        intervalID = null
      }
    }
  }, [active])

  return now
}
