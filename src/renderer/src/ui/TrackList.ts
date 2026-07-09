import type { SCTrack } from '@shared/types'
import { audioEngine } from '../player/AudioEngine'
import { icon } from './Icons'

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function renderTrackList(tracks: SCTrack[]): HTMLElement {
  const el = document.createElement('div')
  el.className = 'track-list'
  if (tracks.length === 0) {
    el.innerHTML = `<div class="empty-state">Rien à afficher ici.</div>`
    return el
  }
  tracks.forEach((track, index) => {
    const row = document.createElement('div')
    row.className = 'track-row'
    row.dataset.trackId = String(track.id)
    row.innerHTML = `
      <span class="track-num">${index + 1}</span>
      <img src="${track.artworkUrl ?? ''}" loading="lazy" alt="" />
      <div class="track-meta">
        <div class="track-title">${track.title}</div>
        <div class="track-artist">${track.artist}</div>
      </div>
      <div class="track-actions">
        <button title="Liker">${icon('heart')}</button>
      </div>
      <span class="track-duration">${formatDuration(track.duration)}</span>
    `
    row.addEventListener('click', () => void audioEngine.playQueue(tracks, index))
    el.appendChild(row)
  })
  audioEngine.state.subscribe((s) => {
    el.querySelectorAll('.track-row').forEach((row, i) => {
      row.classList.toggle('playing', s.track?.id === tracks[i]?.id)
    })
  })
  return el
}

export function renderCardGrid(tracks: SCTrack[]): HTMLElement {
  const el = document.createElement('div')
  el.className = 'card-grid'
  if (tracks.length === 0) {
    el.innerHTML = `<div class="empty-state">Rien à afficher.</div>`
    return el
  }
  tracks.forEach((track, index) => {
    const card = document.createElement('div')
    card.className = 'track-card'
    card.innerHTML = `
      <div class="track-card-art">
        <img src="${track.artworkUrl ?? ''}" loading="lazy" alt="" />
        <div class="play-overlay"><div class="play-icon">${icon('play')}</div></div>
      </div>
      <div class="track-card-info">
        <div class="track-card-title">${track.title}</div>
        <div class="track-card-artist">${track.artist}</div>
      </div>
    `
    card.addEventListener('click', () => void audioEngine.playQueue(tracks, index))
    audioEngine.state.subscribe((s) => card.classList.toggle('playing', s.track?.id === track.id))
    el.appendChild(card)
  })
  return el
}

export function renderPlayer(): HTMLElement {
  const el = document.createElement('div')
  el.className = 'player'
  el.innerHTML = `
    <div class="player-track">
      <img id="p-art" alt="" />
      <div class="player-track-info">
        <div class="player-title" id="p-title">—</div>
        <div class="player-artist" id="p-artist"></div>
      </div>
      <button class="player-like" id="p-like" title="Liker">${icon('heart')}</button>
    </div>
    <div class="player-controls">
      <div class="player-buttons">
        <button class="player-btn" id="p-shuffle" title="Aléatoire">${icon('shuffle')}</button>
        <button class="player-btn" id="p-prev" title="Précédent">${icon('skipBack')}</button>
        <button class="player-play" id="p-play">${icon('play')}</button>
        <button class="player-btn" id="p-next" title="Suivant">${icon('skipForward')}</button>
        <button class="player-btn" id="p-repeat" title="Répéter">${icon('repeat')}</button>
      </div>
      <div class="player-progress">
        <span class="player-time" id="p-pos">0:00</span>
        <input type="range" class="player-seek" id="p-seek" min="0" max="1000" value="0" />
        <span class="player-time right" id="p-dur">0:00</span>
      </div>
    </div>
    <div class="player-extras">
      <div class="player-vol">
        <span class="player-vol-icon">${icon('volume2')}</span>
        <input type="range" class="vol-slider" id="p-vol" min="0" max="1" step="0.01" value="0.8" />
      </div>
    </div>
  `

  const playBtn = el.querySelector('#p-play') as HTMLButtonElement
  el.querySelector('#p-prev')?.addEventListener('click', () => audioEngine.previous())
  el.querySelector('#p-next')?.addEventListener('click', () => audioEngine.next())
  el.querySelector('#p-shuffle')?.addEventListener('click', () => audioEngine.toggleShuffle())
  el.querySelector('#p-repeat')?.addEventListener('click', () => audioEngine.cycleRepeat())
  playBtn.addEventListener('click', () => audioEngine.toggle())
  ;(el.querySelector('#p-vol') as HTMLInputElement).addEventListener('input', (e) =>
    audioEngine.setVolume(Number((e.target as HTMLInputElement).value))
  )

  let seeking = false
  const seek = el.querySelector('#p-seek') as HTMLInputElement
  seek.addEventListener('mousedown', () => (seeking = true))
  seek.addEventListener('change', () => {
    audioEngine.seekTo((Number(seek.value) / 1000) * audioEngine.state.get().durationMs)
    seeking = false
  })

  audioEngine.state.subscribe((s) => {
    ;(el.querySelector('#p-art') as HTMLImageElement).src = s.track?.artworkUrl ?? ''
    el.querySelector('#p-title')!.textContent = s.track?.title ?? '—'
    el.querySelector('#p-artist')!.textContent = s.track?.artist ?? ''
    playBtn.innerHTML = s.state === 'playing' ? icon('pause') : icon('play')
    el.querySelector('#p-shuffle')?.classList.toggle('active', s.shuffle)
    const repeatBtn = el.querySelector('#p-repeat') as HTMLElement
    repeatBtn.innerHTML = s.repeat === 'one' ? icon('repeat1') : icon('repeat')
    repeatBtn.classList.toggle('active', s.repeat !== 'off')
    if (!seeking && s.durationMs > 0) seek.value = String((s.positionMs / s.durationMs) * 1000)
    el.querySelector('#p-pos')!.textContent = formatDuration(s.positionMs)
    el.querySelector('#p-dur')!.textContent = formatDuration(s.durationMs)
  })

  return el
}
