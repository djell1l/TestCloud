import { icon } from './Icons'

// Local type mirror of ReleaseInfo from main/updater.ts
// (can't import across main/renderer boundary directly)
export interface ReleaseInfo {
  version: string
  name: string
  body: string
  downloadUrl: string
  publishedAt: string
}

/**
 * Bannière discrète en haut de l'app qui s'affiche quand une update est dispo.
 * Se ferme si l'utilisateur la dismiss, et ne réapparaît pas avant la prochaine
 * version (stocké dans settings).
 */
export function initUpdateListener(): void {
  // L'ipcRenderer est exposé via le preload — on écoute l'event 'update:available'
  // envoyé par main/index.ts après le check GitHub
  window.addEventListener('bsc:update-available', async (e) => {
    const release = (e as CustomEvent<ReleaseInfo>).detail
    const dismissed = await window.bsc.settings.get(`update.dismissed.${release.version}`)
    if (dismissed) return
    showUpdateBanner(release)
  })
}

function showUpdateBanner(release: ReleaseInfo): void {
  // Retire une bannière existante si elle traîne
  document.getElementById('bsc-update-banner')?.remove()

  const banner = document.createElement('div')
  banner.id = 'bsc-update-banner'
  banner.style.cssText = `
    position: fixed; top: 38px; left: 0; right: 0; z-index: 9000;
    background: linear-gradient(90deg, #1a1a1a, #222);
    border-bottom: 1px solid var(--sc-orange);
    display: flex; align-items: center; justify-content: space-between;
    padding: 9px 20px; gap: 12px; font-size: 13px;
    animation: slideDown 0.25s ease;
  `

  const date = new Date(release.publishedAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  banner.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;color:var(--sc-text)">
      <span style="color:var(--sc-orange)">${icon('music')}</span>
      <span>
        <strong>BetterSoundCloud2 ${release.version}</strong> est disponible
        <span style="color:var(--sc-text-muted);margin-left:8px">${date}</span>
      </span>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <button id="update-dl-btn" style="
        background:var(--sc-orange);color:white;border:none;
        padding:5px 14px;border-radius:20px;font-size:12px;
        font-weight:600;cursor:pointer;
      ">Télécharger</button>
      <button id="update-changelog-btn" style="
        background:transparent;color:var(--sc-text-muted);border:1px solid var(--sc-border-light);
        padding:5px 12px;border-radius:20px;font-size:12px;cursor:pointer;
      ">Changelog</button>
      <button id="update-dismiss-btn" style="
        background:transparent;border:none;color:var(--sc-text-faint);
        cursor:pointer;padding:4px;display:flex;align-items:center;
      ">${icon('close')}</button>
    </div>
  `

  // Injecte l'animation
  if (!document.getElementById('bsc-update-styles')) {
    const style = document.createElement('style')
    style.id = 'bsc-update-styles'
    style.textContent = `@keyframes slideDown { from { transform: translateY(-100%); opacity:0; } to { transform: translateY(0); opacity:1; } }`
    document.head.appendChild(style)
  }

  banner.querySelector('#update-dl-btn')?.addEventListener('click', () => {
    void window.bsc.settings.set(`update.dismissed.${release.version}`, true)
    // Appel IPC pour ouvrir le navigateur sur la page de téléchargement
    void (window.bsc as any).update?.download(release.downloadUrl)
    // Fallback : window.open ne fonctionne pas en Electron mais le main gère ça
    banner.remove()
  })

  banner.querySelector('#update-changelog-btn')?.addEventListener('click', () => {
    showChangelog(release)
  })

  banner.querySelector('#update-dismiss-btn')?.addEventListener('click', async () => {
    await window.bsc.settings.set(`update.dismissed.${release.version}`, true)
    banner.style.animation = 'slideDown 0.2s ease reverse'
    setTimeout(() => banner.remove(), 200)
  })

  // Insère après la titlebar (premier enfant de #app)
  const app = document.getElementById('app')
  if (app) {
    app.insertBefore(banner, app.children[1])
  }
}

function showChangelog(release: ReleaseInfo): void {
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.7);
    display:flex;align-items:center;justify-content:center;z-index:9999;
  `
  overlay.innerHTML = `
    <div style="
      background:var(--sc-bg-elevated);border:1px solid var(--sc-border-light);
      border-radius:16px;width:520px;max-width:90vw;padding:28px;
      max-height:70vh;display:flex;flex-direction:column;
    ">
      <div style="font-size:18px;font-weight:700;margin-bottom:4px">
        BetterSoundCloud2 ${release.version}
      </div>
      <div style="font-size:12px;color:var(--sc-text-muted);margin-bottom:20px">
        ${new Date(release.publishedAt).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
      </div>
      <div style="
        flex:1;overflow-y:auto;font-size:13px;color:var(--sc-text-muted);
        line-height:1.7;white-space:pre-wrap;
      ">${release.body || 'Pas de notes de version.'}</div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">
        <button id="cl-close" style="
          background:transparent;color:var(--sc-text);border:1px solid var(--sc-border-light);
          padding:7px 16px;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;
        ">Fermer</button>
        <button id="cl-dl" style="
          background:var(--sc-orange);color:white;border:none;
          padding:7px 16px;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;
        ">Télécharger</button>
      </div>
    </div>
  `
  overlay.querySelector('#cl-close')?.addEventListener('click', () => overlay.remove())
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })
  overlay.querySelector('#cl-dl')?.addEventListener('click', () => {
    void (window.bsc as any).update?.download(release.downloadUrl)
    overlay.remove()
  })
  document.body.appendChild(overlay)
}
