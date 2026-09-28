import { articles, bullets, note, paragraph, section, steps, type DocArticle } from "../../../model/article";

export const caseCommentsArticle: DocArticle = {
  id: "case-comments", title: "Comments, replies, and mentions", group: "cases",
  description: "Discuss test cases and bug reports, reply in threads, and invite colleagues to review.",
  keywords: ["comments", "discussion", "response", "reply", "reply", "mention", "invite", "comment", "message link"],
  related: ["create-defect", "edit-test-case", "notifications", "telegram-notifications", "browser-notifications"],
  sections: [
    section("write", "Write a comment", steps(
      ["Open the discussion", "In a test case or a bug report's **Overview** tab, find **Comments** with its open Markdown editor. The formatting toolbar and input are always available."],
      ["Enter your text", "Use emphasis, lists, checklists, code, and links in the formatting toolbar. **Post** is inside the bottom right of the field and becomes available after you enter text or upload an attachment. The maximum message length, including attachment links, is 10,000 characters."],
      ["Post it", "Click **Post**, or press Cmd+Enter on Mac or Ctrl+Enter on Windows. Repeat submission is blocked while saving. If an error occurs, your text stays in the editor: resolve the cause and try again."]),
      note("Discussion access", "Comments are available to members who can access the relevant test case or bug report. Writing, editing, and deleting messages depend on the user's role and permissions.")),
    section("reply", "Reply to a message", steps(
      ["Choose the original message", "Click the reply arrow to the right of a comment or **⋯ → Reply**. This works for both the first message and any nested reply."],
      ["Check the context", "Falcon scrolls smoothly to the shared comment field above the feed and focuses it. A quote with a blue line appears below the formatting toolbar. The editor's lower strip shows the original author's name and photo."],
      ["Write your reply", "Type below the quote. The quote provides context and is not inserted into your text. After posting, the message appears in the appropriate thread: the original quote with its blue line, followed by your reply. If the original comment was deleted, a deletion marker replaces the quote."],
      ["Change the recipient if needed", "Click Reply on another message to replace the quote and recipient while keeping your draft. The cross beside the recipient cancels the reply and keeps the text as a normal comment. The quote and lower strip disappear, but the editor stays open."]),
      paragraph("New comments and replies share one input; no extra forms open beneath messages. Collapse a thread using the button below a message or by clicking its branch line; reopen it with **Show replies**.")),
    section("attachments", "Attach an image or file", steps(
      ["Choose files", "Click the paperclip at the bottom left of the editor. Select multiple images or files, up to 20 attachments per comment."],
      ["Wait for uploads", "A blue upload indicator appears below each filename. Posting is unavailable while any file is uploading or has not been saved."],
      ["Resolve errors if needed", "Click **Retry** beside a failed file or remove it with the cross. Other attachments and your text are preserved. Post the comment once uploads succeed."],
      ["Open an attachment", "In a published comment, click an attachment to preview or open it. When editing, you can add new files or remove links to existing ones."]),
      note("File access", "Attachments are saved in the company's private project storage. The server checks access. Removing a link from a comment does not delete the file from project storage.")),
    section("mentions", "Mention a colleague", steps(
      ["Choose colleagues", "Inside the editor, beside the paperclip, click **Mention**. Find an employee by name or email and select them. You can mention up to 20 company employees. Remove a mention with the cross beside the name."],
      ["Post the message", "Notifications are created after the comment is saved. Typing @ in plain text does not replace selecting an employee from the list."],
      ["Check delivery channels", "Selected employees receive personal notifications through connected Telegram and permitted browser notifications when the Test cases category is enabled for cases or Defects for bug reports. Authors are not notified for mentioning someone else. Mentioning yourself also works, including in Telegram."],
      ["Notify Slack if needed", "If Slack is connected to the project, **Project Slack channel** also sends the message to the shared project channel. It is not a direct message to the selected employee."]),
      note("Replies and mentions", "Replying to a message does not count as a mention. To notify a colleague, select them through **Mention**."),
      articles("telegram-notifications", "browser-notifications", "notifications")),
    section("manage", "Edit or delete a comment", bullets(
      "Click the pencil to the right of your message or **⋯ → Edit**. Edit the text and click **Save**. An edited label appears.",
      "To delete, choose **⋯ → Delete** and confirm. Replies remain, while a deletion marker replaces the original text.",
      "Administrators and QA managers can delete other people's comments within their permissions. Unavailable actions have no corresponding button.",
      "When editing, newly added recipients are notified. Previously sent Telegram and Slack messages are not automatically updated or deleted.")),
    section("share", "Share a link", paragraph("Click the link icon beside the date or **⋯ → Share**. The copied link opens the relevant case or bug report, expands the thread, and scrolls to the specific message. If copying is blocked, a field appears for manual copying."),
      note("Links do not grant access", "Recipients must sign in to the company and have permission for the relevant case or bug report. If a message is unavailable or fails to load, Falcon explains the issue and offers a retry.")),
  ],
};
