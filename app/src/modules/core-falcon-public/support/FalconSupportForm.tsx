"use client";

import { ErrorToast } from "../../core-tms/presentation/common/error/ErrorToast";
import { Button, Input, Textarea } from "@heroui/react";
import { Paperclip, X } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { supportCopy, type SupportLocale } from "./copy";
import styles from "./support.module.css";

const attachmentTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/quicktime", "video/webm"];
const maxAttachmentBytes = 8 * 1024 * 1024;
const maxAttachments = 3;
const maxMessageLength = 4000;
const contactEndpoint = "/api/v1/public/support/contact";

type Feedback = "sent" | "invalid" | "unsupportedFile" | "size" | "rate" | "unavailable";

export default function FalconSupportForm({ locale }: { locale: SupportLocale }) {
  const copy = supportCopy[locale];
  const filePicker = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function attachFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (selected.length === 0) return;

    const files = [...attachments, ...selected];
    if (selected.some(file => file.size === 0 || !attachmentTypes.includes(file.type))) {
      setFeedback("unsupportedFile");
      return;
    }
    if (files.length > maxAttachments || files.reduce((total, file) => total + file.size, 0) > maxAttachmentBytes) {
      setFeedback("size");
      return;
    }
    setAttachments(files);
    setFeedback(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    const form = event.currentTarget;
    const fields = new FormData(form);
    const message = String(fields.get("message") ?? "").trim();
    if (!message || message.length > maxMessageLength) {
      setFeedback("invalid");
      return;
    }
    fields.set("message", message);
    attachments.forEach(file => fields.append("attachments", file));

    submitting.current = true;
    setSending(true);
    setFeedback(null);
    try {
      const response = await fetch(contactEndpoint, { method: "POST", body: fields, credentials: "omit" });
      if (response.status === 202) {
        const result = await response.json();
        if (result?.data?.accepted === true) {
          form.reset();
          setAttachments([]);
          setFeedback("sent");
          return;
        }
      }
      const failure = { 400: "invalid", 413: "size", 429: "rate" } as const;
      setFeedback(failure[response.status as keyof typeof failure] ?? "unavailable");
    } catch {
      setFeedback("unavailable");
    } finally {
      submitting.current = false;
      setSending(false);
    }
  }

  const fieldStyles = {
    base: styles.field,
    label: styles.label,
    inputWrapper: styles.inputWrapper,
    input: styles.input,
  };

  return (
    <>
      <form className={styles.form} action={contactEndpoint} method="post" encType="multipart/form-data" onSubmit={submit} aria-busy={sending}>
        <input type="hidden" name="locale" value={locale} />
        <Input
          autoComplete="email"
          classNames={fieldStyles}
          isReadOnly={sending}
          isRequired
          label={copy.email}
          labelPlacement="outside"
          maxLength={254}
          name="email"
          placeholder={copy.emailPlaceholder}
          type="email"
          validationBehavior="native"
        />
        <Textarea
          aria-describedby="falcon-support-message-hint"
          aria-label={copy.message}
          classNames={{ ...fieldStyles, inputWrapper: `${styles.inputWrapper} ${styles.messageWrapper}` }}
          disableAutosize
          isReadOnly={sending}
          isRequired
          maxLength={maxMessageLength}
          name="message"
          placeholder={copy.messagePlaceholder}
          rows={5}
          validationBehavior="native"
        />
        {attachments.length > 0 && (
          <ul className={styles.attachments}>
            {attachments.map((file, index) => (
              <li key={`${index}-${file.name}`}>
                <span>{file.name}</span>
                <Button
                  aria-label={`${copy.removeFile} ${file.name}`}
                  className={styles.removeButton}
                  isDisabled={sending}
                  isIconOnly
                  size="sm"
                  type="button"
                  variant="light"
                  onPress={() => {
                    setAttachments(attachments.filter((_, position) => position !== index));
                    setFeedback(null);
                  }}
                ><X size={14} aria-hidden="true" /></Button>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.actions}>
          <input ref={filePicker} type="file" multiple hidden accept={attachmentTypes.join(",")} onChange={attachFiles} />
          <Button
            className={styles.attachButton}
            isDisabled={sending}
            startContent={<Paperclip size={15} aria-hidden="true" />}
            type="button"
            variant="light"
            aria-describedby="falcon-support-attachment-hint"
            onPress={() => filePicker.current?.click()}
          >{copy.attach}</Button>
          <Button className={styles.submitButton} isLoading={sending} radius="full" type="submit" variant="flat">
            {copy.submit}
          </Button>
        </div>
      </form>
      {feedback === "sent" && <p className={styles.feedback} role="status">{copy.sent}</p>}
      <ErrorToast message={feedback && feedback !== "sent" ? copy[feedback] : null} />
      <div className={styles.formFooter}>
        <p id="falcon-support-attachment-hint">{copy.attachmentHint}</p>
        <a href={`/privacy/?lang=${locale}`}>{copy.privacy}</a>
      </div>
    </>
  );
}
