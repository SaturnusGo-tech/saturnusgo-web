const running = new WeakMap<HTMLElement, Animation>();

/** Keep text readable throughout the replacement; the surrounding MarkdownTransition owns height. */
export function animateReplacement(root: HTMLElement) {
  running.get(root)?.cancel();
  if (typeof root.animate !== "function" || typeof window === "undefined"
    || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const animation = root.animate([
    { opacity: .72, transform: "translateY(2px)" },
    { opacity: 1, transform: "translateY(0)" },
  ], { duration: 200, easing: "cubic-bezier(.22, 1, .36, 1)" });
  running.set(root, animation);
  void animation.finished.catch(() => {}).finally(() => {
    if (running.get(root) === animation) running.delete(root);
  });
}
