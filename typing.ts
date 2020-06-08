export class Vector {

    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    scale(alpha: number): Vector {
        return new Vector(this.x * alpha, this.y * alpha);
    }

    shift(vector: Vector): Vector {
        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    copy(): Vector {
        return new Vector(this.x, this.y);
    }

    dot(v: Vector) {
        return this.x * v.x + this.y * v.y;
    }

    norm() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

}

export type BoundingBox = Array<Vector>;


export interface Transformation { shift: Vector; scale: number; };

export interface Unit {
    draw: (ctx: CanvasRenderingContext2D) => void;
    boundingBox: BoundingBox;
}
