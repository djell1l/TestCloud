import { net, session, BrowserWindow } from 'electron'
import type { SCTrack, SCUser, SCPlaylist } from '@shared/types'

const API_BASE = 'https://api-v2.soundcloud.com'
const WEB_BASE = 'https://soundcloud.com'
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'

interface RawTrack {
  id: number; title: string; duration: number; permalink_url: string
  streamable: boolean; artwork_url: string | null; waveform_url?: string | null
  user?: { username: string }
  media?: { transcodings: Array<{ url: string; format: { protocol: string; mime_type: string } }> }
}

function mapTrack(raw: RawTrack): SCTrack {
  return {
    id: raw.id, title: raw.title, artist: raw.user?.username ?? 'Unknown artist',
    artworkUrl: raw.artwork_url ? raw.artwork_url.replace('-large', '-t500x500') : null,
    duration: raw.duration, permalinkUrl: raw.permalink_url,
    streamable: raw.streamable, waveformUrl: raw.waveform_url ?? null
  }
}

export class SoundCloudClient {
  private clientId: string | null = null
  private clientIdFetchedAt = 0
  private oauthToken: string | null = null

  private async ensureClientId(): Promise<string> {
    const ONE_HOUR = 60 * 60 * 1000
    if (this.clientId && Date.now() - this.clientIdFetchedAt < ONE_HOUR) return this.clientId
    const homeRes = await net.fetch(WEB_BASE, { headers: { 'User-Agent': CHROME_UA } })
    const html = await homeRes.text()
    const scriptUrls = Array.from(
      html.matchAll(/src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js)"/g)
    ).map((m) => m[1])
    for (const url of scriptUrls.reverse()) {
      const res = await net.fetch(url, { headers: { 'User-Agent': CHROME_UA } })
      const js = await res.text()
      const match = js.match(/client_id\s*[:=]\s*"([a-zA-Z0-9]{32})"/)
      if (match) {
        this.clientId = match[1]
        this.clientIdFetchedAt = Date.now()
        return this.clientId
      }
    }
    throw new Error('Could not resolve SoundCloud client_id')
  }

  private async request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const clientId = await this.ensureClientId()
    const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`)
    url.searchParams.set('client_id', clientId)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    const headers: Record<string, string> = { 'User-Agent': CHROME_UA }
    if (this.oauthToken) headers['Authorization'] = `OAuth ${this.oauthToken}`
    const res = await net.fetch(url.toString(), { headers })
    if (!res.ok) throw new Error(`SoundCloud API ${res.status} on ${path}`)
    return res.json() as Promise<T>
  }

  async login(parent?: BrowserWindow): Promise<SCUser> {
    const authSession = session.fromPartition('persist:sc-auth', { cache: true })
    authSession.setUserAgent(CHROME_UA)

    const authWindow = new BrowserWindow({
      width: 500, height: 750, parent, modal: true,
      title: 'Log in to SoundCloud',
      webPreferences: { nodeIntegration: false, contextIsolation: true, session: authSession }
    })

    const user = await new Promise<SCUser>((resolve, reject) => {
      let closedByUs = false
      let resolving = false

      // Intercept outgoing API requests from the login page.
      // SoundCloud's own JS sends Authorization: OAuth <token> once logged in.
      // We capture it here — no localStorage scraping needed.
      authSession.webRequest.onBeforeSendHeaders(
        { urls: ['https://api-v2.soundcloud.com/*', 'https://api.soundcloud.com/*'] },
        (details, callback) => {
          if (resolving) { callback({ requestHeaders: details.requestHeaders }); return }
          const auth = details.requestHeaders['Authorization'] ?? details.requestHeaders['authorization'] ?? ''
          const tokenMatch = auth.match(/^(?:OAuth|Bearer)\s+(.+)$/)
          if (tokenMatch && tokenMatch[1].length > 20) {
            this.oauthToken = tokenMatch[1]
            resolving = true
            // Verify the token works then close
            this.request<{ id: number; username: string; avatar_url: string | null; permalink_url: string }>('/me')
              .then((me) => {
                closedByUs = true
                authWindow.close()
                resolve({ id: me.id, username: me.username, avatarUrl: me.avatar_url, permalinkUrl: me.permalink_url })
              })
              .catch(() => {
                resolving = false // token didn't work, keep listening
                this.oauthToken = null
              })
          }
          callback({ requestHeaders: details.requestHeaders })
        }
      )

      authWindow.loadURL(`${WEB_BASE}/signin`).catch((err: Error) => reject(err))
      authWindow.on('closed', () => { if (!closedByUs) reject(new Error('Login cancelled')) })
    })

    return user
  }

  async logout(): Promise<void> {
    this.oauthToken = null
  }

  async getMe(): Promise<SCUser> {
    const me = await this.request<{ id: number; username: string; avatar_url: string | null; permalink_url: string }>('/me')
    return { id: me.id, username: me.username, avatarUrl: me.avatar_url, permalinkUrl: me.permalink_url }
  }

  async search(query: string, limit = 30): Promise<SCTrack[]> {
    const res = await this.request<{ collection: RawTrack[] }>('/search/tracks', { q: query, limit: String(limit) })
    return res.collection.map(mapTrack)
  }

  async getStreamFeed(limit = 30): Promise<SCTrack[]> {
    const res = await this.request<{ collection: Array<{ track?: RawTrack }> }>('/stream', { limit: String(limit) })
    return res.collection.filter((i) => i.track).map((i) => mapTrack(i.track as RawTrack))
  }

  async getLikes(limit = 50): Promise<SCTrack[]> {
    const me = await this.getMe()
    const res = await this.request<{ collection: Array<{ track?: RawTrack }> }>(
      `/users/${me.id}/track_likes`, { limit: String(limit) }
    )
    return res.collection.filter((i) => i.track).map((i) => mapTrack(i.track as RawTrack))
  }

  async getPlaylists(): Promise<SCPlaylist[]> {
    const me = await this.getMe()
    const res = await this.request<{
      collection: Array<{ id: number; title: string; artwork_url: string | null; track_count: number }>
    }>(`/users/${me.id}/playlists`)
    return res.collection.map((p) => ({ id: p.id, title: p.title, artworkUrl: p.artwork_url, trackCount: p.track_count }))
  }

  async getPlaylistTracks(playlistId: number): Promise<SCTrack[]> {
    const res = await this.request<{ tracks: RawTrack[] }>(`/playlists/${playlistId}`, { representation: 'full' })
    return res.tracks.map(mapTrack)
  }

  async getStreamUrl(trackId: number): Promise<string> {
    const track = await this.request<RawTrack>(`/tracks/${trackId}`)
    const transcoding = track.media?.transcodings.find((t) => t.format.protocol === 'progressive') ?? track.media?.transcodings[0]
    if (!transcoding) throw new Error(`Track ${trackId} has no playable transcoding`)
    const clientId = await this.ensureClientId()
    const headers: Record<string, string> = { 'User-Agent': CHROME_UA }
    if (this.oauthToken) headers['Authorization'] = `OAuth ${this.oauthToken}`
    const resolved = await net.fetch(`${transcoding.url}?client_id=${clientId}`, { headers })
    const { url } = (await resolved.json()) as { url: string }
    return url
  }
}

export const soundcloud = new SoundCloudClient()
