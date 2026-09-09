import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FalconBrand } from "../shared/FalconBrand";
import { FalconHeader } from "./FalconHeader";
import { FalconHeroCinema } from "./FalconHeroCinema";
import { FalconIntegrations } from "./FalconIntegrations";
import { ProductVideo } from "./media/ProductVideo";
import { demos, workflow } from "./content/demos";
import { Reveal } from "./motion/Reveal";
import styles from "./landing.module.css";

export function FalconLanding() {
  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#product">
        К содержанию
      </a>
      <FalconHeader />
      <main>
        <FalconHeroCinema />
        <section
          className={styles.overview}
          id="product"
          aria-labelledby="overview-title"
        >
          <ProductVideo demo={demos.dashboard} priority />
          <Reveal className={styles.overviewCopy}>
            <p className={styles.eyebrow}>Вся работа над качеством</p>
            <h2 id="overview-title">
              Понимайте, что проверить.
              <br />
              <span>И что уже проверено.</span>
            </h2>
            <p>
              Соберите дашборд под свой проект. Перейдите от показателя к нужным
              кейсам, прогонам или дефектам — и вернитесь к тому же месту.
            </p>
          </Reveal>
        </section>
        <nav className={styles.chapterNav} aria-label="Возможности Falcon">
          {workflow.map((item, index) => (
            <a key={item.id} href={`#${item.id}`}>
              <span>0{index + 1}</span>
              {item.label}
            </a>
          ))}
        </nav>
        {workflow.map((item, index) => (
          <section
            key={item.id}
            className={styles.workflowSection}
            id={item.id}
            aria-labelledby={`${item.id}-title`}
          >
            <Reveal className={styles.sectionHeading}>
              <p className={styles.eyebrow}>
                0{index + 1} / {item.label}
              </p>
              <div>
                <h2 id={`${item.id}-title`}>{item.title}</h2>
                <p>{item.description}</p>
              </div>
            </Reveal>
            <ProductVideo demo={demos[item.id]} />
            <div className={styles.sectionNotes}>
              {item.points.map((point) => (
                <div key={point.title}>
                  <h3>{point.title}</h3>
                  <p>{point.text}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
        <FalconIntegrations />
        <section className={styles.faq} aria-labelledby="faq-title">
          <h2 id="faq-title">Перед первым проектом</h2>
          <div>
            <details>
              <summary>С чего начать работу в Falcon?</summary>
              <p>
                Создайте аккаунт и рабочее пространство, добавьте проект, затем
                первый тест-кейс. Руководство внутри Falcon показывает каждый
                шаг: от структуры репозитория до результатов прогона.
              </p>
            </details>
            <details>
              <summary>Можно перенести существующие тест-кейсы?</summary>
              <p>
                Да. В репозитории кейсов доступны импорт и экспорт.
                Поддерживаемые форматы и требования к полям описаны в разделе
                «Помощь» вашего рабочего пространства.
              </p>
            </details>
            <details>
              <summary>Как команда проверяет исправленные дефекты?</summary>
              <p>
                Укажите связанные кейсы в баг-репорте. Когда дефект перейдёт на
                проверку, кнопка «Проверить исправления» откроет прогон с
                соответствующими сценариями.
              </p>
            </details>
            <details>
              <summary>Дашборд одинаковый для всех проектов?</summary>
              <p>
                Каждый проект настраивается отдельно. Добавляйте нужные виджеты
                из библиотеки, меняйте их порядок и группируйте данные по
                контексту работы.
              </p>
            </details>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerCta}>
          <p className={styles.eyebrow}>Следующий релиз начинается здесь</p>
          <h2>
            Дайте качеству
            <br />
            своё пространство.
          </h2>
          <Link className={styles.primaryButton} href="/signup/">
            Создать аккаунт <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.footerMeta}>
          <FalconBrand inverse />
          <span>Управление тестированием</span>
          <Link href="/cloud-login/">
            Войти в пространство <ArrowRight size={14} aria-hidden="true" />
          </Link>
          <small>© {new Date().getFullYear()} Falcon</small>
        </div>
      </footer>
    </div>
  );
}
