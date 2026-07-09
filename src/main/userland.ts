/**
 * Userland lives outside the app bundle, in the user's data dir:
 *
 *   <userData>/userland/plugins/<plugin-name>/manifest.json + entry.js
 *   <userData>/userland/themes/<theme-name>/manifest.json + style.css
 *
 * This mirrors Spicetify's "Extensions" + "Themes" folders: dropping a
 * folder in there is enough, no build step required. The renderer never
 * touches the filesystem directly — it asks main for the list and for
 * the raw source, then `eval`s/injects it itself inside its own sandboxed
 * plugin host.
 */
import { app } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import type { PluginManifest, ThemeManifest } from '@shared/types'

const USERLAND_DIR = path.join(app.getPath('userData'), 'userland')
export const PLUGINS_DIR = path.join(USERLAND_DIR, 'plugins')
export const THEMES_DIR = path.join(USERLAND_DIR, 'themes')

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

async function readManifest<T>(dir: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(path.join(dir, 'manifest.json'), 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function initUserland(): Promise<void> {
  await ensureDir(PLUGINS_DIR)
  await ensureDir(THEMES_DIR)
}

export async function listPlugins(): Promise<Array<PluginManifest & { folder: string }>> {
  await ensureDir(PLUGINS_DIR)
  const entries = await fs.readdir(PLUGINS_DIR, { withFileTypes: true })
  const plugins: Array<PluginManifest & { folder: string }> = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const manifest = await readManifest<PluginManifest>(path.join(PLUGINS_DIR, entry.name))
    if (manifest) plugins.push({ ...manifest, folder: entry.name })
  }
  return plugins
}

export async function readPluginSource(folder: string, mainFile: string): Promise<string> {
  const safeFolder = path.basename(folder)
  const safeFile = path.normalize(mainFile).replace(/^(\.\.[/\\])+/, '')
  return fs.readFile(path.join(PLUGINS_DIR, safeFolder, safeFile), 'utf-8')
}

export async function listThemes(): Promise<Array<ThemeManifest & { folder: string }>> {
  await ensureDir(THEMES_DIR)
  const entries = await fs.readdir(THEMES_DIR, { withFileTypes: true })
  const themes: Array<ThemeManifest & { folder: string }> = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const manifest = await readManifest<ThemeManifest>(path.join(THEMES_DIR, entry.name))
    if (manifest) themes.push({ ...manifest, folder: entry.name })
  }
  return themes
}

export async function readThemeCss(folder: string, cssFile: string): Promise<string> {
  const safeFolder = path.basename(folder)
  const safeFile = path.normalize(cssFile).replace(/^(\.\.[/\\])+/, '')
  return fs.readFile(path.join(THEMES_DIR, safeFolder, safeFile), 'utf-8')
}
