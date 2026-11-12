import React from 'react';
import { chartGeometry } from './chart-geometry.js';
const wave=chartGeometry([[1,11],[6,7],[11,9],[17,3],[23,5],[29,1]],13).line;
export function TrendWave(){return <svg className="trend-wave" width="25" height="13" viewBox="0 0 30 14" aria-hidden="true"><path d={wave} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
