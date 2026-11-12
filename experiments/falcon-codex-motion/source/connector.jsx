import React from 'react';
import {strokeReveal} from './motion.mjs';

// One complete route, progressively uncovered from its source to its destination.
// The normalized dash is the entire path, so a completed line never cycles away.
export function Connector({id, d, time, delay = 0, duration = .9, color = 'var(--film-accent-blue)', width = 2.2}) {
  const progress = strokeReveal(time, delay, duration);
  return <g data-connector={id} data-progress={progress.toFixed(5)} opacity={strokeReveal(time, delay, .18)} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path className="connector-track" d={d} stroke={color} strokeOpacity=".18" strokeWidth={width} />
    <path className="connector-fill" d={d} pathLength="1" stroke={color} strokeWidth={width}
      strokeDasharray="1 1" strokeDashoffset={1 - progress} opacity={progress > 0 ? 1 : 0} />
  </g>;
}
