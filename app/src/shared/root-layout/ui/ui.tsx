import { ROOT_LAYOUT_LANGUAGE } from '../constants/constants';
import type { RootLayoutProps } from '../types/types';

export function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={ROOT_LAYOUT_LANGUAGE}>
      <body>{children}</body>
    </html>
  );
}
