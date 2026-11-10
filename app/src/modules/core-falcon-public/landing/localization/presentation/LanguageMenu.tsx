"use client";

import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { useState } from "react";
import { useLandingLocale } from "../context/LandingLocaleProvider";
import { isLandingLocale } from "../model/locale";
import { LanguageTrigger } from "./LanguageTrigger";
import styles from "./language.module.css";

export function LanguageMenu() {
  const { locale, copy, setLocale } = useLandingLocale();
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);

  return <div ref={setPortalContainer} className={styles.anchor}>
    <Dropdown placement="bottom-end" offset={6} isNonModal shouldBlockScroll={false}
      portalContainer={portalContainer ?? undefined} shouldCloseOnScroll={false}
      disableAnimation classNames={{ content: styles.menuSurface }}>
      <DropdownTrigger><LanguageTrigger /></DropdownTrigger>
      <DropdownMenu aria-label={copy.language} selectionMode="single" disallowEmptySelection
        selectedKeys={[locale]} onAction={(key) => { if (isLandingLocale(key)) setLocale(key); }}
        classNames={{ base: styles.menu, list: styles.options }}
        itemClasses={{ base: styles.option, title: styles.label, selectedIcon: styles.check }}>
        <DropdownItem key="en" textValue="English"><span lang="en">English</span></DropdownItem>
        <DropdownItem key="ru" textValue="Русский"><span lang="ru">Русский</span></DropdownItem>
      </DropdownMenu>
    </Dropdown>
  </div>;
}
