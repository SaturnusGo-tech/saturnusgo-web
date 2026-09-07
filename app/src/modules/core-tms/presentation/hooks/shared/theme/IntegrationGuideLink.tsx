import { useEffect, useState, type ReactNode } from "react";
import { documentationLink } from "../../../../documentation/navigation/documentation-link";

export function IntegrationGuideLink({ article, className, children }: { article: string; className?: string; children: ReactNode }) {
  const [href, setHref] = useState(`?view=help&article=${article}`);
  useEffect(() => setHref(documentationLink(window.location.href, article)), [article]);
  return <a href={href} className={className}>{children}</a>;
}
