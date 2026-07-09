// Shared type definitions used by main, preload and renderer.
// Keeping these in one place is what lets the contextBridge API
// stay type-safe end-to-end.

export interface SCUser {
  id: number
  username: string
  avatarUrl: string | null
  permalinkUrl: string
}

export interface SCTrack {
  id: number
  title: string
  artist: string
  artworkUrl: string | null
  duration: number // ms
  permalinkUrl: string
  streamable: boolean
  /** Resolved, ready-to-play progressive/HLS url. Filled in lazily. */
  streamUrl?: string
  waveformUrl?: string | null
}

export interface SCPlaylist {
  id: number
  title: string
  artworkUrl: string | null
  trackCount: number
  tracks?: SCTrack[]
}

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export interface PlayerState {
  state: PlaybackState
  track: SCTrack | null
  positionMs: number
  durationMs: number
  volume: number
  shuffle: boolean
  repeat: 'off' | 'one' | 'all'
  queue: SCTrack[]
  queueIndex: number
}

export interface AuthState {
  isAuthenticated: boolean
  user: SCUser | null
}

/** Manifest every plugin must ship (userland/plugins/<name>/manifest.json) */
export interface PluginManifest {
  name: string
  displayName: string
  version: string
  author: string
  description: string
  main: string // entry js file, relative to plugin folder
  enabled?: boolean
}

/** Manifest every theme must ship (userland/themes/<name>/manifest.json) */
export interface ThemeManifest {
  name: string
  displayName: string
  author: string
  version: string
  css: string // entry css file, relative to theme folder
}

export const IPC = {
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_GET_STATE: 'auth:getState',
  AUTH_STATE_CHANGED: 'auth:stateChanged',

  SC_SEARCH: 'sc:search',
  SC_GET_STREAM_URL: 'sc:getStreamUrl',
  SC_GET_LIKES: 'sc:getLikes',
  SC_GET_PLAYLISTS: 'sc:getPlaylists',
  SC_GET_PLAYLIST_TRACKS: 'sc:getPlaylistTracks',
  SC_GET_STREAM_FEED: 'sc:getStreamFeed',

  PLUGINS_LIST: 'plugins:list',
  PLUGINS_TOGGLE: 'plugins:toggle',
  PLUGINS_READ_SOURCE: 'plugins:readSource',
  PLUGINS_OPEN_FOLDER: 'plugins:openFolder',

  THEMES_LIST: 'themes:list',
  THEMES_SET_ACTIVE: 'themes:setActive',
  THEMES_GET_ACTIVE: 'themes:getActive',
  THEMES_READ_CSS: 'themes:readCss',
  THEMES_OPEN_FOLDER: 'themes:openFolder',

  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close'
} as const
