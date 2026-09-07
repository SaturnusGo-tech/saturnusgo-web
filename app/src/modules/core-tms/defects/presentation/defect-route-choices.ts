type RouteState = Readonly<{
  configurationVersion: number | null;
  enabled: boolean;
  options: readonly Readonly<{ value: string; label: string }>[];
}>;

type RouteCopy = Readonly<{
  youTrackPlaceholder: string;
  projectIntegrations: string;
}>;

export function defectRouteChoices(state: RouteState, copy: RouteCopy) {
  const youTrack = state.options.map((option) => ({ ...option, label: `YouTrack · ${option.label}` }));
  if (state.configurationVersion === 2 && state.enabled) {
    return [{ value: "", label: copy.projectIntegrations }, ...youTrack];
  }
  if (state.configurationVersion === 1 && state.enabled) {
    return [
      { value: "", label: copy.youTrackPlaceholder },
      { value: "tms", label: copy.projectIntegrations },
      ...youTrack,
    ];
  }
  return [{
    value: "",
    label: copy.projectIntegrations,
  }];
}
