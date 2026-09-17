import type { DictationResultEvent, DictationTranscript } from "./recognition";

/** Browser result lists contain the whole session, including previously finalized segments. */
export function readDictationTranscript(event: DictationResultEvent): DictationTranscript {
  const finalized: string[] = [], interim: string[] = [];
  for (let index = 0; index < event.results.length; index++) {
    const result = event.results[index];
    const text = result?.[0]?.transcript.trim();
    if (text) (result.isFinal ? finalized : interim).push(text);
  }
  return { final: finalized.join(" "), interim: interim.join(" ") };
}
