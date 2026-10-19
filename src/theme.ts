import type { ThemeSwitchTheme } from './kit'

// The Studio ships dark-only for now (index.html sets data-uiforma-theme="dark"). Every colour reads the
// Kit's semantic tokens, which switch on that attribute, so a light mode only needs the Kit's ThemeSwitch
// wired to setTheme once the light palette has been reviewed in the Studio.
export function getTheme(): ThemeSwitchTheme {
  return document.documentElement.dataset.uiformaTheme === 'light' ? 'light' : 'dark'
}

export function setTheme(theme: ThemeSwitchTheme) {
  document.documentElement.dataset.uiformaTheme = theme
}
