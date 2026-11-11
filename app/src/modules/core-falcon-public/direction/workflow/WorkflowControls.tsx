'use client';

import { Button, Tooltip } from '@heroui/react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import styles from './workflow-story.module.css';

export function WorkflowControls({ reducedMotion, complete, paused, pauseLabel, resumeLabel, replayLabel, onTogglePause, onReplay }: { reducedMotion: boolean; complete: boolean; paused: boolean; pauseLabel: string; resumeLabel: string; replayLabel: string; onTogglePause: () => void; onReplay: () => void }) {
  return <div className={styles.controls}>
    {!reducedMotion && !complete && <Tooltip content={paused ? resumeLabel : pauseLabel} placement="top" delay={300}>
      <Button className={styles.control} isIconOnly size="sm" variant="light" radius="full" disableRipple onPress={onTogglePause} aria-label={paused ? resumeLabel : pauseLabel} aria-pressed={paused}>{paused ? <Play size={14} /> : <Pause size={14} />}</Button>
    </Tooltip>}
    {!reducedMotion && <Tooltip content={replayLabel} placement="top" delay={300}>
      <Button className={styles.control} isIconOnly size="sm" variant="light" radius="full" disableRipple onPress={onReplay} aria-label={replayLabel}><RotateCcw size={14} /></Button>
    </Tooltip>}
  </div>;
}
