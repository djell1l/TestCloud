import { audioEngine } from '../player/AudioEngine'
import type { PlayerState, SCTrack } from '@shared/types'

type EventName = 'trackchange' | 'playstatechange' | 'queuechange'
type EventHandler = (state: PlayerState) => void

class EventBus {
  private handlers: Record<EventName, Set<EventHandler>> = {
    trackchange: new Set(),
    playstatechange: new Set(),
    queuechange: new Set()
  }

  on(event: EventName, handler: EventHandler): () => void {
    this.handlers[event].add(handler)
    return () => this.handlers[event].delete(handler)
  }

  emit(event: EventName, state: PlayerState): void {
    this.handlers[event].forEach((h) => h(state))
  }
}

const bus = new EventBus()

let lastTrackId: number | null = null
let lastPlayState: PlayerState['state'] | null = null
audioEngine.state.subscribe((s) => {
  if (s.track?.id !== lastTrackId) {
    lastTrackId = s.track?.id ?? null
    bus.emit('trackchange', s)
  }
  if (s.state !== lastPlayState) {
    lastPlayState = s.state
    bus.emit('playstatechange', s)
  }
})

/**
 * BSC — the API surface plugins are allowed to touch. Keep this small and
 * stable; anything internal (AudioEngine internals, IPC channel names...)
 * stays out of here on purpose so plugins don't end up depending on
 * implementation details that we want to be free to change.
 */
export const BSC = {
  Player: {
    getState: (): PlayerState => audioEngine.state.get(),
    play: (): void => audioEngine.toggle(),
    pause: (): void => audioEngine.toggle(),
    next: (): void => audioEngine.next(),
    previous: (): void => audioEngine.previous(),
    seekTo: (ms: number): void => audioEngine.seekTo(ms),
    setVolume: (v: number): void => audioEngine.setVolume(v)
  },
  Events: {
    on: (event: EventName, handler: EventHandler): (() => void) => bus.on(event, handler),
    off: (event: EventName, handler: EventHandler): void => {
      bus.on(event, handler)() // subscribe-then-immediately-unsubscribe trick keeps a single removal path
    }
  },
  SoundCloud: {
    search: (q: string): Promise<SCTrack[]> => window.bsc.soundcloud.search(q),
    getLikes: (): Promise<SCTrack[]> => window.bsc.soundcloud.getLikes()
  },
  UI: {
    /** Lets a plugin mount its own panel/button into a named slot we expose in the DOM. */
    registerSlot(slotId: string, element: HTMLElement): void {
      const slot = document.querySelector(`[data-bsc-slot="${slotId}"]`)
      slot?.appendChild(element)
    },
    showToast(message: string): void {
      const toast = document.createElement('div')
      toast.textContent = message
      toast.style.cssText =
        'position:fixed;bottom:110px;right:20px;background:var(--bsc-bg-active);color:var(--bsc-text);padding:10px 16px;border-radius:8px;font-size:13px;z-index:9999;box-shadow:0 4px 14px rgba(0,0,0,.4)'
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 3000)
    }
  },
  Settings: {
    get: (pluginName: string, key: string): Promise<unknown> =>
      window.bsc.settings.get(`plugin.${pluginName}.${key}`),
    set: (pluginName: string, key: string, value: unknown): Promise<void> =>
      window.bsc.settings.set(`plugin.${pluginName}.${key}`, value)
  }
}

export function installSdk(): void {
  window.BSC = BSC
}
