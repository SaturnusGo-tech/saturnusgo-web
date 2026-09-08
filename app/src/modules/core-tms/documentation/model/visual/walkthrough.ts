export type ScreenshotStep = {
  title: string;
  instruction: string;
  result: string;
  image: { src: string; alt: string; width: number; height: number };
};

export type WalkthroughBlock = {
  kind: "walkthrough";
  title: string;
  steps: ScreenshotStep[];
};

export const walkthrough = (title: string, steps: ScreenshotStep[]): WalkthroughBlock => ({
  kind: "walkthrough", title, steps,
});
