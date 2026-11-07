export function watchDashboardView(refresh: () => void) {
  const check = () => { if (document.visibilityState !== "hidden") refresh(); };
  window.addEventListener("focus", check);
  document.addEventListener("visibilitychange", check);
  const timer = window.setInterval(check, 15_000);
  return () => {
    window.removeEventListener("focus", check);
    document.removeEventListener("visibilitychange", check);
    window.clearInterval(timer);
  };
}
