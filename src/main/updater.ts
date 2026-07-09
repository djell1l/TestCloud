/**
 * Auto-update checker — polls GitHub Releases API and notifies the renderer.
 * No auto-download, no electron-updater, just a clean notification.
 * The user choisit de télécharger ou pas.
 */
import { net, BrowserWindow, shell } from 'electron'
import { app } from 'electron'

const GITHUB_REPO = 'TON_USERNAME/TestCloud' // à remplacer par ton vrai username GitHub
const CURRENT_VERSION = app.getVersion()

export interface ReleaseInfo {
  version: string
  name: string
  body: string
  downloadUrl: string
  publishedAt: string
}

function semverGreater(a: string, b: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number)
  const [aMaj, aMin, aPatch] = parse(a)
  const [bMaj, bMin, bPatch] = parse(b)
  if (aMaj !== bMaj) return aMaj > bMaj
  if (aMin !== bMin) return aMin > bMin
  return aPatch > bPatch
}

export async function checkForUpdates(): Promise<ReleaseInfo | null> {
  try {
    const res = await net.fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      { headers: { 'User-Agent': 'BetterSoundCloud2-UpdateChecker' } }
    )
    if (!res.ok) return null

    const release = await res.json() as {
      tag_name: string
      name: string
      body: string
      published_at: string
      assets: Array<{ name: string; browser_download_url: string }>
    }

    const latestVersion = release.tag_name
    if (!semverGreater(latestVersion, CURRENT_VERSION)) return null

    // Trouve l'asset Windows (.exe ou .zip)
    const windowsAsset = release.assets.find(a =>
      a.name.endsWith('.exe') || a.name.endsWith('.zip') || a.name.includes('win')
    )

    return {
      version: latestVersion,
      name: release.name,
      body: release.body,
      downloadUrl: windowsAsset?.browser_download_url ?? `https://github.com/${GITHUB_REPO}/releases/latest`,
      publishedAt: release.published_at
    }
  } catch {
    return null
  }
}

export function showUpdateNotification(win: BrowserWindow, release: ReleaseInfo): void {
  // Envoie l'info au renderer qui affiche la notification
  win.webContents.send('update:available', release)
}

export async function openDownloadPage(url: string): Promise<void> {
  await shell.openExternal(url)
}
