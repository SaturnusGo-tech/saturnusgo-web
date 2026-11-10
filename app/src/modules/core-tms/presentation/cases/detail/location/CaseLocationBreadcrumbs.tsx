import { WorkspaceBreadcrumbs } from "../../../common/breadcrumbs/WorkspaceBreadcrumbs";

export function CaseLocationBreadcrumbs({ ru, projectName, path, title, onFolder }: {
  ru: boolean;
  projectName?: string;
  path: string;
  title?: string;
  onFolder?: (path: string) => void;
}) {
  const folders = path.split("/").filter(Boolean);
  const items = [
    { id: "/", label: projectName || (ru ? "Репозиторий" : "Repository"), onPress: onFolder && (() => onFolder("/")) },
    ...folders.map((label, index) => {
      const folder = "/" + folders.slice(0, index + 1).join("/");
      return { id: folder, label, onPress: onFolder && (() => onFolder(folder)) };
    }),
    ...(title ? [{ id: "case", label: title }] : []),
  ];
  return <WorkspaceBreadcrumbs label={ru ? "Путь тест-кейса" : "Test case path"} items={items} />;
}
