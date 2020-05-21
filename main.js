

class Unit {

    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
    }

    drawTransformed(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.size, this.size);
        this.draw(ctx);
        ctx.restore();
    }

    draw(ctx) {
        throw new Error("Not implemented");
    }

    boundingBoxTransformed() {
        let newBoundingBox = [];
        for (const point of this.boundingBox()) {
            let p = Array.from(point);
            p[0] *= this.size;
            p[1] *= this.size;
            p[0] += this.x;
            p[1] += this.y;
            newBoundingBox.push(p);
        }
        return newBoundingBox;
    }

    boundingBox() {
        // Should include the border.
        throw new Error("Not implemented");
    }

}


function calculateShifts(boundingBox, vectorA, vectorB, width, height) {
    // Return list of pairs of integers, linear combinations of vectors by which
    // boundingBox can be shifted while still overlapping with canvas 
    // (corners at (0, 0) and (width, height)).
    // Assume initial boundingBox overlaps canvas.
    // Also assume that overlaps => at least one corner of boundingBox is inside the canvas.

    function overlaps(shift) {
        // console.log(boundingBox);
        for (const point of boundingBox) {
            let q = [
                point[0] + shift[0] * vectorA[0] + shift[1] * vectorB[0],
                point[1] + shift[0] * vectorA[1] + shift[1] * vectorB[1],
            ];
            if ((q[0] >= 0) && (q[0] <= width) && (q[1] >= 0) && (q[1] <= height)) {
                return true;
            }
        }
        return false;
    }

    function search(current, left=true) {
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

    function fillVertical(shifts, originalBounds, up=true) {
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


class Tiling {
    // Unit repeated across a 2D grid.

    constructor(unit, vectorA, vectorB) {
        this.unit = unit;
        this.vectorA = vectorA;
        this.vectorB = vectorB;
    }

    draw(ctx, canvasWidth, canvasHeight) {
        let shifts = calculateShifts(
            this.unit.boundingBoxTransformed(), this.vectorA, this.vectorB, canvasWidth, canvasHeight
        );
        for (const shift of shifts) {
            ctx.save();
            ctx.translate(
                this.vectorA[0] * shift[0] + this.vectorB[0] * shift[1],
                this.vectorA[1] * shift[0] + this.vectorB[1] * shift[1],
            );
            this.unit.drawTransformed(ctx);
            ctx.restore();
        }
    }

}

function toCorners(topLeft, bottomRight) {
    return [topLeft, [topLeft[0], bottomRight[1]], bottomRight, [bottomRight[0], topLeft[1]]];
}


class Square extends Unit {

    constructor(x, y, size) {
        super(x, y, size);
    }

    draw(ctx) {
        ctx.rect(0, 0, 1, 1);
    }

    boundingBox() {
        return toCorners([0, 0], [1, 1]);
    }

}


class Circle extends Unit {

    constructor(x, y, radius) {
        super(x, y, radius);
    }

    draw(ctx) {
        ctx.moveTo(1, 0);
        ctx.arc(0, 0, 1, 0, 2 * Math.PI);
    }

    boundingBox() {
        return toCorners([-1, -1], [1, 1]);
    }

}


class LittleBirdStar extends Unit {
    // See page 84.

    constructor(x, y, radius) {
        super(x, y, radius);
    }

    draw(ctx) {
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
    }

    boundingBox() {
        return toCorners([-1, -1], [1, 1]);
    }

}


class LittleBirdWing extends Unit {

    constructor(x, y, radius) {
        super(x, y, radius);
    }

    draw(ctx) {
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
    }

    boundingBox() {
        let r = 3 * Math.sqrt(3) / 2;
        return toCorners([-r, -r], [r, r]);
    }

}


// setup canvas

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;


ctx.fillStyle = "white";
ctx.fillRect(0, 0, width, height);

colours = {
    "black": "black",
    "orange": "rgb(176, 93, 37)",
    "green": "rgb(35, 98, 45)",
    "blue": "rgb(81, 122, 184)",
}

// square = new Square(300, 400, 50);
// tiling = new Tiling(square, [150, 0], [0, 110]);
x = 400;
y = 400;
radius = 40;

// tiling = new Tiling(new Circle(x, y, radius), [0, radius], [(Math.sqrt(3) / 2) * radius, radius / 2]);
// tiling.draw(ctx, width, height);

ctx.strokeStyle = "black";
ctx.lineWidth = 2;

starTiling = new Tiling(new LittleBirdStar(x, y, radius), [0, 6 * radius], [Math.sqrt(3) * radius, 3 * radius]);
// starTiling.draw(ctx, width, height);

wingTiling = new Tiling(new LittleBirdWing(x, y, radius), [0, 6 * radius], [Math.sqrt(3) * radius, 3 * radius]);
// wingTiling.draw(ctx, width, height);

ctx.stroke();

let colour_order = ["black", "orange", "green", "blue"];
for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    let littleBirdStar = new LittleBirdStar(x + i * Math.sqrt(3) * radius, y + 3 * i * radius, radius);
    starTiling = new Tiling(littleBirdStar, [0, 12 * radius], [2 * Math.sqrt(3) * radius, 0]);
    starTiling.draw(ctx, width, height);
    ctx.fillStyle = colours[colour_order[i]];
    ctx.fill();
}

for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    let littleBirdWing = new LittleBirdWing(x + i * 2 * Math.sqrt(3) * radius, y, radius);
    wingTiling = new Tiling(littleBirdWing, [- Math.sqrt(3) * radius, 3 * radius], [8 * Math.sqrt(3) * radius, 0]);
    wingTiling.draw(ctx, width, height);
    ctx.fillStyle = colours[colour_order[i]];
    ctx.fill();
}


