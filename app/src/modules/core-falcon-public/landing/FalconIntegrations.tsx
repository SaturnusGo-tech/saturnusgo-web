import { ProductVideo } from "./media/ProductVideo";
import { demos, integrationStory } from "./content/demos";
import { Reveal } from "./motion/Reveal";
import { IntegrationMarquee } from "./motion/IntegrationMarquee";
import { ProductStory } from "./ProductStory";
import styles from "./landing.module.css";
export function FalconIntegrations() {
  return (
    <section
      className={styles.integrationScene}
      id="integrations"
      aria-labelledby="integrations-title"
    >
      <ProductStory story={integrationStory} headingId="integrations-title" />
      <IntegrationMarquee />
      <Reveal className={styles.videoReveal} variant="media">
        <ProductVideo demo={demos.integrations} />
      </Reveal>
    </section>
  );
}
