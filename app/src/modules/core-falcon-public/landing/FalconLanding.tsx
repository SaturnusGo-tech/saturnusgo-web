import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FalconBrand } from "../shared/FalconBrand";
import { FalconHeader } from "./FalconHeader";
import { FalconHeroCinema } from "./FalconHeroCinema";
import { FalconIntegrations } from "./FalconIntegrations";
import { ProductVideo } from "./media/ProductVideo";
import { demos, workflow, overviewStory, resultsStory } from "./content/demos";
import { PilotSection } from "./pilot/PilotSection";
import { Reveal } from "./motion/Reveal";
import { ProductStory } from "./ProductStory";
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
          <ProductStory story={overviewStory} headingId="overview-title" />
          <Reveal className={styles.videoReveal} variant="media">
            <ProductVideo demo={demos.projects} priority />
          </Reveal>
        </section>
        <nav className={styles.chapterNav} aria-label="Возможности Falcon">
          {workflow.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </nav>
        {workflow.map((item) => (
          <section
            key={item.id}
            className={styles.workflowSection}
            id={item.id}
            aria-labelledby={`${item.id}-title`}
          >
            <ProductStory story={item} headingId={`${item.id}-title`} />
            <Reveal className={styles.videoReveal} variant="media">
              <ProductVideo demo={demos[item.id]} />
            </Reveal>
          </section>
        ))}
        <FalconIntegrations />
        <section className={styles.workflowSection} id="results" aria-labelledby="results-title">
          <ProductStory story={resultsStory} headingId="results-title" />
          <Reveal className={styles.videoReveal} variant="media">
            <ProductVideo demo={demos.dashboard} />
          </Reveal>
        </section>
        <PilotSection />
        <section className={styles.faq} aria-labelledby="faq-title">
          <h2 id="faq-title">Перед началом работы</h2>
          <div>
            <details>
              <summary>Как начать пилот?</summary>
              <p>
                Напишите в Telegram @bysieger. Обсудим ваш продукт, размер команды,
                нужные интеграции и условия пилота. После согласования создадим
                пространство компании и выдадим доступ администратору.
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
              <summary>Как сотрудники получают доступ?</summary>
              <p>
                Администратор компании добавляет сотрудников в своей панели
                и назначает им роли. Команда входит в Falcon по адресу компании.
                Количество доступных мест согласуем перед началом пилота.
              </p>
            </details>
          </div>
        </section>
      </main>
      <footer className={styles.footer} id="pilot">
        <img
          className={styles.footerWing}
          src="/falcon/landing/2026-09/falcon-wing.webp"
          alt=""
          aria-hidden="true"
          width={1672}
          height={941}
          loading="lazy"
        />
        <Reveal className={styles.footerCta}>
          <h2>
            Проверим Falcon
            <br />на ваших задачах.
          </h2>
          <p className={styles.pilotLead}>Расскажите о продукте и команде. Обсудим демонстрацию,
            перенос проверок и условия пилота.</p>
          <a className={styles.primaryButton} href="https://t.me/bysieger" target="_blank" rel="noopener noreferrer">
            Написать в Telegram <ArrowRight size={17} aria-hidden="true" />
          </a>
          <p className={styles.telegramHandle}>@bysieger · напрямую основателю Falcon</p>
        </Reveal>
        <div className={styles.footerMeta}>
          <FalconBrand inverse />
          <span>Управление тестированием</span>
          <Link href="/cloud-login/">
            Войти в компанию <ArrowRight size={14} aria-hidden="true" />
          </Link>
          <small>© {new Date().getFullYear()} Falcon</small>
        </div>
      </footer>
    </div>
  );
}
