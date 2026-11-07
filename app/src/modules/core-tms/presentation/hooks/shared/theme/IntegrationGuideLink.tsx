import { useEffect, useState, type ReactNode } from "react";
import { documentationLink } from "../../../../documentation/navigation/documentation-link";
import { useIntegrationGuide } from "../../../../documentation/panel/GuidePanelProvider";
import { HISTORY_CHANGE } from "../../../../state/navigation/browser/workspace-history";

type Props = { article: string; className?: string; children: ReactNode };

export function IntegrationGuideLink({ article, className, children }: Props) {
  const guide = useIntegrationGuide();
  const [href, setHref] = useState(`?view=help&article=${article}`);
  useEffect(() => {
    const update = () => setHref(documentationLink(window.location.href, article));
    update();
    window.addEventListener(HISTORY_CHANGE, update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener(HISTORY_CHANGE, update);
      window.removeEventListener("popstate", update);
    };
  }, [article]);

  return <a href={href} className={className} aria-haspopup={guide ? "dialog" : undefined} onClick={guide ? event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    guide.open(article, event.currentTarget);
  } : undefined}>{children}</a>;
}
