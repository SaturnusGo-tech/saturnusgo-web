import { ProductVideo } from "./media/ProductVideo";
import { demos } from "./content/demos";
import { Reveal } from "./motion/Reveal";
import { IntegrationMarquee } from "./motion/IntegrationMarquee";
import styles from "./landing.module.css";
export function FalconIntegrations() {
  return (
    <section
      className={styles.integrationScene}
      id="integrations"
      aria-labelledby="integrations-title"
    >
      <Reveal className={styles.sectionHeading}>
        <div>
          <h2 id="integrations-title">Интеграции</h2>
          <p>Подключайте трекеры задач, сборки и уведомления команды.</p>
        </div>
      </Reveal>
      <IntegrationMarquee />
      <Reveal className={styles.videoReveal}>
        <ProductVideo demo={demos.integrations} />
      </Reveal>
    </section>
  );
}
