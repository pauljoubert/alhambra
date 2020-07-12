import { Vector, Basis, Rectangle } from "./typing";


/**
 * Return coefficients in basis for all vectors by which to shift boundingBox to cover canvas.
 */
export function generateCovering(boundingBox: Rectangle, basis: Basis, canvas: Rectangle): Array<Vector> {

    const boundingBoxSquare = boundingBox.containingSquare();
    const canvasSquare = canvas.containingSquare();

    function translatedBoundingBoxOverlapsCanvas(coefficients: Vector) {
        return boundingBoxSquare.translate(basis.fromCoefficients(coefficients)).overlaps(canvasSquare);
    }

    const origin = new Vector(0, 0);
    const leftMost = searchLeft(origin, translatedBoundingBoxOverlapsCanvas);
    const rightMost = searchRight(origin, translatedBoundingBoxOverlapsCanvas);
    const centerRange = new HorizontalRange(leftMost, rightMost);

    let coefficients: Array<Vector> = [...centerRange];
    for (const horizontalRange of createSearchVertical(centerRange, translatedBoundingBoxOverlapsCanvas, true)) {
        coefficients = coefficients.concat([...horizontalRange]);
    }
    for (const horizontalRange of createSearchVertical(centerRange, translatedBoundingBoxOverlapsCanvas, false)) {
        coefficients = coefficients.concat([...horizontalRange]);
    }

    return coefficients;

}


function searchHorizontal(initial: Vector, valid: (v: Vector) => boolean, ascending = true): Vector {
    const v = initial.copy();
    const dx = ascending ? 1 : -1;
    v.x += dx;
    while (valid(v)) {
        v.x += dx;
    }
    return new Vector(v.x - dx, v.y);
}


const searchLeft = (initial: Vector, valid: (v: Vector) => boolean) => searchHorizontal(initial, valid, false);
const searchRight = (initial: Vector, valid: (v: Vector) => boolean) => searchHorizontal(initial, valid, true);


class HorizontalRange {
    left: Vector;
    right: Vector;

    constructor(left: Vector, right: Vector) {
        if (left.y !== right.y) {
            throw new Error(`y values should be equal (${left.y} != ${right.y})`);
        }
        if (left.x > right.x) {
            throw new Error(`vectors should be ordered by x coordinate (${left.x} > ${right.x})`);
        }
        this.left = left;
        this.right = right;
    }

    *[Symbol.iterator]() {
        for (let x = this.left.x; x <= this.right.x; x++) {
            yield new Vector(x, this.left.y);
        }
    }

}


function* createSearchVertical(initial: HorizontalRange, valid: (v: Vector) => boolean, ascending = true) {

    function searchVertical(current: HorizontalRange): HorizontalRange | null {
        const y = current.left.y + (ascending ? 1 : -1);
        const left = new Vector(current.left.x, y);
        const right = new Vector(current.right.x, y);
        const leftMost = searchLeft(left, valid);
        const rightMost = searchRight(right, valid);

        while (!valid(leftMost) && leftMost.x < rightMost.x) {
            leftMost.x++;
        }
        while (!valid(rightMost) && leftMost.x < rightMost.x) {
            rightMost.x--;
        }
        if (valid(leftMost)) {
            return new HorizontalRange(leftMost, rightMost);
        } else {
            return null;
        }
    }

    let horizontalRange = searchVertical(initial);
    while (horizontalRange !== null) {
        yield horizontalRange;
        horizontalRange = searchVertical(horizontalRange);
    }

}
