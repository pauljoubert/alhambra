

class Vector {

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
}

type BoundingBox = Array<Vector>;

interface Transformation { shift: Vector; scale: number; };

interface Unit {
    draw: (ctx: CanvasRenderingContext2D) => void;
    boundingBox: BoundingBox;
}


function calculateShifts(boundingBox: BoundingBox, vectorA: Vector, vectorB: Vector, width: number, height: number) {
    // Return list of pairs of integers, linear combinations of vectors by which
    // boundingBox can be shifted while still overlapping with canvas 
    // (corners at (0, 0) and (width, height)).
    // Assume initial boundingBox overlaps canvas.
    // Also assume that overlaps => at least one corner of boundingBox is inside the canvas.

    function overlaps(shift) {
        // console.log(boundingBox);
        for (const point of boundingBox) {
            let q = [
                point.x + shift[0] * vectorA.x + shift[1] * vectorB.x,
                point.y + shift[0] * vectorA.y + shift[1] * vectorB.y,
            ];
            if ((q[0] >= 0) && (q[0] <= width) && (q[1] >= 0) && (q[1] <= height)) {
                return true;
            }
        }
        return false;
    }

    function search(current, left = true) {
        let cx = current[0];
        while (overlaps([cx, current[1]])) {
            cx += left ? -1 : 1;
        }
        return cx + (left ? 1 : -1);
    }

    let leftMostX = search([0, 0], true);
    let rightMostX = search([0, 0], false);

    let shifts = [];
    for (let x = leftMostX; x <= rightMostX; x++) {
        shifts.push([x, 0]);
    }
    let originalBounds = [leftMostX, rightMostX];

    function fillVertical(shifts, originalBounds, up = true) {
        let valid = true;
        let currentY = 0;
        leftMostX = originalBounds[0];
        rightMostX = originalBounds[1];
        while (valid) {
            currentY += (up ? 1 : -1);
            valid = false;
            leftMostX = search([leftMostX, currentY], true);
            rightMostX = search([rightMostX, currentY], false);
            let newRightMostX;
            for (let x = leftMostX; x <= rightMostX; x++) {
                let point = [x, currentY];
                if (overlaps(point)) {
                    shifts.push(point);
                    if (!valid) {
                        leftMostX = x;
                        valid = true;
                    }
                    newRightMostX = x;
                }
            }
            rightMostX = newRightMostX;
        }
    }

    fillVertical(shifts, originalBounds, true);
    fillVertical(shifts, originalBounds, false);

    return shifts;

}


function transformDraw(draw: (ctx: CanvasRenderingContext2D) => void, transformation: Transformation) {
    return function (ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(transformation.shift.x, transformation.shift.y);
        ctx.scale(transformation.scale, transformation.scale);
        draw(ctx);
        ctx.restore();
    }
}


function transformBoundingBox(boundingBox: BoundingBox, transformation: Transformation): BoundingBox {
    return boundingBox.map((vector: Vector) => vector.scale(transformation.scale).shift(transformation.shift));
}


class Tiling {
    // Unit repeated across a 2D grid.
    unit: Unit;
    transformation: Transformation;
    vectorA: Vector;
    vectorB: Vector;
    canvasWidth: number;
    canvasHeight: number;

    constructor(unit: Unit, transformation: Transformation, vectorA: Vector, vectorB: Vector, canvasWidth: number, canvasHeight: number) {
        this.unit = unit;
        this.transformation = transformation;
        this.vectorA = vectorA;
        this.vectorB = vectorB;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const boundingBox = transformBoundingBox(this.unit.boundingBox, this.transformation);
        let transformedDraw = transformDraw(this.unit.draw, this.transformation);
        let vectorA = this.vectorA.scale(this.transformation.scale);
        let vectorB = this.vectorB.scale(this.transformation.scale);
        const shifts = calculateShifts(
            boundingBox, vectorA, vectorB, this.canvasWidth, this.canvasHeight
        );
        for (const shift of shifts) {
            ctx.save();
            ctx.translate(
                vectorA.x * shift[0] + vectorB.x * shift[1],
                vectorA.y * shift[0] + vectorB.y * shift[1],
            );
            transformedDraw(ctx);
            ctx.restore();
        }
    }

}


function toCorners(topLeft: Vector, bottomRight: Vector): BoundingBox {
    return [topLeft, new Vector(topLeft.x, bottomRight.y), bottomRight, new Vector(bottomRight.x, topLeft.y)];
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
    boundingBox: toCorners(new Vector(-1, -1), new Vector(1, 1))
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
        return toCorners(new Vector(-r, -r), new Vector(r, r));
    })()
}


class Pattern {
    canvasWidth: number;
    canvasHeight: number;
    transformation: Transformation;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.transformation = {
            shift: new Vector(400, 400),
            scale: 40,
        }

    }

    colours = {
        "black": "black",
        "orange": "rgb(176, 93, 37)",
        "green": "rgb(35, 98, 45)",
        "blue": "rgb(81, 122, 184)",
    }

    draw(ctx: CanvasRenderingContext2D) {

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        let colour_order = ["black", "orange", "green", "blue"];

        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            let t: Transformation = {
                shift: new Vector(this.transformation.shift.x + i * Math.sqrt(3) * this.transformation.scale,
                    this.transformation.shift.y + 3 * i * this.transformation.scale),
                scale: this.transformation.scale,
            }
            let starTiling = new Tiling(littleBirdStar, t, new Vector(0, 12), new Vector(2 * Math.sqrt(3), 0), this.canvasWidth, this.canvasHeight);
            starTiling.draw(ctx);
            ctx.fillStyle = this.colours[colour_order[i]];
            ctx.fill();
        }

        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            let t: Transformation = {
                shift: new Vector(this.transformation.shift.x + i * 2 * Math.sqrt(3) * this.transformation.scale,
                    this.transformation.shift.y),
                scale: this.transformation.scale,
            };
            let wingTiling = new Tiling(littleBirdWing, t, new Vector(-Math.sqrt(3), 3), new Vector(8 * Math.sqrt(3), 0), this.canvasWidth, this.canvasHeight);
            wingTiling.draw(ctx);
            ctx.fillStyle = this.colours[colour_order[i]];
            ctx.fill();
        }

    }

}


const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let pattern = new Pattern(canvas.width, canvas.height);

pattern.draw(ctx);



document.addEventListener('keydown', (event) => {

    let shiftSpeed = 5

    switch (event.code) {
        case 'Minus':
            pattern.transformation.scale *= 0.99;
            break;
        case 'Equal':
            pattern.transformation.scale *= 1.01;
            break;
        case 'ArrowRight':
            pattern.transformation.shift.x += shiftSpeed;
            break;
        case 'ArrowLeft':
            pattern.transformation.shift.x -= shiftSpeed;
            break;
        case 'ArrowUp':
            pattern.transformation.shift.y -= shiftSpeed;
            break;
        case 'ArrowDown':
            pattern.transformation.shift.y += shiftSpeed;
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
        pattern.transformation.shift.x += e.offsetX - mouseX;
        pattern.transformation.shift.y += e.offsetY - mouseY;
        pattern.draw(ctx);
        mouseX = e.offsetX;
        mouseY = e.offsetY;
    }
});

document.addEventListener('mouseup', e => {
    if (mouseDown === true) {
        pattern.transformation.shift.x += e.offsetX - mouseX;
        pattern.transformation.shift.y += e.offsetY - mouseY;
        pattern.draw(ctx);
        mouseDown = false;
    }
});

document.addEventListener('wheel', e => {
    if (e.deltaY === 0) {
        return;
    }
    let r = e.deltaY > 0 ? 0.99 : 1.01;
    pattern.transformation.scale *= r;
    pattern.draw(ctx);
});

