import { Checkbox, type CheckboxProps } from "@heroui/react";
import styles from "./falcon-checkbox.module.css";

type Props = Omit<CheckboxProps, "classNames" | "size" | "radius">;

export function FalconCheckbox(props: Props) {
  return <Checkbox {...props} size="sm" radius="sm" classNames={{
    base: styles.base, hiddenInput: styles.input, wrapper: styles.box, icon: styles.icon, label: styles.label,
  }} />;
}
