import type { SCUser } from '@shared/types'
import { icon } from './Icons'

export type ViewName = 'feed' | 'search' | 'likes' | 'playlists' | 'profile' | 'plugins' | 'themes'

const NAV = [
  { id: 'feed' as ViewName, label: 'Stream', iconName: 'home' },
  { id: 'likes' as ViewName, label: 'Likes', iconName: 'heart' },
  { id: 'playlists' as ViewName, label: 'Playlists', iconName: 'list' },
]
const NAV_CUSTOM = [
  { id: 'plugins' as ViewName, label: 'Plugins', iconName: 'settings' },
  { id: 'themes' as ViewName, label: 'Thèmes', iconName: 'palette' },
]

export function renderSidebar(onNavigate: (view: ViewName) => void, user: SCUser | null): HTMLElement {
  const el = document.createElement('div')
  el.className = 'sidebar'

  // User card
  if (user) {
    const card = document.createElement('div')
    card.className = 'sidebar-user'
    card.innerHTML = `
      <img src="${user.avatarUrl ?? ''}" alt="${user.username}" />
      <div class="user-info">
        <div class="user-name">${user.username}</div>
        <div class="user-handle">Mon profil</div>
      </div>
    `
    card.addEventListener('click', () => {
      el.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'))
      onNavigate('profile')
    })
    el.appendChild(card)
  }

  // Separator
  const sep = document.createElement('div')
  sep.style.cssText = 'height:1px;background:var(--sc-border);margin:8px 12px'
  el.appendChild(sep)

  // Main nav
  NAV.forEach(item => el.appendChild(buildItem(item, el, onNavigate)))

  // Customization section
  const label = document.createElement('div')
  label.className = 'sidebar-label'
  label.style.marginTop = '16px'
  label.textContent = 'Personnalisation'
  el.appendChild(label)
  NAV_CUSTOM.forEach(item => el.appendChild(buildItem(item, el, onNavigate)))

  // Plugin slot
  const slot = document.createElement('div')
  slot.dataset.bscSlot = 'sidebar-footer'
  el.appendChild(slot)

  // Activate feed by default
  el.querySelector('[data-view="feed"]')?.classList.add('active')
  return el
}

function buildItem(
  item: { id: ViewName; label: string; iconName: string },
  sidebar: HTMLElement,
  onNavigate: (v: ViewName) => void
): HTMLElement {
  const btn = document.createElement('div')
  btn.className = 'nav-item'
  btn.dataset.view = item.id
  btn.innerHTML = `<span class="nav-icon">${icon(item.iconName)}</span><span>${item.label}</span>`
  btn.addEventListener('click', () => {
    sidebar.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'))
    btn.classList.add('active')
    onNavigate(item.id)
  })
  return btn
}
