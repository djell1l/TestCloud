import './styles/tokens.css'
import './styles/app.css'
import { renderTitlebar } from './ui/Titlebar'
import { renderSidebar, type ViewName } from './ui/Sidebar'
import { renderPlayer } from './ui/TrackList'
import {
  renderFeedView, renderSearchView, renderLikesView,
  renderPlaylistsView, renderProfileView, renderLoginPrompt
} from './ui/Views'
import { renderPluginsView, renderThemesView } from './ui/CustomizationViews'
import { installSdk } from './sdk/BscSDK'
import { loadActiveTheme, loadPlugins } from './sdk/PluginHost'
import { initUpdateListener } from './ui/UpdateBanner'
import type { SCUser } from '@shared/types'

let currentUser: SCUser | null = null
let mainViewEl: HTMLElement | null = null

async function renderView(name: ViewName, query = ''): Promise<HTMLElement> {
  switch (name) {
    case 'feed':      return renderFeedView()
    case 'search':    return renderSearchView(query)
    case 'likes':     return renderLikesView()
    case 'playlists': return renderPlaylistsView()
    case 'profile':   return currentUser ? renderProfileView(currentUser) : renderFeedView()
    case 'plugins':   return renderPluginsView()
    case 'themes':    return renderThemesView()
  }
}

async function navigate(view: ViewName, query = ''): Promise<void> {
  if (!mainViewEl) return
  mainViewEl.innerHTML = ''
  mainViewEl.appendChild(await renderView(view, query))
}

async function bootstrap(): Promise<void> {
  installSdk()
  await loadActiveTheme()

  const authState = await window.bsc.auth.getState()
  currentUser = authState.user

  const app = document.getElementById('app')!

  app.appendChild(renderTitlebar((query) => void navigate('search', query)))

  const body = document.createElement('div')
  body.className = 'body'

  const sidebar = renderSidebar((view) => void navigate(view), currentUser)
  mainViewEl = document.createElement('div')
  mainViewEl.style.cssText = 'overflow:hidden;display:contents'

  body.appendChild(sidebar)
  body.appendChild(mainViewEl)
  app.appendChild(body)
  app.appendChild(renderPlayer())

  if (currentUser) {
    await navigate('feed')
  } else {
    const placeholder = document.createElement('div')
    placeholder.className = 'main-view'
    const content = document.createElement('div')
    content.className = 'view-content'
    content.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:80vh'
    placeholder.appendChild(content)
    content.appendChild(renderLoginPrompt(async () => {
      try { await window.bsc.auth.login(); location.reload() }
      catch (e) { console.error('Login failed', e) }
    }))
    mainViewEl.appendChild(placeholder)
  }

  // Init update checker listener (affiche la bannière si update dispo)
  initUpdateListener()

  await loadPlugins()
}

void bootstrap()
