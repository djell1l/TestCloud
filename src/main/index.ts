import { app, shell, BrowserWindow, ipcMain, nativeImage } from 'electron'
import path from 'node:path'
import { is } from '@electron-toolkit/utils'

// Force correct app name in taskbar/dock before any window is created
app.setName('TestCloud')
import { IPC } from '@shared/types'
import { soundcloud } from './soundcloud'
import {
  initUserland, listPlugins, listThemes,
  readPluginSource, readThemeCss, PLUGINS_DIR, THEMES_DIR
} from './userland'
import { settingsStore } from './settings'
import { checkForUpdates, openDownloadPage } from './updater'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const iconPath = path.join(__dirname, '../../resources/icon.ico')
  const icon = nativeImage.createFromPath(iconPath)

  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 960, minHeight: 600,
    show: false, frame: false, backgroundColor: '#121212',
    title: 'TestCloud',
    icon,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    // Check for updates 5s after launch, silently
    setTimeout(async () => {
      const release = await checkForUpdates()
      if (release && mainWindow) {
        mainWindow.webContents.send('update:available', release)
      }
    }, 5000)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

function registerIpc(): void {
  ipcMain.handle(IPC.AUTH_LOGIN, async () => soundcloud.login(mainWindow ?? undefined))
  ipcMain.handle(IPC.AUTH_LOGOUT, async () => soundcloud.logout())
  ipcMain.handle(IPC.AUTH_GET_STATE, async () => {
    try { const user = await soundcloud.getMe(); return { isAuthenticated: true, user } }
    catch { return { isAuthenticated: false, user: null } }
  })

  ipcMain.handle(IPC.SC_SEARCH, async (_e, query: string) => soundcloud.search(query))
  ipcMain.handle(IPC.SC_GET_STREAM_URL, async (_e, trackId: number) => soundcloud.getStreamUrl(trackId))
  ipcMain.handle(IPC.SC_GET_LIKES, async () => soundcloud.getLikes())
  ipcMain.handle(IPC.SC_GET_PLAYLISTS, async () => soundcloud.getPlaylists())
  ipcMain.handle(IPC.SC_GET_PLAYLIST_TRACKS, async (_e, id: number) => soundcloud.getPlaylistTracks(id))
  ipcMain.handle(IPC.SC_GET_STREAM_FEED, async () => soundcloud.getStreamFeed())

  ipcMain.handle(IPC.PLUGINS_LIST, async () => listPlugins())
  ipcMain.handle(IPC.PLUGINS_READ_SOURCE, async (_e, folder: string, main: string) => readPluginSource(folder, main))
  ipcMain.handle(IPC.PLUGINS_TOGGLE, async (_e, name: string, enabled: boolean) => {
    const enabledPlugins = new Set(settingsStore.get('enabledPlugins'))
    enabled ? enabledPlugins.add(name) : enabledPlugins.delete(name)
    settingsStore.set('enabledPlugins', Array.from(enabledPlugins))
  })
  ipcMain.handle(IPC.PLUGINS_OPEN_FOLDER, async () => shell.openPath(PLUGINS_DIR))

  ipcMain.handle(IPC.THEMES_LIST, async () => listThemes())
  ipcMain.handle(IPC.THEMES_READ_CSS, async (_e, folder: string, cssFile: string) => readThemeCss(folder, cssFile))
  ipcMain.handle(IPC.THEMES_SET_ACTIVE, async (_e, name: string | null) => settingsStore.set('activeTheme', name))
  ipcMain.handle(IPC.THEMES_GET_ACTIVE, async () => settingsStore.get('activeTheme'))
  ipcMain.handle(IPC.THEMES_OPEN_FOLDER, async () => shell.openPath(THEMES_DIR))

  ipcMain.handle(IPC.SETTINGS_GET, async (_e, key: string) => settingsStore.get(key))
  ipcMain.handle(IPC.SETTINGS_SET, async (_e, key: string, value: unknown) => settingsStore.set(key, value))

  ipcMain.on(IPC.WINDOW_MINIMIZE, () => mainWindow?.minimize())
  ipcMain.on(IPC.WINDOW_MAXIMIZE, () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize())
  ipcMain.on(IPC.WINDOW_CLOSE, () => mainWindow?.close())

  // Updater
  ipcMain.handle('update:download', async (_e, url: string) => openDownloadPage(url))
}

app.whenReady().then(async () => {
  await initUserland()
  registerIpc()
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
