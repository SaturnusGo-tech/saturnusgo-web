import type { ComponentProps, ReactNode } from "react";
import { ContentSkeleton } from "../../skeleton/ContentSkeleton";
import { useLoadingFeedback } from "./useLoadingFeedback";

type Props = Omit<ComponentProps<typeof ContentSkeleton>, "visible"> & {
  pending: boolean;
  children?: ReactNode;
};

export function DeferredPane({ pending, children, ...skeleton }: Props) {
  const visible = useLoadingFeedback(pending);
  return pending || visible ? <ContentSkeleton {...skeleton} visible={visible} /> : children ?? null;
}
