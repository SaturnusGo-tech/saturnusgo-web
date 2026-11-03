import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const portfoliosWalkthrough = walkthrough("Find existing work and prepare a portfolio or project", [
  shot("organization-01-catalog-20260913-en-20260928", "Find a portfolio or project",
    "Open **More sections → Portfolios and projects**. Use **All**, **Portfolios**, **Without portfolio**, search and status to narrow the catalog. Portfolio rows show their project count; project rows retain their permanent key.",
    "The actual Umbrella Home catalog contains existing portfolios and projects. Opening the catalog does not create them or change their membership.",
    "Umbrella Home portfolio and project catalog with existing records, filters and creation actions."),
  shot("organization-02-portfolio-20260913-en-20260928", "Inspect the existing portfolio",
    "Open a portfolio’s **About portfolio** tab to review its description, checklist, status, responsible person and discussion. **Projects** shows membership and actions to create a project or add an existing project without a portfolio. Select a project to open its overview and test repository.",
    "The existing Umbrella-host-main portfolio is In progress, with Mercury Rucks responsible, three projects and a completed 2/2 checklist. Its saved properties and discussion were not changed for documentation.",
    "Existing Umbrella-host-main portfolio with its description, checklist, ownership and project context."),
  shot("organization-05-portfolio-create-20260913-en-20260928", "Prepare a new portfolio",
    "Select **New portfolio**, enter a name and open the description by clicking it or its pencil. Set status and responsible person as needed. The round checkmark creates the portfolio; the cross cancels. Projects and files are added after creation.",
    "This is an unsaved new-portfolio form. It illustrates where information belongs without creating an additional portfolio.",
    "Unsaved New portfolio page with its name, description, status, ownership and creation controls."),
  shot("organization-03-project-dialog-20260913-en-20260928", "Prepare a project and testing plan",
    "Select **Create project**, enter a name and permanent key, then check the portfolio and responsible person. Click **Description** or **Testing plan** to use the Markdown editor; **Done** finishes editing that field. The page checkmark creates the project, while the cross cancels.",
    "The screenshot shows an unsaved project with the description editor open. No new project was saved; files become available after project creation. A saved key is permanent.",
    "Unsaved Create project page with its Markdown description editor, testing plan, key and ownership fields."),
]);
