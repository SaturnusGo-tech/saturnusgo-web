import { useEffect, useRef, useState } from "react";

const REVEAL_DELAY_MS = 300;
const MINIMUM_VISIBLE_MS = 250;

export function useLoadingFeedback(pending: boolean) {
  const [visible, setVisible] = useState(false);
  const revealedAt = useRef<number | null>(null);

  useEffect(() => {
    if (pending) {
      if (revealedAt.current !== null) return;
      const timer = setTimeout(() => {
        revealedAt.current = Date.now();
        setVisible(true);
      }, REVEAL_DELAY_MS);
      return () => clearTimeout(timer);
    }

    if (revealedAt.current === null) return;
    const remaining = MINIMUM_VISIBLE_MS - (Date.now() - revealedAt.current);
    const dismiss = () => {
      revealedAt.current = null;
      setVisible(false);
    };
    if (remaining <= 0) {
      dismiss();
      return;
    }
    const timer = setTimeout(dismiss, remaining);
    return () => clearTimeout(timer);
  }, [pending]);

  return visible;
}
