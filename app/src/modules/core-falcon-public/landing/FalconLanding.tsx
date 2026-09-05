import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FalconBrand } from "../shared/FalconBrand";
import { FalconHeader } from "./FalconHeader";
import styles from "./landing.module.css";

export function FalconLanding() {
  return (
    <div className={styles.page}>
      <FalconHeader />
      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1>Тест-кейсы, прогоны и дефекты с общей историей</h1>
            <p className={styles.heroLead}>
              Falcon сохраняет ревизию кейса, окружение и сборку каждого запуска. Дефект остаётся связан с исходным шагом.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryButtonLarge} href="/signup/">
                Попробовать <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <ProductFrame
            src="/falcon/landing/run-detail.jpg"
            alt="Активный тест-ран со списком кейсов и сценарием"
            width={2560}
            height={1440}
            mobileSrc="/falcon/landing/run-detail-mobile.jpg"
            mobileWidth={780}
            mobileHeight={1400}
            priority
            className={styles.heroProduct}
          />
        </section>

        <section className={styles.storySection} id="platform">
          <div className={styles.storyCopy}>
            <SectionIntro
              label="Тест-кейсы"
              title="Сценарий, ожидаемый результат и файлы"
              text="Основные шаги, подшаги и ожидаемый результат собраны в одной вертикали. Файлы остаются рядом с тем шагом, к которому относятся."
            />
            <p className={styles.storyNote}>
              Ручные сценарии, чек-листы и автоматизированные кейсы хранятся рядом. Общие шаги обновляются во всех связанных сценариях.
            </p>
          </div>
          <ProductFrame
            src="/falcon/landing/case-repository.jpg"
            alt="Production-репозиторий тест-кейсов Falcon с открытой карточкой"
            width={2174}
            height={1628}
            mobileSrc="/falcon/landing/case-repository-mobile.jpg"
            mobileWidth={780}
            mobileHeight={1400}
          />
        </section>

        <section className={`${styles.storySection} ${styles.storyReverse}`} id="automation">
          <ProductFrame
            src="/falcon/landing/run-builder.jpg"
            alt="Production-конструктор тест-рана с выбором кейсов"
            width={2560}
            height={1440}
            mobileSrc="/falcon/landing/run-builder-mobile.jpg"
            mobileWidth={780}
            mobileHeight={1400}
          />
          <div className={styles.storyCopy}>
            <SectionIntro
              label="Запуски"
              title="Ревизия кейса фиксируется при запуске"
              text="Соберите точный список кейсов или динамический сьют по тегам. При запуске Falcon сохраняет ревизии кейсов, окружение и сборку."
            />
            <dl className={styles.runFacts}>
              <Detail title="Состав">Конкретные кейсы или правила отбора по тегам.</Detail>
              <Detail title="Результат">Статус шага, фактический результат и вложения.</Detail>
            </dl>
          </div>
        </section>

        <section className={styles.defectSection} id="defects">
          <div className={styles.defectLayout}>
            <SectionIntro
              label="Дефекты"
              title="Баг-репорт хранит исходный шаг"
              text="Ожидаемый и фактический результат, вложения, запуск и задача YouTrack доступны из карточки дефекта."
            />
            <ProductFrame
              src="/falcon/landing/case-defect-link.jpg"
              alt="Production-карточка баг-репорта Falcon рядом со списком дефектов"
              width={2560}
              height={1440}
              mobileSrc="/falcon/landing/case-defect-link-mobile.jpg"
              mobileWidth={780}
              mobileHeight={1400}
              className={styles.defectProduct}
            />
          </div>
        </section>

        <section className={styles.integrations} id="integrations">
          <div className={styles.integrationsIntro}>
            <p>Интеграции</p>
            <h2>YouTrack и REST API</h2>
          </div>
          <div className={styles.integrationCopy}>
            <p>Создавайте задачи YouTrack из дефекта Falcon. Для импорта, экспорта и автоматизации доступен REST API.</p>
            <span>YouTrack&nbsp;&nbsp;·&nbsp;&nbsp;REST API&nbsp;&nbsp;·&nbsp;&nbsp;JSON</span>
          </div>
        </section>

        <section className={styles.analyticsSection} id="analytics">
          <SectionIntro
            label="Дашборды"
            title="Из метрики — к кейсам, прогонам и дефектам"
            text="Выберите период и область. Любой показатель открывает отфильтрованные кейсы, прогоны или дефекты."
            centered
          />
          <ProductFrame
            src="/falcon/landing/analytics-dashboard.jpg"
            alt="Production-дашборд качества Falcon по проекту Umbrella-Host"
            width={2560}
            height={1440}
            mobileSrc="/falcon/landing/analytics-dashboard-mobile.jpg"
            mobileWidth={780}
            mobileHeight={1400}
            className={styles.analyticsProduct}
          />
        </section>
      </main>

      <footer className={styles.footer} id="security">
        <div className={styles.footerCta}>
          <div>
            <h2>Создайте рабочее пространство Falcon</h2>
          </div>
          <div>
            <p>Falcon создаст первый проект и окружение. Кейсы, прогоны и вложения останутся внутри вашего пространства.</p>
            <Link className={styles.lightButton} href="/signup/">
              Попробовать <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className={styles.footerMeta}>
          <FalconBrand inverse />
          <p>Тест-кейсы, запуски, дефекты и аналитика.</p>
          <div><Link href="/signup/">Создать пространство</Link><Link href="/cloud-login/">Вход в облако</Link></div>
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
  readonly centered?: boolean;
}) {
  return (
    <div className={`${styles.sectionIntro} ${props.centered ? styles.sectionIntroCentered : ""}`}>
      <p className={styles.sectionLabel}>{props.label}</p>
      <h2>{props.title}</h2>
      <p className={styles.sectionLead}>{props.text}</p>
    </div>
  );
}

function Detail({ title, children }: { readonly title: string; readonly children: string }) {
  return <div><dt>{title}</dt><dd>{children}</dd></div>;
}
