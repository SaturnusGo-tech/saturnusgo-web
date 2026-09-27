import type { RunPlatformBuild } from "../../model/platform-build";
import { AttachmentLink } from "../../../../attachments/presentation/link/AttachmentLink";
import css from "./buildSummary.module.css";

function webLink(reference: string) {
  try { const url = new URL(reference); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}

export function RunPlatformBuildSummary({ builds, ru }: {
  builds?: readonly RunPlatformBuild[]; ru: boolean; workspaceId?: string; projectId?: string;
}) {
  if (!builds?.length) return null;
  return <div className={css.builds} aria-label={ru ? "Сборки платформ" : "Platform builds"}>
    {builds.map((build) => <div key={build.platform} className={css.build}>
      <strong>{build.platform === "android" ? "Android" : "iOS"}</strong>
      {build.platform === "android" ? <>
        {build.version && <span>{build.version}</span>}
        <AttachmentLink attachmentId={build.attachmentId} disposition="attachment" canRemove={false} />
      </> : webLink(build.reference) ? <a href={webLink(build.reference)!} target="_blank" rel="noopener noreferrer">{build.reference}</a>
        : <span>{build.reference}</span>}
    </div>)}
  </div>;
}
