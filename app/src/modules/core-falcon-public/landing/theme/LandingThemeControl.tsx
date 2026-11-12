'use client';

import { Button } from '@heroui/react';
import { Moon, Sun } from 'lucide-react';
import type { LandingLocale } from '../localization/model/locale';
import { useLandingTheme } from './LandingTheme';
import styles from './theme.module.css';

export function LandingThemeControl({ locale }: { locale: LandingLocale }) {
  const { theme, ready, toggle } = useLandingTheme();
  const label = locale === 'ru'
    ? theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'
    : theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  return <Button isIconOnly variant="light" radius="full" disableRipple
    className={styles.toggle} aria-label={label} title={label} onPress={toggle} isDisabled={!ready}>
    {theme === 'dark' ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
  </Button>;
}
