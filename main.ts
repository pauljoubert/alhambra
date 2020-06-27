import { Vector, Basis, Rectangle, Transformation, Unit } from "./typing";
import { generateCovering } from "./covering";

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
function createTiling(unit: Unit, basis: Basis, canvas: Rectangle) {

    function draw(ctx: CanvasRenderingContext2D, transformation: Transformation) {

        // Shift transformation by vector in span of basis to move bounding box close to canvas center.
        const t = new Transformation(getEquivalentTranslation(
            transformation.translation,
            basis.scale(transformation.scaling),
            unit.boundingBox.center().scale(transformation.scaling),
            canvas.center()
        ), transformation.scaling);

        // Change bounding box, unit and basis by transformation.
        const boundingBox = unit.boundingBox.transform(t);
        let transformedDraw = transformDraw(unit.draw, t);
        let transformedBasis = basis.scale(t.scaling);

        // Draw bounding box. Very useful for debugging.
        let debug = false;
        if (debug) {
            ctx.lineWidth = 5;
            ctx.strokeStyle = "blue";
            ctx.rect(boundingBox.topLeft.x, boundingBox.topLeft.y, (boundingBox.bottomRight.x - boundingBox.topLeft.x), (boundingBox.bottomRight.y - boundingBox.topLeft.y));
            ctx.stroke();
        }

        const shifts = generateCovering(boundingBox, transformedBasis, canvas);
        for (const shift of shifts) {
            const t = transformedBasis.fromCoefficients(shift);
            ctx.save();
            ctx.translate(t.x, t.y);
            transformedDraw(ctx);
            ctx.restore();
        }
    }

    return draw;

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

    constructor(canvasWidth: number, canvasHeight: number) {
        this.canvas = new Rectangle(new Vector(0, 0), new Vector(canvasWidth, canvasHeight));
    }

    colours: { [key: string]: string } = {
        "black": "black",
        "orange": "rgb(176, 93, 37)",
        "green": "rgb(35, 98, 45)",
        "blue": "rgb(81, 122, 184)",
    }

    draw(ctx: CanvasRenderingContext2D, transformation: Transformation) {

        ctx.fillStyle = "white";
        ctx.fillRect(this.canvas.topLeft.x, this.canvas.topLeft.y, this.canvas.width(), this.canvas.height());

        let colour_order = ["black", "orange", "green", "blue"];

        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            let t = new Transformation(
                new Vector(
                    transformation.translation.x + i * Math.sqrt(3) * transformation.scaling,
                    transformation.translation.y + 3 * i * transformation.scaling
                ),
                transformation.scaling,
            )
            let starTiling = createTiling(littleBirdStar, new Basis(new Vector(0, 12), new Vector(2 * Math.sqrt(3), 0)), this.canvas);
            starTiling(ctx, t);
            ctx.fillStyle = this.colours[colour_order[i]];
            ctx.fill();
        }

        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            let t = new Transformation(
                new Vector(
                    transformation.translation.x + i * 2 * Math.sqrt(3) * transformation.scaling,
                    transformation.translation.y
                ),
                transformation.scaling,
            )
            let wingTiling = createTiling(littleBirdWing, new Basis(new Vector(-Math.sqrt(3), 3), new Vector(8 * Math.sqrt(3), 0)), this.canvas);
            wingTiling(ctx, t);
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

        let transformation = new Transformation(new Vector(600, 400), 40);

        let pattern = new Pattern(canvas.width, canvas.height);

        pattern.draw(ctx, transformation);


        document.addEventListener('keydown', (event) => {

            let shiftSpeed = 5

            switch (event.code) {
                case 'Minus':
                    transformation.scaling *= 0.99;
                    break;
                case 'Equal':
                    transformation.scaling *= 1.01;
                    break;
                case 'ArrowRight':
                    transformation.translation.x += shiftSpeed;
                    break;
                case 'ArrowLeft':
                    transformation.translation.x -= shiftSpeed;
                    break;
                case 'ArrowUp':
                    transformation.translation.y -= shiftSpeed;
                    break;
                case 'ArrowDown':
                    transformation.translation.y += shiftSpeed;
                    break;
            }

            pattern.draw(ctx, transformation);

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
                transformation.translation.x += e.offsetX - mouseX;
                transformation.translation.y += e.offsetY - mouseY;
                pattern.draw(ctx, transformation);
                mouseX = e.offsetX;
                mouseY = e.offsetY;
            }
        });

        document.addEventListener('mouseup', e => {
            if (mouseDown === true) {
                transformation.translation.x += e.offsetX - mouseX;
                transformation.translation.y += e.offsetY - mouseY;
                pattern.draw(ctx, transformation);
                mouseDown = false;
            }
        });

        document.addEventListener('wheel', e => {
            if (e.deltaY === 0) {
                return;
            }
            let r = e.deltaY > 0 ? 0.98 : 1.02;
            let t = transformation;
            let correctionX = (e.offsetX - t.translation.x) * (r - 1);
            let correctionY = (e.offsetY - t.translation.y) * (r - 1);
            t.scaling *= r;
            t.translation.x -= correctionX;
            t.translation.y -= correctionY;
            pattern.draw(ctx, transformation);
        });

    }
}
