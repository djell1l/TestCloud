# TestCloud

A custom SoundCloud desktop client built from scratch, inspired by Spicetify.
TestCloud gives you a native desktop experience for SoundCloud with a plugin and theme system, no ads, and full control over your listening experience.

> This project is in early alpha. Expect bugs and missing features.

---

## Features

- Native desktop app (Electron) — no browser needed
- Custom UI faithful to SoundCloud's design language
- Feed, Likes, Playlists, Search — all working
- Audio playback with queue, shuffle, repeat
- Plugin system — drop a folder to extend the app (BSC SDK)
- Theme system — drop a CSS file to restyle the app
- Automatic update notifications via GitHub Releases

---

## Installation

**Windows (portable)**

Download `TestCloud-x.x.x-portable-win-x64.exe` from the [Releases](https://github.com/djell1l/TestCloud/releases) page.
No installation required — just run the file.

---

## Building from source

**Requirements:** Node.js 18+, Git

```bash
git clone https://github.com/djell1l/TestCloud.git
cd TestCloud
npm install
npm run dev
```

To build a distributable:

```bash
npm run dist:win    # Windows portable .exe
npm run dist:mac    # macOS .dmg
npm run dist:linux  # Linux AppImage
```

---

## Plugin development

Plugins are plain JavaScript files placed in the TestCloud userland folder.
On Windows: `%APPDATA%\testcloud\userland\plugins\<plugin-name>\`

Each plugin folder must contain a `manifest.json`:

```json
{
  "name": "my-plugin",
  "displayName": "My Plugin",
  "version": "1.0.0",
  "author": "your-name",
  "description": "What this plugin does",
  "main": "index.js"
}
```

Your plugin's `index.js` has access to the global `BSC` object:

```js
// Listen for track changes
BSC.Events.on('trackchange', (state) => {
  console.log('Now playing:', state.track.title)
})

// Control playback
BSC.Player.next()

// Show a notification
BSC.UI.showToast('Hello from my plugin!')

// Persist settings
await BSC.Settings.set('my-plugin', 'key', 'value')
```

---

## Theme development

Themes are CSS files placed in:
`%APPDATA%\testcloud\userland\themes\<theme-name>\`

Each theme folder must contain a `manifest.json`:

```json
{
  "name": "my-theme",
  "displayName": "My Theme",
  "author": "your-name",
  "version": "1.0.0",
  "css": "style.css"
}
```

Your `style.css` can override any of the design tokens:

```css
:root {
  --sc-bg: #0a0a0a;
  --sc-orange: #1db954;
  --sc-text: #ffffff;
}
```

---

## Legal notice

TestCloud is an independent third-party client and is not affiliated with,
endorsed by, or connected to SoundCloud GmbH in any way.
SoundCloud is a registered trademark of SoundCloud GmbH.
This project does not host, distribute, or monetize any SoundCloud content.
It simply provides an alternative interface to the SoundCloud platform for personal use.

---

## License

Copyright (c) 2025 djell1l

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
