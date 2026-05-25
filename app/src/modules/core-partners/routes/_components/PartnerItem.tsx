// app/partners/components/PartnerItemComponent.tsx

import { Partner } from "../_data/schema";

type Props = { partner: Partner };

export function PartnerItemComponent({ partner }: Props) {
  const { name, tagline, website, logo } = partner;
  return (
    <div className="flex items-center gap-3">
      {/* Use <img> to avoid Next image domain config */}
      {logo && (
        <img
          src={logo}
          alt={`${name} logo`}
          className="h-8 w-8 rounded-lg object-contain ring-1 ring-[var(--border)]"
          loading="lazy"
        />
      )}
      <div className="min-w-0">
        <div className="truncate font-medium">{name}</div>
        {tagline && <div className="truncate sg-muted text-sm">{tagline}</div>}
        {website && (
          <a
            href={website}
            className="sg-link text-sm"
            target="_blank"
            rel="noreferrer"
          >
            {new URL(website).hostname}
          </a>
        )}
      </div>
    </div>
  );
}
