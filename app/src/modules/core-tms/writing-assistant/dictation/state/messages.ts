export function dictationError(code: string, ru: boolean) {
  const messages: Record<string, [string, string]> = {
    unavailable: ["Диктовка недоступна в этом браузере. Можно использовать системную диктовку в поле команды.", "Dictation is unavailable in this browser. You can use system dictation in the command field."],
    "not-allowed": ["Разрешите доступ к микрофону в настройках браузера и попробуйте снова.", "Allow microphone access in your browser settings and try again."],
    "service-not-allowed": ["Браузер не разрешает распознавание речи. Можно использовать системную диктовку.", "Speech recognition is disabled in this browser. You can use system dictation."],
    "audio-capture": ["Микрофон недоступен. Проверьте подключение и доступ к нему.", "Microphone unavailable. Check its connection and permissions."],
    "no-speech": ["Речь не распознана. Попробуйте ещё раз.", "No speech recognized. Please try again."],
    network: ["Не удалось связаться со службой диктовки браузера. Попробуйте снова или введите команду.", "Cannot reach the browser's dictation service. Try again or type your command."],
    "language-not-supported": ["Браузер не поддерживает диктовку на этом языке. Можно использовать системную диктовку.", "This dictation language is not supported by your browser. You can use system dictation."],
    "startup-timeout": ["Микрофон не запустился. Проверьте разрешение в браузере и попробуйте снова.", "Microphone did not start. Check browser permissions and try again."],
    unknown: ["Не удалось запустить диктовку. Введённый текст сохранён.", "Could not start dictation. Your typed text is preserved."],
  };
  return (messages[code] ?? messages.unknown)[ru ? 0 : 1];
}
