import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FalconBrand } from "../shared/FalconBrand";
import { FalconHeader } from "./FalconHeader";
import { FalconHeroCinema } from "./FalconHeroCinema";
import styles from "./landing.module.css";

export function FalconLanding() {
  return (
    <div className={styles.page}>
      <FalconHeader />
      <main>
        <FalconHeroCinema />

        <section className={`${styles.editorialScene} ${styles.caseScene}`} id="platform">
          <div className={styles.editorialInner}>
            <div className={styles.editorialCopy}>
              <SectionIntro
                label="Тест-кейсы"
                title="Сценарий читается с первого взгляда"
                text="Сразу видно, что сделать, что проверить и какие материалы приложены. Изменение общего шага обновит все сценарии, где он используется."
              />
            </div>
            <ProductFrame
              src="/falcon/landing/case-repository.jpg"
              alt="Репозиторий тест-кейсов Falcon с открытой карточкой"
              width={2174}
              height={1628}
              mobileSrc="/falcon/landing/case-repository-mobile.jpg"
              mobileWidth={780}
              mobileHeight={1400}
              className={styles.caseProduct}
            />
          </div>
        </section>

        <section className={`${styles.editorialScene} ${styles.runScene}`} id="automation">
          <div className={styles.editorialInner}>
            <div className={styles.editorialCopy}>
              <SectionIntro
                label="Запуски"
                title="Ревизия фиксируется в момент запуска"
                text="Откройте старый прогон — Falcon покажет сценарий таким, каким он был в момент запуска, вместе с окружением и сборкой."
              />
            </div>
            <ProductFrame
              src="/falcon/landing/run-builder.jpg"
              alt="Конструктор тест-рана Falcon с выбором кейсов"
              width={2560}
              height={1440}
              mobileSrc="/falcon/landing/run-builder-mobile.jpg"
              mobileWidth={780}
              mobileHeight={1400}
              className={styles.runProduct}
            />
          </div>
        </section>

        <section className={`${styles.editorialScene} ${styles.defectScene}`} id="defects">
          <div className={styles.editorialInner}>
            <div className={styles.editorialCopy}>
              <SectionIntro
                label="Дефекты"
                title="Дефект начинается с исходного шага"
                text="Создайте дефект прямо из шага. Falcon перенесёт результаты и вложения, а ссылка на задачу в YouTrack останется рядом с исходным запуском."
              />
            </div>
            <ProductFrame
              src="/falcon/landing/case-defect-link.jpg"
              alt="Карточка баг-репорта Falcon рядом со списком дефектов"
              width={2560}
              height={1440}
              mobileSrc="/falcon/landing/case-defect-link-mobile.jpg"
              mobileWidth={780}
              mobileHeight={1400}
              className={styles.defectProduct}
            />
          </div>
        </section>

        <section className={styles.integrationStatement} id="integrations">
          <p className={styles.sectionLabel}>Интеграции</p>
          <h2>
            Дефект уходит в YouTrack. <span>Контекст остаётся в Falcon.</span>
          </h2>
          <p>Импорт, экспорт и автоматизация доступны через REST API.</p>
        </section>

        <section className={`${styles.editorialScene} ${styles.analyticsScene}`} id="analytics">
          <div className={styles.editorialInner}>
            <div className={styles.editorialCopy}>
              <SectionIntro
                label="Аналитика"
                title="Метрика ведёт к причине"
                text="За каждой метрикой — конкретные кейсы, прогоны и дефекты, которые на неё повлияли."
              />
            </div>
            <ProductFrame
              src="/falcon/landing/analytics-dashboard.jpg"
              alt="Дашборд качества Falcon по проекту Umbrella-Host"
              width={2560}
              height={1440}
              mobileSrc="/falcon/landing/analytics-dashboard-mobile.jpg"
              mobileWidth={780}
              mobileHeight={1400}
              className={styles.analyticsProduct}
            />
          </div>
        </section>
      </main>

      <footer className={styles.footer} id="security">
        <div className={styles.footerCta}>
          <h2>Перенесите первый сценарий в Falcon</h2>
          <div>
            <p>Создайте отдельное пространство для команды и начните с одного проекта.</p>
            <Link className={styles.lightButton} href="/signup/">
              Попробовать <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className={styles.footerMeta}>
          <FalconBrand inverse />
          <div>
            <Link href="/signup/">Создать пространство</Link>
            <Link href="/cloud-login/">Вход в облако</Link>
          </div>
          <span>© {new Date().getFullYear()} Falcon</span>
        </div>
      </footer>
    </div>
  );
}

function ProductFrame(props: {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly priority?: boolean;
  readonly className?: string;
  readonly mobileSrc?: string;
  readonly mobileWidth?: number;
  readonly mobileHeight?: number;
}) {
  return (
    <figure className={`${styles.productFrame} ${props.className ?? ""}`}>
      <picture>
        {props.mobileSrc && props.mobileWidth && props.mobileHeight && (
          <source
            media="(max-width: 780px)"
            srcSet={props.mobileSrc}
            width={props.mobileWidth}
            height={props.mobileHeight}
          />
        )}
        <img
          src={props.src}
          alt={props.alt}
          width={props.width}
          height={props.height}
          loading={props.priority ? "eager" : "lazy"}
          fetchPriority={props.priority ? "high" : "auto"}
          decoding="async"
        />
      </picture>
    </figure>
  );
}

function SectionIntro(props: {
  readonly label: string;
  readonly title: string;
  readonly text: string;
}) {
  return (
    <div className={styles.sectionIntro}>
      <p className={styles.sectionLabel}>{props.label}</p>
      <h2>{props.title}</h2>
      <p className={styles.sectionLead}>{props.text}</p>
    </div>
  );
}
