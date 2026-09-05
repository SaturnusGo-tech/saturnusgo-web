import type { IconType } from "react-icons";
import {
  FaConfluence,
  FaGithub,
  FaGitlab,
  FaJenkins,
  FaJira,
  FaSlack,
  FaTrello,
} from "react-icons/fa6";
import { SiLinear, SiSentry, SiTeamcity } from "react-icons/si";
import styles from "./landing.module.css";

type Integration = {
  readonly name: string;
  readonly purpose: string;
  readonly Icon?: IconType;
  readonly iconSrc?: string;
};

type IntegrationGroup = {
  readonly title: string;
  readonly items: readonly Integration[];
};

const integrationGroups: readonly IntegrationGroup[] = [
  {
    title: "Задачи",
    items: [
      { name: "YouTrack", purpose: "Дефекты и статусы", iconSrc: "/falcon/integrations/youtrack.svg" },
      { name: "Jira", purpose: "Задачи и статусы", Icon: FaJira },
      { name: "Linear", purpose: "Задачи и статусы", Icon: SiLinear },
      { name: "Trello", purpose: "Карточки и статусы", Icon: FaTrello },
    ],
  },
  {
    title: "Код и CI",
    items: [
      { name: "GitHub", purpose: "Issues и Actions", Icon: FaGithub },
      { name: "GitLab", purpose: "Issues и Pipelines", Icon: FaGitlab },
      { name: "Jenkins", purpose: "Сборки и результаты", Icon: FaJenkins },
      { name: "TeamCity", purpose: "Сборки и результаты", Icon: SiTeamcity },
    ],
  },
  {
    title: "Коммуникации и мониторинг",
    items: [
      { name: "Slack", purpose: "Уведомления о прогонах", Icon: FaSlack },
      { name: "Confluence", purpose: "Требования и документация", Icon: FaConfluence },
      { name: "Sentry", purpose: "Ошибки и релизы", Icon: SiSentry },
    ],
  },
];

export function FalconIntegrations() {
  return (
    <section
      className={styles.integrationScene}
      id="integrations"
      aria-labelledby="falcon-integrations-title"
      aria-describedby="falcon-integrations-note"
    >
      <div className={styles.integrationInner}>
        <header className={styles.integrationIntro}>
          <p className={styles.sectionLabel}>План интеграций</p>
          <h2 id="falcon-integrations-title">Что будем подключать</h2>
          <p id="falcon-integrations-note">
            Перечисленные интеграции запланированы. После выпуска их можно будет настроить в проекте.
          </p>
        </header>

        <div className={styles.integrationDirectory}>
          {integrationGroups.map((group) => (
            <section className={styles.integrationGroup} key={group.title}>
              <h3>{group.title}</h3>
              <ul className={styles.integrationList}>
                {group.items.map((item) => (
                  <li className={styles.integrationItem} key={item.name}>
                    <IntegrationMark integration={item} />
                    <strong>{item.name}</strong>
                    <span>{item.purpose}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <div className={styles.integrationProtocol}>
            <span>Другие сервисы</span>
            <strong>REST API и вебхуки</strong>
            <p>Подключение внутренних инструментов и автоматизации.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function IntegrationMark({ integration }: { readonly integration: Integration }) {
  if (integration.iconSrc) {
    return (
      <img
        className={`${styles.integrationMark} ${styles.integrationMarkImage}`}
        src={integration.iconSrc}
        width="28"
        height="28"
        alt=""
        aria-hidden="true"
        loading="lazy"
      />
    );
  }

  if (!integration.Icon) return null;

  const Icon = integration.Icon;
  return <Icon className={styles.integrationMark} aria-hidden="true" focusable="false" />;
}
