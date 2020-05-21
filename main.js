

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


function transformDraw(draw, transformation) {
    return function (ctx) {
        ctx.save();
        ctx.translate(transformation.shiftX, transformation.shiftY);
        ctx.scale(transformation.scale, transformation.scale);
        draw(ctx);
        ctx.restore();
    }
}


function transformBoundingBox(boundingBox, transformation) {
    let newBoundingBox = [];
    for (const point of boundingBox) {
        let p = Array.from(point);
        p[0] *= transformation.scale;
        p[1] *= transformation.scale;
        p[0] += transformation.shiftX;
        p[1] += transformation.shiftY;
        newBoundingBox.push(p);
    }
    return newBoundingBox;
}


function scaleVector(vector, scale) {
    return [vector[0] * scale, vector[1] * scale];
}


class Tiling {
    // Unit repeated across a 2D grid.

    constructor(unit, transformation, vectorA, vectorB, canvasWidth, canvasHeight) {
        this.unit = unit;
        this.transformation = transformation;
        this.vectorA = vectorA;
        this.vectorB = vectorB;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    draw(ctx) {
        const boundingBox = transformBoundingBox(this.unit.boundingBox, this.transformation);
        let transformedDraw = transformDraw(this.unit.draw, this.transformation);
        let vectorA = scaleVector(this.vectorA, this.transformation.scale);
        let vectorB = scaleVector(this.vectorB, this.transformation.scale);
        const shifts = calculateShifts(
            boundingBox, vectorA, vectorB, this.canvasWidth, this.canvasHeight
        );
        for (const shift of shifts) {
            ctx.save();
            ctx.translate(
                vectorA[0] * shift[0] + vectorB[0] * shift[1],
                vectorA[1] * shift[0] + vectorB[1] * shift[1],
            );
            transformedDraw(ctx);
            ctx.restore();
        }
    }

}


function toCorners(topLeft, bottomRight) {
    return [topLeft, [topLeft[0], bottomRight[1]], bottomRight, [bottomRight[0], topLeft[1]]];
}


const littleBirdStar = {
    draw: function (ctx) {
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
    boundingBox: toCorners([-1, -1], [1, 1]),
}


const littleBirdWing = {
    draw: function (ctx) {
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
        return toCorners([-r, -r], [r, r]);
    })()
}


class Pattern {

    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.transformation = {
            shiftX: 400,
            shiftY: 400,
            scale: 40,
        }

    }

    colours = {
        "black": "black",
        "orange": "rgb(176, 93, 37)",
        "green": "rgb(35, 98, 45)",
        "blue": "rgb(81, 122, 184)",
    }

    draw(ctx) {

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        let colour_order = ["black", "orange", "green", "blue"];

        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            let t = {
                shiftX: this.transformation.shiftX + i * Math.sqrt(3) * this.transformation.scale,
                shiftY: this.transformation.shiftY + 3 * i * this.transformation.scale,
                scale: this.transformation.scale,
            }
            let starTiling = new Tiling(littleBirdStar, t, [0, 12], [2 * Math.sqrt(3), 0], this.canvasWidth, this.canvasHeight);
            starTiling.draw(ctx);
            ctx.fillStyle = this.colours[colour_order[i]];
            ctx.fill();
        }

        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            let t = Object.assign(
                {},
                this.transformation,
                { shiftX: this.transformation.shiftX + i * 2 * Math.sqrt(3) * this.transformation.scale }
            );
            let wingTiling = new Tiling(littleBirdWing, t, [-Math.sqrt(3), 3], [8 * Math.sqrt(3), 0], this.canvasWidth, this.canvasHeight);
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

pattern = new Pattern(canvas.width, canvas.height);

pattern.draw(ctx);



document.addEventListener('keydown', (event) => {

    shiftSpeed = 5

    switch (event.code) {
        case 'Minus':
            pattern.transformation.scale *= 0.99;
            break;
        case 'Equal':
            pattern.transformation.scale *= 1.01;
            break;
        case 'ArrowRight':
            pattern.transformation.shiftX += shiftSpeed;
            break;
        case 'ArrowLeft':
            pattern.transformation.shiftX -= shiftSpeed;
            break;
        case 'ArrowUp':
            pattern.transformation.shiftY -= shiftSpeed;
            break;
        case 'ArrowDown':
            pattern.transformation.shiftY += shiftSpeed;
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
        pattern.transformation.shiftX += e.offsetX - mouseX;
        pattern.transformation.shiftY += e.offsetY - mouseY;
        pattern.draw(ctx);
        mouseX = e.offsetX;
        mouseY = e.offsetY;
    }
});

document.addEventListener('mouseup', e => {
    if (mouseDown === true) {
        pattern.transformation.shiftX += e.offsetX - mouseX;
        pattern.transformation.shiftY += e.offsetY - mouseY;
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

