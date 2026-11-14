import { Button, Skeleton } from "@heroui/react";
import css from "./data.module.css";
export function DataFeedback({ loading, error, denied, ru, retry }: { loading?: boolean; error?: string | boolean | null; denied?: boolean; ru: boolean; retry?: () => void }) {
  if (denied) return <p className={css.notice} role="status">{ru ? "Нет доступа к тестовым данным этого проекта." : "You do not have access to this project’s test data."}</p>;
  if (loading) return <div className={css.loading} role="status" aria-label={ru ? "Загрузка тестовых данных" : "Loading test data"}>
    {[0, 1, 2].map(key => <Skeleton key={key} className={css.skeleton} />)}</div>;
  if (!error) return null;
  if (error === "STEP_UP_UNAVAILABLE") return <p role="alert" className={css.notice}>{ru ? "Этот способ входа пока не поддерживает повторную проверку доступа к секретам." : "This sign-in method cannot verify secret access yet."}</p>;
  if (error === "CREDENTIAL_VERSION_CHANGED") return <p role="alert" className={css.notice}>{ru ? "Версия учётных данных изменилась после подготовки этой попытки. Начните новую попытку с актуальной версией." : "This credential changed after this attempt was prepared. Start a new attempt to use its current version."}</p>;
  if (error === "CREDENTIAL_DISABLED") return <p role="alert" className={css.notice}>{ru ? "Учётные данные отключены. Выберите другой разрешённый источник и начните новую попытку." : "This credential is disabled. Choose another allowed source and start a new attempt."}</p>;
  const conflict = typeof error === "string" && /CONFLICT|VERSION_CHANGED/.test(error);
  return <div role="alert"><p className={css.error}>{conflict
    ? (ru ? "Данные изменились. Обновите страницу и проверьте изменения перед сохранением." : "This resource changed. Refresh and review the changes before saving.")
    : (ru ? "Не удалось выполнить запрос. Проверьте доступ и повторите попытку." : "The request could not be completed. Check your access and try again.")}</p>
    {retry && <Button type="button" className={css.button} onPress={retry}>{ru ? "Повторить" : "Retry"}</Button>}</div>;
}
