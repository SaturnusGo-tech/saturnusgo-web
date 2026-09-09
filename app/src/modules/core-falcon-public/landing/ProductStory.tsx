import type { ProductStory as Story } from "./content/demos";
import { Reveal } from "./motion/Reveal";
import styles from "./landing.module.css";

export function ProductStory({
  story,
  headingId,
}: {
  story: Story;
  headingId: string;
}) {
  return (
    <Reveal className={styles.storyCopy}>
      <p className={styles.storyLabel}>{story.label}</p>
      <h2 id={headingId}>{story.title}</h2>
      <div className={styles.storyBody}>
        {story.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </Reveal>
  );
}
