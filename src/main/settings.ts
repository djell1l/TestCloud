import Store from 'electron-store'

interface SettingsSchema {
  activeTheme: string | null
  enabledPlugins: string[]
  volume: number
  closeToTray: boolean
  startupFullscreen: boolean
  discordRpcEnabled: boolean
  [key: string]: unknown // plugins are allowed their own free-form keys, namespaced by plugin name
}

export const settingsStore = new Store<SettingsSchema>({
  defaults: {
    activeTheme: null,
    enabledPlugins: [],
    volume: 0.8,
    closeToTray: true,
    startupFullscreen: false,
    discordRpcEnabled: false
  }
})
