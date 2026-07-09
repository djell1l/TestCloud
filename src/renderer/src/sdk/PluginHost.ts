/**
 * Plugins are plain JS run in the same renderer context (same trust level
 * as the app itself — this mirrors how Spicetify extensions work: you're
 * trusting code you chose to drop in your own folder, not running
 * untrusted third-party code in a sandbox).
 */
export async function loadPlugins(): Promise<void> {
  const manifests = await window.bsc.plugins.list()
  const enabledKey = (await window.bsc.settings.get('enabledPlugins')) as string[] | undefined
  const enabled = new Set(enabledKey ?? [])

  for (const manifest of manifests) {
    if (!enabled.has(manifest.name)) continue
    try {
      const source = await window.bsc.plugins.readSource(manifest.folder, manifest.main)
      const script = document.createElement('script')
      script.type = 'module'
      script.textContent = source
      script.dataset.bscPlugin = manifest.name
      document.body.appendChild(script)
    } catch (err) {
      console.error(`[BSC] Failed to load plugin "${manifest.name}":`, err)
    }
  }
}

export async function loadActiveTheme(): Promise<void> {
  const active = await window.bsc.themes.getActive()
  const styleTag = document.getElementById('bsc-theme-style') as HTMLStyleElement | null
  if (!active) {
    if (styleTag) styleTag.textContent = ''
    return
  }

  const themes = await window.bsc.themes.list()
  const theme = themes.find((t) => t.name === active)
  if (!theme) return

  const css = await window.bsc.themes.readCss(theme.folder, theme.css)
  const tag = styleTag ?? document.createElement('style')
  tag.id = 'bsc-theme-style'
  tag.textContent = css
  if (!styleTag) document.head.appendChild(tag)
}
