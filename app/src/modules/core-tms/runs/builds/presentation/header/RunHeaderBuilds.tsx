import { Download, ExternalLink, LoaderCircle, Smartphone } from "lucide-react";
import type { RunPlatformBuild } from "../../model/platform-build";
import { useRunBuildDownload } from "../../state/download/useRunBuildDownload";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import css from "./runHeaderBuilds.module.css";

export function RunHeaderBuilds({ builds, disabled }: { builds: readonly RunPlatformBuild[]; disabled: boolean }) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  return <div className={css.builds} aria-label={ru ? "Сборки прогона" : "Run builds"}>
    {builds.map((build) => build.platform === "android"
      ? <AndroidBuild key={build.attachmentId} build={build} ru={ru} disabled={disabled} />
      : <IosBuild key={build.platform} reference={build.reference} ru={ru} />)}
  </div>;
}

function AndroidBuild({ build, ru, disabled }: { build: Extract<RunPlatformBuild, { platform: "android" }>; ru: boolean; disabled: boolean }) {
  const { pending, error, download } = useRunBuildDownload(build.attachmentId, ru);
  const label = build.version ? `Android ${build.version}` : (ru ? "Сборка Android" : "Android build");
  return <div className={css.download}>
    <button type="button" className={css.build} onClick={() => void download()} disabled={disabled || pending}
      title={label} aria-label={`${ru ? "Скачать сборку" : "Download build"}: ${label}`} aria-busy={pending}>
      {pending ? <LoaderCircle className={css.spinner} size={15} aria-hidden="true" /> : <Download size={15} aria-hidden="true" />}
      <span>{label}</span>
    </button>
    {error && <span className={css.error} role="alert">{error}</span>}
  </div>;
}

function IosBuild({ reference, ru }: { reference: string; ru: boolean }) {
  let href: string | null = null;
  try {
    const url = new URL(reference);
    if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password) href = url.href;
  } catch { /* A plain version is valid build metadata. */ }
  return href ? <a className={css.build} href={href} target="_blank" rel="noopener noreferrer"
    aria-label={ru ? "Открыть сборку iOS" : "Open iOS build"} title={ru ? "Открыть сборку iOS" : "Open iOS build"}>
    <Smartphone size={15} aria-hidden="true" /><span>{ru ? "Сборка iOS" : "iOS build"}</span><ExternalLink size={12} aria-hidden="true" />
  </a> : <span className={css.build} title={`iOS ${reference}`}><Smartphone size={15} aria-hidden="true" /><span>iOS {reference}</span></span>;
}
