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

    add(vector: Vector): Vector {
        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    subtract(vector: Vector): Vector {
        return new Vector(this.x - vector.x, this.y - vector.y);
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

    round() {
        return new Vector(Math.round(this.x), Math.round(this.y));
    }

}

export class Basis {
    v: Vector;
    w: Vector;

    constructor(v: Vector, w: Vector) {
        this.v = v;
        this.w = w;
    }

    /**
     * Return coefficients when expressing 2D vector as weighted sum of basis vectors.
     * From:
     * https://math.stackexchange.com/questions/148199/equation-for-non-orthogonal-projection-of-a-point-onto-two-vectors-representing
     * alpha = (z-component of w cross z) / (z-component of w cross v)
     * beta = (z-component of v cross z) / (z-component of v cross w)
     * @param z Arbitrary 2D vector
     */
    toCoefficients(z: Vector): Vector {
        const alpha = (this.w.x * z.y - this.w.y * z.x) / (this.w.x * this.v.y - this.w.y * this.v.x);
        const beta = (this.v.x * z.y - this.v.y * z.x) / (this.v.x * this.w.y - this.v.y * this.w.x);
        return new Vector(alpha, beta);
    }

    /**
     * Return weighted sum of basis vectors 
     * @param z weights / coefficients (often integer)
     */
    fromCoefficients(z: Vector): Vector {
        return this.v.scale(z.x).add(this.w.scale(z.y));
    }

    scale(t: number): Basis {
        return new Basis(this.v.scale(t), this.w.scale(t));
    }

}

export class Rectangle {

    topLeft: Vector;
    bottomRight: Vector;

    constructor(topLeft: Vector, bottomRight: Vector) {
        this.topLeft = topLeft;
        this.bottomRight = bottomRight;
    }

    corners(): Array<Vector> {
        return [this.topLeft, new Vector(this.topLeft.x, this.bottomRight.y), this.bottomRight, new Vector(this.bottomRight.x, this.topLeft.y)];
    }

    center(): Vector {
        return new Vector((this.topLeft.x + this.bottomRight.x) / 2, (this.topLeft.y + this.bottomRight.y) / 2);
    }

    translate(v: Vector): Rectangle {
        return new Rectangle(this.topLeft.add(v), this.bottomRight.add(v));
    }

    transform(transformation: Transformation): Rectangle {
        return new Rectangle(
            transformation.transform(this.topLeft),
            transformation.transform(this.bottomRight),
        ); 
    }

    containingSquare(): Rectangle {
        const halfSide = Math.max(this.width(), this.height()) / 2;
        const center = this.center();
        return new Rectangle(
            new Vector(center.x - halfSide, center.y - halfSide),
            new Vector(center.x + halfSide, center.y + halfSide)
        );
    }

    /**
     * Return true if another rectangle overlaps with this one.
     * @param r Another rectangle
     */
    overlaps(r: Rectangle): boolean {
        const overlapsX = (this.topLeft.x <= r.bottomRight.x) && (r.topLeft.x <= this.bottomRight.x);
        const overlapsY = (this.topLeft.y <= r.bottomRight.y) && (r.topLeft.y <= this.bottomRight.y);
        return overlapsX && overlapsY;
    }

    width(): number {
        return this.bottomRight.x - this.topLeft.x;
    }

    height(): number {
        return this.bottomRight.y - this.topLeft.y;
    }

}


export class Transformation {

    translation: Vector;
    scaling: number;

    constructor(translation: Vector, scaling: number) {
        this.translation = translation;
        this.scaling = scaling;
    }

    transform(v: Vector) {
        return v.scale(this.scaling).add(this.translation);
    }

}

export interface Unit {
    draw: (ctx: CanvasRenderingContext2D) => void;
    boundingBox: Rectangle;
}
