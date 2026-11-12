import { line, area, curveMonotoneX } from 'd3-shape';

// Same observed points; monotone cubic interpolation avoids overshooting data.
export function chartGeometry(points, baseline) {
  return {
    line: line().x(d => d[0]).y(d => d[1]).curve(curveMonotoneX)(points),
    area: area().x(d => d[0]).y0(baseline).y1(d => d[1]).curve(curveMonotoneX)(points),
  };
}
