import { Vector, Basis, Rectangle, Transformation, Unit } from "./typing";


/**
 * Modify translation to get source + translation closer to target
 * @param translation component of transformation
 * @param basis defines 2D grid of pattern
 * @param source center of scaled bounding box
 * @param target center of canvas
 */
function getEquivalentTranslation(translation: Vector, basis: Basis, source: Vector, target: Vector): Vector {
    let direction = target.subtract(translation.add(source));
    let roundedDirection = basis.fromCoefficients(basis.toCoefficients(direction).round());
    return translation.add(roundedDirection);
}


class HorizontalRange {
    left: Vector;
    right: Vector;

    constructor(left: Vector, right: Vector) {
        // assert left.y === right.y, left.x <= right.x
        this.left = left;
        this.right = right;
    }

    toArray() {
        // TODO: should be a generator
        let vectors: Array<Vector> = [];
        for (let x = this.left.x; x <= this.right.x; x++) {
            vectors.push(new Vector(x, this.left.y));
        }
        return vectors;
    }

    length() {
        return this.right.x - this.left.x + 1;
    }

}


function searchHorizontal(initial: Vector, valid: (v: Vector) => boolean, ascending = true): Vector {
    let v = initial.copy();
    v.x += ascending ? 1 : -1;
    while (valid(v)) {
        v.x += ascending ? 1 : -1;
    }
    return new Vector(v.x + (ascending ? -1 : 1), v.y);
}


const searchLeft = (initial: Vector, valid: (v: Vector) => boolean) => searchHorizontal(initial, valid, false);
const searchRight = (initial: Vector, valid: (v: Vector) => boolean) => searchHorizontal(initial, valid, true);


function* createSearchVertical(initial: HorizontalRange, valid: (v: Vector) => boolean, ascending = true) {

    function searchVertical(current: HorizontalRange): HorizontalRange | null {
        const y = current.left.y + (ascending ? 1 : -1);
        const left = new Vector(current.left.x, y);
        const right = new Vector(current.right.x, y);
        let leftMost = searchLeft(left, valid);
        let rightMost = searchRight(right, valid);

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


function generateCovering(boundingBox: Rectangle, basis: Basis, canvas: Rectangle): Array<Vector> {
    // Return list of pairs of integers, linear combinations of vectors by which
    // boundingBox can be shifted while still overlapping with canvas 

    function translatedBoundingBoxOverlapsCanvas(coefficients: Vector) {
        return boundingBox.translate(basis.fromCoefficients(coefficients)).overlaps(canvas);
    }

    const origin = new Vector(0, 0);
    const leftMost = searchLeft(origin, translatedBoundingBoxOverlapsCanvas);
    const rightMost = searchRight(origin, translatedBoundingBoxOverlapsCanvas);
    const originHorizontalRange = new HorizontalRange(leftMost, rightMost);

    let coefficients: Array<Vector> = originHorizontalRange.toArray();
    for (const horizontalRange of createSearchVertical(originHorizontalRange, translatedBoundingBoxOverlapsCanvas, true)) {
        coefficients = coefficients.concat(horizontalRange.toArray());
    }
    for (const horizontalRange of createSearchVertical(originHorizontalRange, translatedBoundingBoxOverlapsCanvas, false)) {
        coefficients = coefficients.concat(horizontalRange.toArray());
    }

    return coefficients;

}


function transformDraw(draw: (ctx: CanvasRenderingContext2D) => void, transformation: Transformation) {
    return function (ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(transformation.translation.x, transformation.translation.y);
        ctx.scale(transformation.scaling, transformation.scaling);
        draw(ctx);
        ctx.restore();
    }
}


/**
 * Unit repeated across a 2D grid.
 */
class Tiling {
    unit: Unit;
    transformation: Transformation;
    basis: Basis;
    canvas: Rectangle;

    constructor(unit: Unit, transformation: Transformation, basis: Basis, canvas: Rectangle) {
        this.unit = unit;
        this.transformation = transformation;
        this.basis = basis;
        this.canvas = canvas;
    }

    draw(ctx: CanvasRenderingContext2D) {

        // Shift transformation by vector in span of basis to move bounding box close to canvas center.
        this.transformation.translation = getEquivalentTranslation(
            this.transformation.translation,
            this.basis.scale(this.transformation.scaling),
            this.unit.boundingBox.center().scale(this.transformation.scaling),
            this.canvas.center()
        );

        // Change bounding box, unit and basis by transformation.
        const boundingBox = this.unit.boundingBox.transform(this.transformation);
        let transformedDraw = transformDraw(this.unit.draw, this.transformation);
        let basis = this.basis.scale(this.transformation.scaling);

        // Draw bounding box. Very useful for debugging.
        let debug = false;
        if (debug) {
            ctx.lineWidth = 5;
            ctx.strokeStyle = "blue";
            ctx.rect(boundingBox.topLeft.x, boundingBox.topLeft.y, (boundingBox.bottomRight.x - boundingBox.topLeft.x), (boundingBox.bottomRight.y - boundingBox.topLeft.y));
            ctx.stroke();
        }

        const shifts = generateCovering(boundingBox, basis, this.canvas);
        for (const shift of shifts) {
            const t = basis.fromCoefficients(shift);
            ctx.save();
            ctx.translate(t.x, t.y);
            transformedDraw(ctx);
            ctx.restore();
        }
    }

}


const littleBirdStar: Unit = {
    draw: function (ctx: CanvasRenderingContext2D) {
        let r = Math.sqrt(3) - 1;

        ctx.moveTo(r, 0);
        ctx.save();
        for (let i = 0; i < 6; i++) {
            ctx.lineTo(r, 0);
            ctx.lineTo(0.5 * r, 0.25 * r);
            ctx.rotate(Math.PI / 3);
        }
        ctx.lineTo(r, 0);
        ctx.restore();
    },
    boundingBox: new Rectangle(new Vector(-1, -1), new Vector(1, 1))
}


const littleBirdWing: Unit = {
    draw: function (ctx: CanvasRenderingContext2D) {
        let sqrt3 = Math.sqrt(3);
        let r = sqrt3 - 1;

        ctx.save();
        ctx.translate(0, 2);
        for (let i = 0; i < 3; i++) {
            ctx.moveTo(0.5 * r, r * sqrt3 / 2);
            ctx.arc(0.5 * sqrt3, 1.5, 1, 4 * Math.PI / 3, 3 * Math.PI / 2);
            ctx.arc(Math.sqrt(3) / 2, -0.5, 1, Math.PI / 2, (11 / 6) * Math.PI, true);
            ctx.arc(Math.sqrt(3) / 2, -1.5, 1, Math.PI / 6, (2 / 3) * Math.PI);
            ctx.lineTo(r, 0);
            ctx.lineTo(0.5 * r, r * sqrt3 / 2);
            ctx.rotate((2 / 3) * Math.PI);
        }

        ctx.restore();
    },
    boundingBox: (function () {
        let r = 3 * Math.sqrt(3) / 2;
        return new Rectangle(new Vector(-r, -r + 2), new Vector(r, r + 2));
    })()
}


class Pattern {
    canvas: Rectangle;
    transformation: Transformation;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.canvas = new Rectangle(new Vector(0, 0), new Vector(canvasWidth, canvasHeight));
        this.transformation = new Transformation(new Vector(600, 400), 40);
    }

    colours: { [key: string]: string } = {
        "black": "black",
        "orange": "rgb(176, 93, 37)",
        "green": "rgb(35, 98, 45)",
        "blue": "rgb(81, 122, 184)",
    }

    draw(ctx: CanvasRenderingContext2D) {

        ctx.fillStyle = "white";
        ctx.fillRect(this.canvas.topLeft.x, this.canvas.topLeft.y, this.canvas.width(), this.canvas.height());



        let colour_order = ["black", "orange", "green", "blue"];

        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            let t = new Transformation(
                new Vector(
                    this.transformation.translation.x + i * Math.sqrt(3) * this.transformation.scaling,
                    this.transformation.translation.y + 3 * i * this.transformation.scaling
                ),
                this.transformation.scaling,
            )
            let starTiling = new Tiling(littleBirdStar, t, new Basis(new Vector(0, 12), new Vector(2 * Math.sqrt(3), 0)), this.canvas);
            starTiling.draw(ctx);
            ctx.fillStyle = this.colours[colour_order[i]];
            ctx.fill();
        }

        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            let t = new Transformation(
                new Vector(
                    this.transformation.translation.x + i * 2 * Math.sqrt(3) * this.transformation.scaling,
                    this.transformation.translation.y
                ),
                this.transformation.scaling,
            )
            let wingTiling = new Tiling(littleBirdWing, t, new Basis(new Vector(-Math.sqrt(3), 3), new Vector(8 * Math.sqrt(3), 0)), this.canvas);
            wingTiling.draw(ctx);
            ctx.fillStyle = this.colours[colour_order[i]];
            ctx.fill();
        }

    }

}


const canvas = document.querySelector('canvas');
if (canvas != null) {
    const ctx = canvas.getContext('2d');
    if (ctx != null) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let pattern = new Pattern(canvas.width, canvas.height);

        pattern.draw(ctx);


        document.addEventListener('keydown', (event) => {

            let shiftSpeed = 5

            switch (event.code) {
                case 'Minus':
                    pattern.transformation.scaling *= 0.99;
                    break;
                case 'Equal':
                    pattern.transformation.scaling *= 1.01;
                    break;
                case 'ArrowRight':
                    pattern.transformation.translation.x += shiftSpeed;
                    break;
                case 'ArrowLeft':
                    pattern.transformation.translation.x -= shiftSpeed;
                    break;
                case 'ArrowUp':
                    pattern.transformation.translation.y -= shiftSpeed;
                    break;
                case 'ArrowDown':
                    pattern.transformation.translation.y += shiftSpeed;
                    break;
            }

            pattern.draw(ctx);

        }, false);

        let mouseX = 0;
        let mouseY = 0;
        let mouseDown = false;


        document.addEventListener('mousedown', e => {
            mouseX = e.offsetX;
            mouseY = e.offsetY;
            mouseDown = true;
        });


        document.addEventListener('mousemove', e => {
            if (mouseDown === true) {
                pattern.transformation.translation.x += e.offsetX - mouseX;
                pattern.transformation.translation.y += e.offsetY - mouseY;
                pattern.draw(ctx);
                mouseX = e.offsetX;
                mouseY = e.offsetY;
            }
        });

        document.addEventListener('mouseup', e => {
            if (mouseDown === true) {
                pattern.transformation.translation.x += e.offsetX - mouseX;
                pattern.transformation.translation.y += e.offsetY - mouseY;
                pattern.draw(ctx);
                mouseDown = false;
            }
        });

        document.addEventListener('wheel', e => {
            if (e.deltaY === 0) {
                return;
            }
            let r = e.deltaY > 0 ? 0.98 : 1.02;
            let t = pattern.transformation;
            let correctionX = (e.offsetX - t.translation.x) * (r - 1);
            let correctionY = (e.offsetY - t.translation.y) * (r - 1);
            t.scaling *= r;
            t.translation.x -= correctionX;
            t.translation.y -= correctionY;
            pattern.draw(ctx);
        });

    }
}
