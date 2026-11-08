export function formatAttachmentSize(bytes: number, languageTag: string, ru: boolean) {
  const megabytes = bytes >= 1_048_576;
  const unit = megabytes ? (ru ? "МБ" : "MB") : (ru ? "КБ" : "KB");
  const size = new Intl.NumberFormat(languageTag, { maximumFractionDigits: 2 })
    .format(bytes / (megabytes ? 1_048_576 : 1024));
  return `${size} ${unit}`;
}
