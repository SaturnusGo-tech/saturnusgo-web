import { AnimatedSearch } from "../../common/search/AnimatedSearch";

export function SharedStepSearch({ value, onChange, ru }: { value: string; onChange: (value: string) => void; ru: boolean }) {
  return <AnimatedSearch value={value} onChange={onChange} label={ru ? "Найти общий шаг" : "Find a shared step"}
    placeholder={ru ? "Поиск по названию" : "Search by title"} openLabel={ru ? "Найти общий шаг" : "Search shared steps"}
    closeLabel={ru ? "Закрыть поиск" : "Close search"} />;
}
