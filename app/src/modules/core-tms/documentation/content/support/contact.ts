import { type DocArticle, section, paragraph, steps, bullets, note } from "../../model/article";
export const supportArticle:DocArticle={
 id:"contact-support",title:"Contact us",description:"Ask a question, report a bug, or suggest an improvement to Falcon.",group:"reference",
 keywords:["request","support","contact","screenshot","file","error","question","suggestion"],
 sections:[
  section("create","New support request",paragraph("Near the bottom of the sidebar, click Contact us below Help. The form is available to company employees, including before the first project is created."),
   steps(["Choose a type and section","Choose a question, bug, or improvement. Specify the Falcon section your request concerns."],
    ["Describe the situation","Fill in the subject and description. The page link is inserted automatically; you can edit or remove it. It is optional for questions, bugs, and improvements. For a bug, describe the actions, expected result, and what happened. The editor supports lists, links, and code blocks."],
    ["Add evidence","Click the paperclip, paste a file from the clipboard, or drag it into the form. Add screenshot captures the current Falcon screen without the request window. Click its thumbnail to review it or the cross to remove it."],
    ["Submit the request","Click Create request and wait for confirmation. Repeat submission is blocked while files upload."])),
  section("files","Files and screenshots",bullets("Up to 10 files: PNG, JPEG, WebP, GIF, PDF, TXT, LOG, JSON, CSV, and ZIP.","Up to 10 MB per file and 25 MB per request.","The automatic screenshot captures Falcon's visible area. Video, external widgets, and restricted images may be omitted. If needed, attach a screenshot taken with your computer's tools.")),
  section("delivery","After submission",paragraph("The form closes and a compact Request received successfully notification appears at the top. It disappears after 10 seconds; you can also swipe it away or close it with the cross. Falcon saves the request and sends it to the support queue. If the processing service is temporarily unavailable, delivery retries automatically. Receipt confirmation means the request was saved; the reply will arrive by email."),
   note("If submission is interrupted","Your text and files stay in the open form. Submit again. Do not reload before receipt is confirmed: unsaved text is stored in the current tab.")),
  section("context","What support sees",paragraph("The request includes your supplied link, if present, company name and identifier, and the author and primary administrator's names, contact emails, and phone numbers where provided. Account usernames, passwords, and tokens are not included. Check your profile email so we can reply.")),
 ],related:["company-access"]
};
