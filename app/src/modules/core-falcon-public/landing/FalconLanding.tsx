import Image from "next/image";
import Link from "next/link";
import {
  Activity, ArrowRight, Bot, Boxes, Braces, Bug, Check, Gauge, GitBranch,
  LayoutDashboard, LockKeyhole, Play, ShieldCheck, UsersRound, Workflow,
} from "lucide-react";
import { FalconBrand } from "../shared/FalconBrand";
import { FalconHeader } from "./FalconHeader";
import styles from "./landing.module.css";

const capabilities = ["Ручные кейсы", "Автотесты", "Раны", "Дефекты", "API", "Аналитика"];
const automationCards = [
  [GitBranch, "Единый поток", "Результаты CI, ручные проверки и дефекты остаются в одном контексте."],
  [Bot, "Автотесты рядом", "Импортируйте автоматизированные сценарии и отслеживайте их вместе с ручными."],
  [Activity, "История без разрывов", "Каждый запуск сохраняет ревизию, окружение, сборку и фактический результат."],
  [LockKeyhole, "Приватные вложения", "Скриншоты, видео и файлы доступны только участникам рабочего пространства."],
] as const;

export function FalconLanding() {
  return (
    <div className={styles.page}>
      <FalconHeader />
      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>ПЛАТФОРМА УПРАВЛЕНИЯ КАЧЕСТВОМ</p>
            <h1>Управляйте качеством продукта в одном контуре</h1>
            <p className={styles.heroLead}>
              Falcon связывает тест-кейсы, запуски, дефекты и аналитику — без разрывов между QA, продуктом и разработкой.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryButtonLarge} href="/signup/">
                Создать пространство <ArrowRight size={18} />
              </Link>
              <a className={styles.secondaryButtonLarge} href="#platform">Посмотреть платформу</a>
            </div>
            <p className={styles.heroNote}><Check size={15} /> Без карты и подтверждения по телефону на старте</p>
          </div>
          <ProductFrame
            src="/falcon/landing/test-case-workspace.png"
            alt="Рабочее пространство тест-кейсов Falcon"
            priority
            className={styles.heroProduct}
          />
        </section>

        <section className={styles.trustStrip} aria-label="Возможности Falcon">
          <p>Одна система для всего процесса тестирования</p>
          <div>{capabilities.map((item) => <span key={item}>{item}</span>)}</div>
        </section>

        <section className={styles.section} id="automation">
          <SectionIntro
            eyebrow="АВТОМАТИЗАЦИЯ"
            title="Запускайте проверки и сохраняйте весь контекст"
            text="От ревизии кейса до фактического результата — Falcon удерживает данные запуска в понятной структуре, которую удобно читать всей команде."
          />
          <div className={styles.featureStage}>
            <div className={styles.featureGrid}>
              {automationCards.map(([Icon, title, text]) => (
                <article key={title}><Icon size={20} /><h3>{title}</h3><p>{text}</p></article>
              ))}
            </div>
            <ProductFrame src="/falcon/landing/run-execution.png" alt="Выполнение тест-рана в Falcon" />
          </div>
        </section>

        <section className={styles.darkSection} id="security">
          <div className={styles.darkSectionInner}>
            <div>
              <p className={styles.darkEyebrow}>РАБОЧИЕ ПРОСТРАНСТВА</p>
              <h2>Данные каждой команды отделены по умолчанию</h2>
              <p>Проекты, участники, кейсы и вложения живут внутри своего пространства. Доступ проверяется для каждого действия.</p>
            </div>
            <div className={styles.securityFacts}>
              <span><ShieldCheck size={22} /> Ролевой доступ</span>
              <span><UsersRound size={22} /> Изолированные команды</span>
              <span><Boxes size={22} /> Проекты внутри пространства</span>
            </div>
          </div>
        </section>

        <section className={styles.integrationsSection}>
          <SectionIntro
            eyebrow="ИНТЕГРАЦИИ"
            title="Falcon встраивается в ваш процесс"
            text="Подключайте источники результатов и системы разработки, не меняя привычный поток команды."
          />
          <div className={styles.integrationGrid}>
            <Feature icon={Bug} title="YouTrack" text="Связывайте дефекты с задачами и возвращайтесь к исходному тест-кейсу в один переход." />
            <Feature icon={Workflow} title="CI/CD" text="Передавайте результаты автоматизированных прогонов вместе со сборкой и окружением." />
            <Feature icon={Braces} title="REST API" text="Автоматизируйте создание, запуск и синхронизацию сущностей через единый API." />
          </div>
        </section>

        <section className={styles.section} id="platform">
          <SectionIntro
            eyebrow="РУЧНОЕ ТЕСТИРОВАНИЕ"
            title="Сценарии, которые приятно создавать и проходить"
            text="Структурируйте шаги и ожидаемые результаты, прикрепляйте доказательства, переиспользуйте общие шаги и храните историю изменений."
          />
          <div className={styles.splitFeature}>
            <ProductFrame src="/falcon/landing/test-suite-detail.jpg" alt="Карточка тест-сьюта Falcon" />
            <div className={styles.featureList}>
              <Feature icon={Play} title="Раны без лишних переходов" text="Окружение, сборка и результат всегда находятся рядом со сценарием." />
              <Feature icon={Boxes} title="Переиспользуемые шаги" text="Обновляйте общий сценарий один раз — изменения применятся в связанных кейсах." />
              <Feature icon={Gauge} title="Приоритет виден сразу" text="Компактные сигналы помогают быстро собирать критичный регресс." />
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.analyticsSection}`} id="analytics">
          <SectionIntro
            eyebrow="АНАЛИТИКА"
            title="Понимайте, где продукт проседает"
            text="Сравнивайте покрытие, провалы, блокеры и дефекты по продуктам и компонентам. Из любого показателя можно перейти к исходным данным."
          />
          <ProductFrame src="/falcon/landing/analytics-dashboard.png" alt="Дашборд качества Falcon" />
          <div className={styles.metricRow}>
            <div><strong>30 дней</strong><span>единый период аналитики</span></div>
            <div><strong>4 среза</strong><span>продукт, компонент, тег и тип</span></div>
            <div><strong>1 клик</strong><span>от метрики до исходной записи</span></div>
          </div>
        </section>

        <section className={styles.finalCta}>
          <Image src="/falcon/falcon-mark-light.png" alt="" width={108} height={108} />
          <p className={styles.darkEyebrow}>FALCON CLOUD</p>
          <h2>Создайте первое рабочее пространство</h2>
          <p>Начните с личного пространства, добавьте проект и перенесите процесс тестирования в Falcon.</p>
          <Link className={styles.lightButton} href="/signup/">Попробовать Falcon <ArrowRight size={18} /></Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <FalconBrand inverse />
        <p>Система управления качеством продукта.</p>
        <div><Link href="/signup/">Создать пространство</Link><Link href="/cloud-login/">Вход в облако</Link></div>
        <span>© {new Date().getFullYear()} Falcon</span>
      </footer>
    </div>
  );
}

function ProductFrame(props: { readonly src: string; readonly alt: string; readonly priority?: boolean; readonly className?: string }) {
  return <figure className={`${styles.productFrame} ${props.className ?? ""}`}><Image src={props.src} alt={props.alt} width={1488} height={1058} priority={props.priority} /></figure>;
}

function SectionIntro(props: { readonly eyebrow: string; readonly title: string; readonly text: string }) {
  return <div className={styles.sectionIntro}><p className={styles.eyebrow}>{props.eyebrow}</p><h2>{props.title}</h2><p>{props.text}</p></div>;
}

function Feature({ icon: Icon, title, text }: { readonly icon: typeof LayoutDashboard; readonly title: string; readonly text: string }) {
  return <article><Icon size={21} /><div><h3>{title}</h3><p>{text}</p></div></article>;
}
