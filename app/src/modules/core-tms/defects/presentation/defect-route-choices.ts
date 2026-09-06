type RouteState = Readonly<{
  configurationVersion: number | null;
  enabled: boolean;
  options: readonly Readonly<{ value: string; label: string }>[];
}>;

type RouteCopy = Readonly<{
  youTrackAutomatic: string;
  youTrackPlaceholder: string;
  tmsOnly: string;
}>;

export function defectRouteChoices(state: RouteState, copy: RouteCopy) {
  if (state.configurationVersion === 2 && state.enabled) {
    return [{ value: "", label: copy.youTrackAutomatic }, ...state.options];
  }
  if (state.configurationVersion === 1 && state.enabled) {
    return [
      { value: "", label: copy.youTrackPlaceholder },
      { value: "tms", label: copy.tmsOnly },
      ...state.options,
    ];
  }
  return [{
    value: "",
    label: state.configurationVersion === null ? copy.youTrackPlaceholder : copy.tmsOnly,
  }];
}
