import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/types'
import type { AuthState, SCTrack, SCPlaylist, PluginManifest, ThemeManifest } from '@shared/types'

const api = {
  auth: {
    login: (): Promise<unknown> => ipcRenderer.invoke(IPC.AUTH_LOGIN),
    logout: (): Promise<void> => ipcRenderer.invoke(IPC.AUTH_LOGOUT),
    getState: (): Promise<AuthState> => ipcRenderer.invoke(IPC.AUTH_GET_STATE)
  },
  soundcloud: {
    search: (query: string): Promise<SCTrack[]> => ipcRenderer.invoke(IPC.SC_SEARCH, query),
    getStreamUrl: (trackId: number): Promise<string> => ipcRenderer.invoke(IPC.SC_GET_STREAM_URL, trackId),
    getLikes: (): Promise<SCTrack[]> => ipcRenderer.invoke(IPC.SC_GET_LIKES),
    getPlaylists: (): Promise<SCPlaylist[]> => ipcRenderer.invoke(IPC.SC_GET_PLAYLISTS),
    getPlaylistTracks: (id: number): Promise<SCTrack[]> => ipcRenderer.invoke(IPC.SC_GET_PLAYLIST_TRACKS, id),
    getStreamFeed: (): Promise<SCTrack[]> => ipcRenderer.invoke(IPC.SC_GET_STREAM_FEED)
  },
  plugins: {
    list: (): Promise<Array<PluginManifest & { folder: string }>> => ipcRenderer.invoke(IPC.PLUGINS_LIST),
    readSource: (folder: string, main: string): Promise<string> => ipcRenderer.invoke(IPC.PLUGINS_READ_SOURCE, folder, main),
    toggle: (name: string, enabled: boolean): Promise<void> => ipcRenderer.invoke(IPC.PLUGINS_TOGGLE, name, enabled),
    openFolder: (): Promise<void> => ipcRenderer.invoke(IPC.PLUGINS_OPEN_FOLDER)
  },
  themes: {
    list: (): Promise<Array<ThemeManifest & { folder: string }>> => ipcRenderer.invoke(IPC.THEMES_LIST),
    readCss: (folder: string, cssFile: string): Promise<string> => ipcRenderer.invoke(IPC.THEMES_READ_CSS, folder, cssFile),
    setActive: (name: string | null): Promise<void> => ipcRenderer.invoke(IPC.THEMES_SET_ACTIVE, name),
    getActive: (): Promise<string | null> => ipcRenderer.invoke(IPC.THEMES_GET_ACTIVE),
    openFolder: (): Promise<void> => ipcRenderer.invoke(IPC.THEMES_OPEN_FOLDER)
  },
  settings: {
    get: (key: string): Promise<unknown> => ipcRenderer.invoke(IPC.SETTINGS_GET, key),
    set: (key: string, value: unknown): Promise<void> => ipcRenderer.invoke(IPC.SETTINGS_SET, key, value)
  },
  update: {
    download: (url: string): Promise<void> => ipcRenderer.invoke('update:download', url)
  },
  window: {
    minimize: (): void => ipcRenderer.send(IPC.WINDOW_MINIMIZE),
    maximize: (): void => ipcRenderer.send(IPC.WINDOW_MAXIMIZE),
    close: (): void => ipcRenderer.send(IPC.WINDOW_CLOSE)
  }
}

export type BscBridge = typeof api
contextBridge.exposeInMainWorld('bsc', api)

// Relay update events from main → renderer as DOM CustomEvents
ipcRenderer.on('update:available', (_event, release) => {
  window.dispatchEvent(new CustomEvent('bsc:update-available', { detail: release }))
})
