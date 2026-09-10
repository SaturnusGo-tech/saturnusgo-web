import { ArrowUpRight } from "lucide-react";
import { Reveal } from "../motion/Reveal";
import styles from "./pilot.module.css";

export function PilotSection() {
  return (
    <section className={styles.section} aria-labelledby="company-title">
      <Reveal>
        <p className={styles.label}>Для вашей команды</p>
        <h2 id="company-title">Свой проект. Свои сотрудники. Свой порядок работы.</h2>
        <div className={styles.points}>
          <div>
            <h3>Пространство компании</h3>
            <p>Отдельный адрес для входа и доступ к проектам вашей компании.</p>
          </div>
          <div>
            <h3>Управление доступом</h3>
            <p>Администратор добавляет сотрудников, назначает роли и отключает доступ.</p>
          </div>
          <div>
            <h3>Пилот на ваших сценариях</h3>
            <p>Обсудим состав команды, перенос кейсов и нужные интеграции до начала работы.</p>
          </div>
        </div>
        <a href="https://t.me/bysieger" target="_blank" rel="noopener noreferrer" className={styles.contact}>
          Обсудить задачу в Telegram <ArrowUpRight size={17} aria-hidden="true" />
        </a>
      </Reveal>
    </section>
  );
}
