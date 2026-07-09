import type { SCTrack, SCUser } from '@shared/types'
import { renderCardGrid, renderTrackList } from './TrackList'
import { icon } from './Icons'

function loading(): HTMLElement {
  const el = document.createElement('div')
  el.className = 'loading'
  el.innerHTML = '<div class="spinner"></div>'
  return el
}

export function renderLoginPrompt(onLogin: () => void): HTMLElement {
  const el = document.createElement('div')
  el.className = 'view-content'
  el.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:20px;text-align:center'
  el.innerHTML = `
    <div style="color:var(--sc-orange)">${icon('music').replace('18', '48')}</div>
    <div style="font-size:22px;font-weight:700">Connecte-toi à SoundCloud</div>
    <div style="color:var(--sc-text-muted);max-width:380px;line-height:1.6">
      La connexion se fait directement sur soundcloud.com — tes identifiants ne passent jamais par nous.
    </div>
  `
  const btn = document.createElement('button')
  btn.className = 'btn btn-primary'
  btn.textContent = 'Se connecter'
  btn.addEventListener('click', onLogin)
  el.appendChild(btn)
  return el
}

export async function renderFeedView(): Promise<HTMLElement> {
  const wrap = document.createElement('div')
  wrap.className = 'main-view'
  const el = document.createElement('div')
  el.className = 'view-content'
  wrap.appendChild(el)
  el.innerHTML = `<div class="view-header"><div><div class="view-title">Stream</div><div class="view-subtitle">Les dernières sorties de ceux que tu suis</div></div></div>`
  const spin = loading(); el.appendChild(spin)
  try {
    const tracks = await window.bsc.soundcloud.getStreamFeed()
    spin.remove()
    el.appendChild(renderCardGrid(tracks))
  } catch {
    spin.remove()
    el.appendChild(renderLoginPrompt(async () => { await window.bsc.auth.login(); location.reload() }))
  }
  return wrap
}

export function renderSearchView(initialQuery = ''): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'main-view'
  const el = document.createElement('div')
  el.className = 'view-content'
  wrap.appendChild(el)
  el.innerHTML = `<div class="view-header"><div class="view-title">Recherche</div></div>`
  const resultsContainer = document.createElement('div')
  el.appendChild(resultsContainer)

  const doSearch = async (query: string): Promise<void> => {
    resultsContainer.innerHTML = ''
    if (!query.trim()) return
    const spin = loading(); resultsContainer.appendChild(spin)
    try {
      const tracks: SCTrack[] = await window.bsc.soundcloud.search(query)
      spin.remove()
      const header = document.createElement('div')
      header.style.cssText = 'font-size:13px;color:var(--sc-text-muted);margin-bottom:12px'
      header.textContent = `${tracks.length} résultats pour "${query}"`
      resultsContainer.appendChild(header)
      resultsContainer.appendChild(renderTrackList(tracks))
    } catch { spin.remove() }
  }

  if (initialQuery) void doSearch(initialQuery)
  return wrap
}

export async function renderLikesView(): Promise<HTMLElement> {
  const wrap = document.createElement('div')
  wrap.className = 'main-view'
  const el = document.createElement('div')
  el.className = 'view-content'
  wrap.appendChild(el)
  el.innerHTML = `<div class="view-header"><div><div class="view-title">Likes</div><div class="view-subtitle">Tes titres likés</div></div></div>`
  const spin = loading(); el.appendChild(spin)
  try {
    const tracks = await window.bsc.soundcloud.getLikes()
    spin.remove()
    el.appendChild(renderTrackList(tracks))
  } catch {
    spin.remove()
    el.appendChild(renderLoginPrompt(async () => { await window.bsc.auth.login(); location.reload() }))
  }
  return wrap
}

export async function renderPlaylistsView(): Promise<HTMLElement> {
  const wrap = document.createElement('div')
  wrap.className = 'main-view'
  const el = document.createElement('div')
  el.className = 'view-content'
  wrap.appendChild(el)
  el.innerHTML = `<div class="view-header"><div class="view-title">Playlists</div></div>`
  const spin = loading(); el.appendChild(spin)
  try {
    const playlists = await window.bsc.soundcloud.getPlaylists()
    spin.remove()
    if (playlists.length === 0) {
      el.innerHTML += `<div class="empty-state">Aucune playlist trouvée.</div>`
      return wrap
    }
    for (const playlist of playlists) {
      const section = document.createElement('div')
      section.style.marginBottom = '32px'
      section.innerHTML = `
        <div class="view-header" style="margin-bottom:12px">
          <div>
            <div class="view-title" style="font-size:17px">${playlist.title}</div>
            <div class="view-subtitle">${playlist.trackCount} titres</div>
          </div>
        </div>
      `
      el.appendChild(section)
      const spinPl = loading(); section.appendChild(spinPl)
      window.bsc.soundcloud.getPlaylistTracks(playlist.id).then(tracks => {
        spinPl.remove()
        section.appendChild(renderTrackList(tracks))
      })
    }
  } catch {
    spin.remove()
    el.appendChild(renderLoginPrompt(async () => { await window.bsc.auth.login(); location.reload() }))
  }
  return wrap
}

export async function renderProfileView(user: SCUser): Promise<HTMLElement> {
  const wrap = document.createElement('div')
  wrap.className = 'main-view'

  // Banner
  const banner = document.createElement('div')
  banner.className = 'profile-banner'
  banner.innerHTML = `
    <button class="profile-banner-edit btn btn-sm">
      ${icon('camera')} Modifier la bannière
    </button>
  `
  wrap.appendChild(banner)

  // Info
  const info = document.createElement('div')
  info.className = 'profile-info'
  info.innerHTML = `
    <div class="profile-avatar-wrap">
      <img class="profile-avatar" src="${user.avatarUrl ?? ''}" alt="${user.username}" />
      <button class="avatar-edit-btn" title="Changer la photo">${icon('camera')}</button>
    </div>
    <div class="profile-details">
      <div class="profile-name">${user.username}</div>
      <div class="profile-bio" id="profile-bio-text">Chargement...</div>
      <div class="profile-actions">
        <button class="btn btn-primary btn-sm" id="edit-profile-btn">
          ${icon('edit')} Modifier le profil
        </button>
        <a href="${user.permalinkUrl}" class="btn btn-ghost btn-sm" style="text-decoration:none;display:inline-flex;align-items:center;gap:5px" target="_blank">
          ${icon('externalLink')} Voir sur SoundCloud
        </a>
      </div>
    </div>
  `
  wrap.appendChild(info)

  // Tabs
  const content = document.createElement('div')
  content.className = 'view-content'
  content.style.paddingTop = '0'
  const tabs = document.createElement('div')
  tabs.className = 'tabs'
  tabs.innerHTML = `
    <div class="tab active" data-tab="likes">${icon('heart')} Likes</div>
    <div class="tab" data-tab="playlists">${icon('list')} Playlists</div>
  `
  content.appendChild(tabs)
  const tabContent = document.createElement('div')
  content.appendChild(tabContent)
  wrap.appendChild(content)

  const loadTab = async (tab: string): Promise<void> => {
    tabContent.innerHTML = ''
    const spin = loading(); tabContent.appendChild(spin)
    try {
      if (tab === 'likes') {
        const tracks = await window.bsc.soundcloud.getLikes()
        spin.remove()
        tabContent.appendChild(renderTrackList(tracks))
      } else {
        const playlists = await window.bsc.soundcloud.getPlaylists()
        spin.remove()
        for (const pl of playlists) {
          const h = document.createElement('div')
          h.style.cssText = 'font-weight:600;margin:16px 0 8px;font-size:15px'
          h.textContent = pl.title
          tabContent.appendChild(h)
          const tracks = await window.bsc.soundcloud.getPlaylistTracks(pl.id)
          tabContent.appendChild(renderTrackList(tracks))
        }
      }
    } catch { spin.remove() }
  }

  tabs.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      void loadTab(tab.getAttribute('data-tab') ?? 'likes')
    })
  })

  void loadTab('likes')

  info.querySelector('#edit-profile-btn')?.addEventListener('click', () => showEditProfileModal(user))

  return wrap
}

function showEditProfileModal(user: SCUser): void {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-title">Modifier le profil</div>
      <div class="form-group">
        <label class="form-label">Nom d'affichage</label>
        <input class="form-input" id="edit-displayname" value="${user.username}" />
      </div>
      <div class="form-group">
        <label class="form-label">Bio</label>
        <textarea class="form-input" id="edit-bio" placeholder="Parle de toi..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Ville</label>
        <input class="form-input" id="edit-city" placeholder="Paris, France" />
      </div>
      <div class="form-group">
        <label class="form-label">Site web</label>
        <input class="form-input" id="edit-website" placeholder="https://ton-site.com" />
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="modal-cancel">Annuler</button>
        <button class="btn btn-primary" id="modal-save">Enregistrer</button>
      </div>
    </div>
  `
  overlay.querySelector('#modal-cancel')?.addEventListener('click', () => overlay.remove())
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })
  overlay.querySelector('#modal-save')?.addEventListener('click', async () => {
    const saveBtn = overlay.querySelector('#modal-save') as HTMLButtonElement
    saveBtn.textContent = 'Enregistrement...'
    saveBtn.disabled = true
    try {
      await window.bsc.settings.set('profile.draft', JSON.stringify({
        displayName: (overlay.querySelector('#edit-displayname') as HTMLInputElement).value,
        bio: (overlay.querySelector('#edit-bio') as HTMLTextAreaElement).value,
        city: (overlay.querySelector('#edit-city') as HTMLInputElement).value,
        website: (overlay.querySelector('#edit-website') as HTMLInputElement).value,
      }))
      showToast('Profil mis à jour')
      overlay.remove()
    } catch {
      showToast('Erreur lors de la sauvegarde')
      saveBtn.textContent = 'Enregistrer'
      saveBtn.disabled = false
    }
  })
  document.body.appendChild(overlay)
}

function showToast(msg: string): void {
  const t = document.createElement('div')
  t.className = 'toast'
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 3000)
}
