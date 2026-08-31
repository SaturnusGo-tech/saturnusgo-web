export const CASE_REPOSITORY_DEFAULT = 280;
export const CASE_REPOSITORY_MIN = 230;
export const CASE_REPOSITORY_MAX = 480;
export const CASE_DETAIL_DEFAULT = 510;
export const CASE_DETAIL_MIN = 340;
export const CASE_DETAIL_MAX = 680;
export const CASE_LIST_MIN = 420;
export const CASE_REPOSITORY_VISIBLE_MIN = CASE_REPOSITORY_MIN + CASE_LIST_MIN;
export const CASE_INLINE_MIN = 1090;

export function clampCaseRepositoryPreference(value: number) {
  return Math.round(Math.min(Math.max(value, CASE_REPOSITORY_MIN), CASE_REPOSITORY_MAX));
}

export function clampCaseDetailPreference(value: number) {
  return Math.round(Math.min(Math.max(value, CASE_DETAIL_MIN), CASE_DETAIL_MAX));
}

export function clampCaseRepositoryWidth(value: number, containerWidth: number) {
  const available = containerWidth > 0
    ? Math.max(CASE_REPOSITORY_MIN, containerWidth - CASE_LIST_MIN)
    : CASE_REPOSITORY_MAX;
  return Math.round(Math.min(clampCaseRepositoryPreference(value), available));
}

export function clampCaseDetailWidth(value: number, containerWidth: number, repositoryWidth: number) {
  const available = containerWidth >= CASE_INLINE_MIN
    ? Math.max(CASE_DETAIL_MIN, containerWidth - repositoryWidth - CASE_LIST_MIN)
    : CASE_DETAIL_MAX;
  return Math.round(Math.min(clampCaseDetailPreference(value), available));
}

export function resolveCasePaneWidths(repository: number, detail: number, containerWidth: number) {
  let boundedRepository = clampCaseRepositoryWidth(repository, containerWidth);
  if (containerWidth >= CASE_REPOSITORY_VISIBLE_MIN) {
    boundedRepository = Math.min(
      boundedRepository,
      Math.max(
        CASE_REPOSITORY_MIN,
        containerWidth - CASE_LIST_MIN - (containerWidth >= CASE_INLINE_MIN ? CASE_DETAIL_MIN : 0),
      ),
    );
  }
  return {
    repository: boundedRepository,
    detail: clampCaseDetailWidth(detail, containerWidth, boundedRepository),
  };
}
