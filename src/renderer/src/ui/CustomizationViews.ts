import { icon } from './Icons'

export async function renderPluginsView(): Promise<HTMLElement> {
  const wrap = document.createElement('div')
  wrap.className = 'main-view'
  const el = document.createElement('div')
  el.className = 'view-content'
  wrap.appendChild(el)
  el.innerHTML = `<div class="view-header"><div><div class="view-title">Plugins</div><div class="view-subtitle">Étends BetterSoundCloud avec des plugins communautaires</div></div></div>`

  const openBtn = document.createElement('button')
  openBtn.className = 'btn btn-ghost btn-sm'
  openBtn.innerHTML = `${icon('folder')} Ouvrir le dossier`
  openBtn.style.marginBottom = '20px'
  openBtn.addEventListener('click', () => window.bsc.plugins.openFolder())
  el.appendChild(openBtn)

  const plugins = await window.bsc.plugins.list()
  const enabledList = (await window.bsc.settings.get('enabledPlugins')) as string[] | undefined
  const enabled = new Set(enabledList ?? [])

  if (plugins.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'empty-state'
    empty.textContent = 'Aucun plugin installé. Dépose un dossier avec un manifest.json dans le dossier plugins.'
    el.appendChild(empty)
    return wrap
  }

  const list = document.createElement('div')
  list.className = 'track-list'
  plugins.forEach(p => {
    const row = document.createElement('div')
    row.className = 'track-row'
    row.style.gridTemplateColumns = '1fr auto'
    row.innerHTML = `
      <div class="track-meta">
        <div class="track-title">${p.displayName} <span style="color:var(--sc-text-faint);font-weight:400">v${p.version}</span></div>
        <div class="track-artist">${p.description} — par ${p.author}</div>
      </div>
    `
    const toggle = document.createElement('button')
    toggle.className = `btn btn-sm ${enabled.has(p.name) ? 'btn-primary' : 'btn-ghost'}`
    toggle.textContent = enabled.has(p.name) ? 'Activé' : 'Activer'
    toggle.addEventListener('click', async () => {
      const isEnabled = enabled.has(p.name)
      await window.bsc.plugins.toggle(p.name, !isEnabled)
      isEnabled ? enabled.delete(p.name) : enabled.add(p.name)
      toggle.className = `btn btn-sm ${enabled.has(p.name) ? 'btn-primary' : 'btn-ghost'}`
      toggle.textContent = enabled.has(p.name) ? 'Activé' : 'Activer'
    })
    row.appendChild(toggle)
    list.appendChild(row)
  })
  el.appendChild(list)
  return wrap
}

export async function renderThemesView(): Promise<HTMLElement> {
  const wrap = document.createElement('div')
  wrap.className = 'main-view'
  const el = document.createElement('div')
  el.className = 'view-content'
  wrap.appendChild(el)
  el.innerHTML = `<div class="view-header"><div><div class="view-title">Thèmes</div><div class="view-subtitle">Personnalise l'apparence de BetterSoundCloud</div></div></div>`

  const openBtn = document.createElement('button')
  openBtn.className = 'btn btn-ghost btn-sm'
  openBtn.innerHTML = `${icon('folder')} Ouvrir le dossier`
  openBtn.style.marginBottom = '20px'
  openBtn.addEventListener('click', () => window.bsc.themes.openFolder())
  el.appendChild(openBtn)

  const themes = await window.bsc.themes.list()
  const active = await window.bsc.themes.getActive()
  const list = document.createElement('div')
  list.className = 'track-list'

  const noneRow = document.createElement('div')
  noneRow.className = 'track-row'
  noneRow.style.gridTemplateColumns = '1fr auto'
  noneRow.innerHTML = `<div class="track-meta"><div class="track-title">Par défaut</div><div class="track-artist">Thème original BetterSoundCloud</div></div>`
  const noneBtn = document.createElement('button')
  noneBtn.className = `btn btn-sm ${active === null ? 'btn-primary' : 'btn-ghost'}`
  noneBtn.textContent = active === null ? 'Actif' : 'Activer'
  noneBtn.addEventListener('click', async () => { await window.bsc.themes.setActive(null); location.reload() })
  noneRow.appendChild(noneBtn)
  list.appendChild(noneRow)

  themes.forEach(t => {
    const row = document.createElement('div')
    row.className = 'track-row'
    row.style.gridTemplateColumns = '1fr auto'
    row.innerHTML = `<div class="track-meta"><div class="track-title">${t.displayName}</div><div class="track-artist">par ${t.author}</div></div>`
    const btn = document.createElement('button')
    btn.className = `btn btn-sm ${active === t.name ? 'btn-primary' : 'btn-ghost'}`
    btn.textContent = active === t.name ? 'Actif' : 'Activer'
    btn.addEventListener('click', async () => { await window.bsc.themes.setActive(t.name); location.reload() })
    row.appendChild(btn)
    list.appendChild(row)
  })
  el.appendChild(list)
  return wrap
}
