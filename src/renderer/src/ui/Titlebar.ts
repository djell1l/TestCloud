import { icon } from './Icons'

export function renderTitlebar(onSearch: (q: string) => void): HTMLElement {
  const el = document.createElement('div')
  el.className = 'titlebar'
  el.innerHTML = `
    <div class="logo">
      <svg viewBox="0 0 33 33" fill="var(--sc-orange)" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
        <path d="M0 19.5c0 .3.2.5.5.5h.8c.3 0 .5-.2.5-.5l.3-3-.3-3c0-.3-.2-.5-.5-.5h-.8c-.3 0-.5.2-.5.5l-.3 3 .3 3zm2.7.8c0 .3.2.6.5.6h.8c.3 0 .5-.3.5-.6l.3-3.8-.3-3.8c0-.3-.2-.6-.5-.6h-.8c-.3 0-.5.3-.5.6l-.3 3.8.3 3.8zm2.8.5c0 .3.2.6.6.6h.8c.3 0 .6-.3.6-.6l.2-4.3-.2-4.3c0-.3-.3-.6-.6-.6h-.8c-.3 0-.6.3-.6.6l-.2 4.3.2 4.3zm2.8.3c0 .4.3.7.6.7h.8c.4 0 .6-.3.6-.7l.2-4.6-.2-4.6c0-.4-.3-.7-.6-.7h-.8c-.4 0-.6.3-.6.7l-.2 4.6.2 4.6zm2.9.2c0 .4.3.7.7.7h.7c.4 0 .7-.3.7-.7l.2-4.8-.2-6.3c0-.4-.3-.7-.7-.7h-.7c-.4 0-.7.3-.7.7l-.2 6.3.2 4.8zm2.8.1c0 .4.4.8.8.8h.7c.4 0 .8-.4.8-.8l.2-4.9-.2-7.3c0-.4-.4-.8-.8-.8h-.7c-.4 0-.8.4-.8.8l-.2 7.3.2 4.9zm2.9 0c0 .5.4.9.9.9h.7c.5 0 .9-.4.9-.9l.1-4.9-.1-8.5c0-.5-.4-.9-.9-.9h-.7c-.5 0-.9.4-.9.9l-.1 8.5.1 4.9zm2.9 0c0 .5.4.9.9.9h.7c.5 0 .9-.4.9-.9l.1-4.9-.1-9.4c0-.5-.4-.9-.9-.9h-.7c-.5 0-.9.4-.9.9l-.1 9.4.1 4.9zm4.5-13.7c-.7 0-1.4.1-2 .4C23.1 4.7 20.2 2 16.7 2c-.9 0-1.7.2-2.4.5-.3.1-.4.3-.4.5v16.4c0 .3.2.5.5.5h12.1c2.2 0 4-1.8 4-4s-1.8-4-4-4z"/>
      </svg>
      TestCloud
    </div>
    <div class="titlebar-search-wrap">
      ${icon('search', 'search-icon')}
      <input class="search-global" type="text" placeholder="Artistes, titres, podcasts..." />
    </div>
    <div class="win-controls">
      <button data-action="minimize" title="Réduire">${icon('minimize')}</button>
      <button data-action="maximize" title="Agrandir">${icon('maximize')}</button>
      <button data-action="close" class="close" title="Fermer">${icon('close')}</button>
    </div>
  `

  el.querySelector('[data-action="minimize"]')?.addEventListener('click', () => window.bsc.window.minimize())
  el.querySelector('[data-action="maximize"]')?.addEventListener('click', () => window.bsc.window.maximize())
  el.querySelector('[data-action="close"]')?.addEventListener('click', () => window.bsc.window.close())

  const search = el.querySelector('.search-global') as HTMLInputElement
  let debounce: ReturnType<typeof setTimeout>
  search.addEventListener('input', () => {
    clearTimeout(debounce)
    debounce = setTimeout(() => { if (search.value.trim()) onSearch(search.value.trim()) }, 350)
  })
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && search.value.trim()) onSearch(search.value.trim())
  })

  return el
}
