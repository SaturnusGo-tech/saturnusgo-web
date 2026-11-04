import { PiFileTextDuotone, PiFolderOpenDuotone, PiFolderSimpleDuotone } from "react-icons/pi";
import css from "../../styles/repository.module.css";

export function RepositoryEmptyState({ ru }: { ru: boolean }) {
  return <li className={css.emptyStart}>
    <div className={css.emptyIllustration} aria-hidden="true">
      <div className={css.illustrationRoot}><PiFolderOpenDuotone size={24} /><i /></div>
      <div className={css.illustrationChildren}>
        <div><PiFolderSimpleDuotone size={21} /><i /></div>
        <div><PiFileTextDuotone size={19} /><i /></div>
      </div>
    </div>
    <strong>{ru ? "Здесь будут ваши тесты" : "Your tests start here"}</strong>
    <p>{ru ? "Создайте папку и добавьте в неё первый тест-кейс." : "Create a folder, then add your first test case."}</p>
  </li>;
}
