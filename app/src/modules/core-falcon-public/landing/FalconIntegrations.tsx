"use client";
import { useLandingLocale } from "./localization/context/LandingLocaleProvider";
import * as russian from "./content/demos";
import * as english from "./content/demos.en";
import { ProductVideo } from "./media/ProductVideo";
import { Reveal } from "./motion/Reveal";
import { IntegrationMarquee } from "./motion/IntegrationMarquee";
import { ProductStory } from "./ProductStory";
import styles from "./landing.module.css";
export function FalconIntegrations() {
  const { locale } = useLandingLocale();
  const { demos, integrationStory } = locale === "ru" ? russian : english;
  return (
    <section
      className={styles.integrationScene}
      id="integrations"
      aria-labelledby="integrations-title"
    >
      <ProductStory story={integrationStory} headingId="integrations-title" />
      <IntegrationMarquee />
      <Reveal className={styles.videoReveal} variant="media">
        <ProductVideo key={locale} demo={demos.integrations} />
      </Reveal>
    </section>
  );
}
