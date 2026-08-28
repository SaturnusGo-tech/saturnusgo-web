export type TmsMessageVariables = Record<string, string | number>;

export const interpolateMessage = (
  template: string,
  variables: TmsMessageVariables = {},
) =>
  template.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (token, name: string) =>
    Object.prototype.hasOwnProperty.call(variables, name)
      ? String(variables[name])
      : token,
  );
