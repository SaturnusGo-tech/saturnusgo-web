import {
  FaConfluence,
  FaGithub,
  FaJira,
  FaSlack,
  FaTrello,
} from "react-icons/fa6";
import { SiLinear, SiSwagger } from "react-icons/si";
import { ProductVideo } from "./media/ProductVideo";
import { demos } from "./content/demos";
import { Reveal } from "./motion/Reveal";
import styles from "./landing.module.css";
const services = [
  { name: "Jira", Icon: FaJira },
  { name: "Linear", Icon: SiLinear },
  { name: "Trello", Icon: FaTrello },
  { name: "GitHub", Icon: FaGithub },
  { name: "Slack", Icon: FaSlack },
  { name: "Confluence", Icon: FaConfluence },
  { name: "Swagger", Icon: SiSwagger },
];
export function FalconIntegrations() {
  return (
    <section
      className={styles.integrationScene}
      id="integrations"
      aria-labelledby="integrations-title"
    >
      <Reveal className={styles.sectionHeading}>
        <p className={styles.eyebrow}>04 / Интеграции</p>
        <div>
          <h2 id="integrations-title">В вашем рабочем процессе.</h2>
          <p>
            Свяжите Falcon с трекером задач, репозиторием и каналом команды.
            Настройте подключения и правила для конкретного проекта.
          </p>
        </div>
      </Reveal>
      <ProductVideo demo={demos.integrations} />
      <div
        className={styles.integrationMarks}
        aria-label="Сервисы с настройкой подключения"
      >
        <span className={styles.integrationService}>
          <img
            className={styles.integrationMark}
            src="/falcon/integrations/youtrack.svg"
            alt=""
            width={22}
            height={22}
            loading="lazy"
          />
          YouTrack
        </span>
        {services.map(({ name, Icon }) => (
          <span key={name} className={styles.integrationService}>
            <Icon className={styles.integrationMark} aria-hidden="true" />
            {name}
          </span>
        ))}
      </div>
      <p className={styles.integrationFootnote}>
        Доступные действия зависят от сервиса: связанные задачи и статусы,
        события GitHub Actions, уведомления Slack, публикация отчётов в
        Confluence или подключение OpenAPI-спецификации. Права доступа
        настраиваются в вашем сервисе.
      </p>
    </section>
  );
}
