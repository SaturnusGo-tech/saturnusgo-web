export type LandingTheme = 'dark' | 'light';
export const landingThemeKey = 'falcon-landing-theme';
export const resolveLandingTheme = (value: unknown): LandingTheme => value === 'light' ? 'light' : 'dark';

// Run before content paints. Landing preference is independent of workspace settings.
export const landingThemeBootstrap = `(()=>{let t='dark';try{if(localStorage.getItem('${landingThemeKey}')==='light')t='light'}catch{}document.documentElement.setAttribute('data-falcon-landing-theme',t)})()`;
