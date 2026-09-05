import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FalconBrand } from "../shared/FalconBrand";
import { FalconHeader } from "./FalconHeader";
import { FalconHeroCinema } from "./FalconHeroCinema";
import { FalconIntegrations } from "./FalconIntegrations";
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
                title="Создавайте тест-кейсы и обновляйте сценарии"
                text="Добавляйте описание, предусловия, сценарий, общие шаги, теги и вложения. Указывайте статус, приоритет, тип и оценку времени."
              />
            </div>
            <ProductFrame
              src="/falcon/landing/case-repository.jpg"
              alt="Список тест-кейсов и открытая карточка выбранного кейса"
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
                label="Тест-раны"
                title="Собирайте тест-раны и фиксируйте результаты"
                text="Выбирайте нужные тест-кейсы, окружение и сборку. Во время прогона отмечайте результат каждого кейса."
              />
            </div>
            <ProductFrame
              src="/falcon/landing/run-builder.jpg"
              alt="Форма создания прогона с выбором тест-кейсов"
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
                title="Регистрируйте дефекты во время тестирования"
                text="Создавайте баг-репорт из тест-рана, добавляйте описание и вложения. В карточке дефекта доступны связанные тест-кейс и тест-ран."
              />
            </div>
            <ProductFrame
              src="/falcon/landing/case-defect-link.jpg"
              alt="Список дефектов и открытая карточка баг-репорта"
              width={2560}
              height={1440}
              mobileSrc="/falcon/landing/case-defect-link-mobile.jpg"
              mobileWidth={780}
              mobileHeight={1400}
              className={styles.defectProduct}
            />
          </div>
        </section>

        <FalconIntegrations />

        <section className={`${styles.editorialScene} ${styles.analyticsScene}`} id="analytics">
          <div className={styles.editorialInner}>
            <div className={styles.editorialCopy}>
              <SectionIntro
                label="Аналитика"
                title="Отслеживайте состояние тестирования на дашборде"
                text="Смотрите результаты тест-ранов, покрытие, дефекты и показатели по компонентам. Применяйте фильтры по проекту и периоду."
              />
            </div>
            <ProductFrame
              src="/falcon/landing/analytics-dashboard.jpg"
              alt="Дашборд проекта с показателями тестирования"
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
          <h2>Создайте рабочее пространство</h2>
          <div>
            <p>После регистрации добавьте первый проект и тест-кейсы.</p>
            <Link className={styles.lightButton} href="/signup/">
              Создать аккаунт <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className={styles.footerMeta}>
          <FalconBrand inverse />
          <div>
            <Link href="/signup/">Создать аккаунт</Link>
            <Link href="/cloud-login/">Войти в пространство</Link>
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
