import { Card, CardBody } from "@heroui/react";
import { CircleAlert, Info, Lightbulb, StickyNote, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useTmsLocale } from "../../../../../../localization/context/useTmsLocale";
import styles from "../product-doc-callout.module.css";

const tones = {
  note: { en: "Note", ru: "Примечание", icon: StickyNote },
  tip: { en: "Tip", ru: "Совет", icon: Lightbulb },
  info: { en: "Information", ru: "Информация", icon: Info },
  caution: { en: "Caution", ru: "Внимание", icon: TriangleAlert },
  danger: { en: "Warning", ru: "Предупреждение", icon: CircleAlert },
};
type Tone = keyof typeof tones;

export function isProductDocCalloutTone(tone: unknown): tone is Tone {
  return typeof tone === "string" && Object.prototype.hasOwnProperty.call(tones, tone);
}

export function ProductDocCallout({ tone, children }: { tone: Tone; children: ReactNode }) {
  const { locale } = useTmsLocale();
  const { icon: Icon, [locale]: label } = tones[tone];
  return <Card as="aside" role="note" data-tone={tone} className={styles.callout} shadow="none">
    <CardBody className={styles.content}>
      <p className={styles.caption} contentEditable={false}><Icon size={16} aria-hidden="true" />{label}</p>
      <div className={styles.text}>{children}</div>
    </CardBody>
  </Card>;
}
