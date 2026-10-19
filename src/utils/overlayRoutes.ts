/** True when the app is running as an OBS/browser overlay (no portal redirect on 401). */
export function isOverlayBrowserRoute(pathname = window.location.pathname): boolean {
  return (
    pathname.startsWith('/browser-source') ||
    pathname.startsWith('/overlay') ||
    pathname === '/clean-battlefield' ||
    pathname === '/unified'
  );
}
