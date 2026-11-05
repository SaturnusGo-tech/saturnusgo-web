import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const portfoliosWalkthrough = walkthrough("Find existing work and prepare a portfolio or project", [
  shot("organization-01-catalog-20260913-en-20260928", "Find a portfolio or project",
    "Open **More sections → Portfolios and projects**. Use **All**, **Portfolios**, **Without portfolio**, search and status to narrow the catalog. Portfolio rows show their project count; project rows retain their permanent key.",
    "The actual Umbrella Home catalog is filtered to **Falcon Guide** on **All**: one existing project with permanent key **GUIDE** and no responsible person assigned. Opening the catalog does not create records or change their membership.",
    "Umbrella Home catalog on All, filtered to Falcon Guide: one existing GUIDE project row, Not assigned owner, Active filter and creation actions."),
  shot("organization-02-portfolio-20260913-en-20260928", "Inspect the existing portfolio",
    "Open a portfolio’s **About portfolio** tab to review its description, checklist, status, responsible person and discussion. **Projects** shows membership and actions to create a project or add an existing project without a portfolio. Select a project to open its overview and test repository.",
    "The existing **Руководство Falcon** portfolio is shown on **About portfolio** with no description, status **New**, no responsible person and one project. The saved Russian portfolio name is preserved. Its properties and discussion were not changed for documentation.",
    "About portfolio for existing Руководство Falcon: no description, New status, Not assigned owner, one project, checklist control and discussion area."),
  shot("organization-05-portfolio-create-20260913-en-20260928", "Prepare a new portfolio",
    "Select **New portfolio**, enter a name and open the description by clicking it or its pencil. Set status and responsible person as needed. The round checkmark creates the portfolio; the cross cancels. Projects and files are added after creation.",
    "The unsaved **Release quality** portfolio has an English description, **New** status and no responsible person. The description editor is collapsed; files and project membership become available after creation. No portfolio was created.",
    "Unsaved English Release quality portfolio with a collapsed description, New status and creation controls."),
  shot("organization-03-project-dialog-20260913-en-20260928", "Prepare a project and testing plan",
    "Select **Create project**, enter a name and permanent key, then check the portfolio and responsible person. Click **Description** or **Testing plan** to use the Markdown editor; **Done** finishes editing that field. The page checkmark creates the project, while the cross cancels.",
    "The unsaved **Booking quality** project contains an English description and testing plan, key **BOOK**, status **New**, no portfolio and no assigned owner. Both text editors are collapsed. No project was created; files become available after creation.",
    "Filled unsaved English Create project form with description, testing plan, BOOK key and project properties."),
]);
