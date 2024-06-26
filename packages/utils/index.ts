export { delta, assign } from "./delta";

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export interface IVec {
  x: number;
  y: number;
}

export class Vec {
  readonly x;
  readonly y;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  distanceTo(vec: IVec) {
    return Math.hypot(vec.x - this.x, vec.y - this.y);
  }
  static get zero() {
    return new Vec(0, 0);
  }
}

export class Segment {
  readonly a;
  readonly b;
  constructor(a: Vec, b: Vec) {
    this.a = a;
    this.b = b;
  }
  distanceToPoint(point: IVec) {
    const distance = this.a.distanceTo(this.b);
    if (distance === 0) return this.a.distanceTo(point);

    const project = ((point.x - this.a.x) * (this.b.x - this.a.x) + (point.y - this.a.y) * (this.b.y - this.a.y)) / distance;
    if (project < 0) return this.a.distanceTo(point);
    else if (project > distance) return this.b.distanceTo(point);
    return Math.abs(-1 * (point.x - this.a.x) * (this.b.y - this.a.y) + (point.y - this.a.y) * (this.b.x - this.a.x)) / distance;
  }
}