import type { PlayerState, SCTrack } from '@shared/types'
import { Store } from '../state/store'

const initialState: PlayerState = {
  state: 'idle',
  track: null,
  positionMs: 0,
  durationMs: 0,
  volume: 0.8,
  shuffle: false,
  repeat: 'off',
  queue: [],
  queueIndex: -1
}

/**
 * The single source of truth for playback. Plugins observe this through
 * the BSC SDK (BSC.Player.*) instead of touching <audio> directly — that's
 * what lets us keep a stable plugin API even if we swap the audio backend
 * later (e.g. for gapless playback or an HLS player).
 */
export class AudioEngine {
  readonly state = new Store<PlayerState>(initialState)
  private audio = new Audio()

  constructor() {
    this.audio.addEventListener('timeupdate', () => {
      this.state.update((s) => ({ ...s, positionMs: this.audio.currentTime * 1000 }))
    })
    this.audio.addEventListener('loadedmetadata', () => {
      this.state.update((s) => ({ ...s, durationMs: this.audio.duration * 1000 }))
    })
    this.audio.addEventListener('ended', () => this.next())
    this.audio.addEventListener('play', () =>
      this.state.update((s) => ({ ...s, state: 'playing' }))
    )
    this.audio.addEventListener('pause', () =>
      this.state.update((s) => ({ ...s, state: 'paused' }))
    )
    this.audio.volume = initialState.volume
  }

  async playQueue(queue: SCTrack[], startIndex: number): Promise<void> {
    this.state.update((s) => ({ ...s, queue, queueIndex: startIndex }))
    await this.playIndex(startIndex)
  }

  private async playIndex(index: number): Promise<void> {
    const { queue } = this.state.get()
    const track = queue[index]
    if (!track) return

    this.state.update((s) => ({ ...s, state: 'loading', track, queueIndex: index }))
    const streamUrl = await window.bsc.soundcloud.getStreamUrl(track.id)
    this.audio.src = streamUrl
    await this.audio.play()
  }

  toggle(): void {
    if (this.audio.paused) void this.audio.play()
    else this.audio.pause()
  }

  seekTo(ms: number): void {
    this.audio.currentTime = ms / 1000
  }

  setVolume(v: number): void {
    this.audio.volume = v
    this.state.update((s) => ({ ...s, volume: v }))
  }

  next(): void {
    const { queue, queueIndex, repeat, shuffle } = this.state.get()
    if (queue.length === 0) return
    let nextIndex: number
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length)
    } else if (queueIndex + 1 < queue.length) {
      nextIndex = queueIndex + 1
    } else if (repeat === 'all') {
      nextIndex = 0
    } else {
      this.audio.pause()
      return
    }
    void this.playIndex(nextIndex)
  }

  previous(): void {
    const { queueIndex } = this.state.get()
    if (this.audio.currentTime > 3 || queueIndex <= 0) {
      this.audio.currentTime = 0
      return
    }
    void this.playIndex(queueIndex - 1)
  }

  toggleShuffle(): void {
    this.state.update((s) => ({ ...s, shuffle: !s.shuffle }))
  }

  cycleRepeat(): void {
    const order: PlayerState['repeat'][] = ['off', 'all', 'one']
    this.state.update((s) => ({ ...s, repeat: order[(order.indexOf(s.repeat) + 1) % order.length] }))
  }
}

export const audioEngine = new AudioEngine()
