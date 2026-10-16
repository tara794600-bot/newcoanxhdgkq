type FirebaseClient = typeof import('./firebase')

// Cancel both scheduled work and subscriptions when a route unmounts. In
// particular, an import resolving after cleanup must never attach a listener.
export function subscribeToFirebase(
  subscribe: (client: FirebaseClient) => () => void,
  onError: (error: unknown) => void,
  defer = false,
): () => void {
  let active = true
  let started = false
  let unsubscribe: (() => void) | undefined
  let idleId: number | undefined
  let deadlineId: number | undefined

  const start = () => {
    if (!active || started) return
    started = true
    window.clearTimeout(deadlineId)
    void import('./firebase').then((client) => {
      if (active) unsubscribe = subscribe(client)
    }).catch((error: unknown) => {
      if (active) onError(error)
    })
  }

  const schedule = () => {
    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(start, { timeout: 1500 })
    } else {
      start()
    }
  }

  if (defer) {
    // Slow images or third-party tags must not indefinitely delay live data.
    deadlineId = window.setTimeout(start, 2500)
    if (document.readyState === 'complete') schedule()
    else window.addEventListener('load', schedule, { once: true })
  } else {
    start()
  }

  return () => {
    active = false
    window.removeEventListener('load', schedule)
    window.clearTimeout(deadlineId)
    if (idleId !== undefined) window.cancelIdleCallback(idleId)
    unsubscribe?.()
  }
}

export const isFirebaseError = (error: unknown): error is Error & { code: string } =>
  error instanceof Error && 'code' in error && typeof error.code === 'string'
