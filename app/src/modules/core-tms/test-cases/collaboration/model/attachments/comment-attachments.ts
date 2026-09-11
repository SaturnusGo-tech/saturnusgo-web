export type CommentAttachmentReference = { id: string; name: string };
const attachmentLine = /^\[([^\n]*)\]\(\/falcon-attachments\/([A-Za-z0-9_-]{1,128})\)$/;

/** Durable private attachment references, never expiring storage URLs. */
export function readCommentAttachments(body: string) {
  const attachments: CommentAttachmentReference[] = [];
  const text = body.split("\n").filter(line => {
    const match = attachmentLine.exec(line.trim());
    if (!match || attachments.length >= 20) return true;
    if (!attachments.some(item => item.id === match[2])) attachments.push({ id: match[2], name: match[1].replace(/\\([\\\[\]])/g, "$1") });
    return false;
  }).join("\n").trim();
  return { text, attachments };
}

export function writeCommentAttachments(text: string, attachments: readonly CommentAttachmentReference[]) {
  return [text.trim(), ...attachments.map(item => {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(item.id)) throw new Error("Invalid attachment reference");
    const name = item.name.replace(/[\r\n]/g, " ").replace(/[\\\[\]]/g, "\\$&");
    return `[${name}](/falcon-attachments/${item.id})`;
  })].filter(Boolean).join("\n\n");
}
