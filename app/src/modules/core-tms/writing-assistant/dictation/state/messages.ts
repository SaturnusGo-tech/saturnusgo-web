import { TmsApiError } from "../../../../../core/tms/transport/http";
import { DictationFailure } from "../model/errors";

export function dictationError(problem: unknown, ru: boolean) {
  const code = problem instanceof DictationFailure ? problem.code : problem instanceof TmsApiError ? problem.code : "unknown";
  const messages: Record<string, [string, string]> = {
    unavailable: ["Запись голоса недоступна в этом браузере. Введите команду текстом.", "Audio recording is unavailable in this browser. Type your command."],
    "not-allowed": ["Разрешите доступ к микрофону в настройках браузера и попробуйте снова.", "Allow microphone access in your browser settings and try again."],
    "audio-capture": ["Микрофон недоступен. Проверьте подключение и доступ к нему.", "Microphone unavailable. Check its connection and permissions."],
    "audio-interrupted": ["Запись микрофона прервалась. Повторите диктовку.", "Microphone recording was interrupted. Please dictate again."],
    "no-input": ["Микрофон не передаёт звук. Проверьте выбранный микрофон в браузере.", "The microphone is not sending audio. Check the microphone selected in your browser."],
    "too-short": ["Запись слишком короткая. Нажмите микрофон и произнесите команду.", "The recording is too short. Press the microphone and say your command."],
    silent: ["Голос не слышен. Проверьте микрофон и попробуйте ещё раз.", "No voice detected. Check your microphone and try again."],
    "startup-timeout": ["Микрофон не запустился. Проверьте разрешение в браузере и попробуйте снова.", "Microphone did not start. Check browser permissions and try again."],
    DICTATION_EMPTY: ["Речь не распознана. Попробуйте ещё раз.", "No speech recognized. Please try again."],
    DICTATION_INVALID_AUDIO: ["Не удалось обработать запись. Попробуйте продиктовать команду ещё раз.", "Could not process the recording. Please dictate your command again."],
    DICTATION_RATE_LIMITED: ["Лимит диктовки достигнут. Можно ввести команду текстом.", "The dictation limit has been reached. You can type your command."],
    DICTATION_UNAVAILABLE: ["Диктовка временно недоступна. Попробуйте ещё раз или введите команду.", "Dictation is temporarily unavailable. Try again or type your command."],
    unknown: ["Не удалось распознать команду. Введённый текст сохранён.", "Could not transcribe the command. Your typed text is preserved."],
  };
  if (problem instanceof TmsApiError && problem.status === 401) return ru ? "Войдите в аккаунт и повторите диктовку." : "Sign in and try dictation again.";
  if (problem instanceof TmsApiError && problem.status === 403) return ru ? "У вас нет доступа к диктовке в этом пространстве." : "You do not have access to dictation in this workspace.";
  return (messages[code] ?? messages.unknown)[ru ? 0 : 1];
}
