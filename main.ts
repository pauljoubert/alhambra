import { Vector, Basis, Rectangle, Transformation, Unit } from "./typing";
import { generateCovering } from "./covering";

type Drawable = (ctx: CanvasRenderingContext2D, transformation: Transformation) => void;
const sqrt3 = Math.sqrt(3);


function transformDraw(draw: (ctx: CanvasRenderingContext2D) => void, transformation: Transformation) {
    return function (ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(transformation.translation.x, transformation.translation.y);
        ctx.scale(transformation.scaling, transformation.scaling);
        draw(ctx);
        ctx.restore();
    }
}


function transformUnit(unit: Unit, transformation: Transformation): Unit {
    return {
        draw: transformDraw(unit.draw, transformation),
        boundingBox: unit.boundingBox.transform(transformation)
    }
}


function drawRectangle(ctx: CanvasRenderingContext2D, rectangle: Rectangle, lineWidth = 5, strokeStyle = "blue") {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.rect(rectangle.topLeft.x, rectangle.topLeft.y, rectangle.width(), rectangle.height());
    ctx.stroke();
}


/**
 * Unit repeated across a 2D grid.
 */
function createTiling(unitOriginal: Unit, basisOriginal: Basis, canvas: Rectangle): Drawable {

    function draw(ctx: CanvasRenderingContext2D, transformation: Transformation) {

        let unit = transformUnit(unitOriginal, transformation);
        let basis = basisOriginal.scale(transformation.scaling);
        
        // Translate unit by vector in span of basis to move bounding box close to canvas center.
        let difference = canvas.center().subtract(unit.boundingBox.center());
        const roundedDifference = basis.fromCoefficients(basis.toCoefficients(difference).round());
        unit = transformUnit(unit, new Transformation(roundedDifference, 1));

        // Draw bounding box. Very useful for debugging.
        let debug = true;
        if (debug) {
            drawRectangle(ctx, unit.boundingBox);
        }

        for (const coefficients of generateCovering(unit.boundingBox, basis, canvas)) {
            const t = basis.fromCoefficients(coefficients);
            transformDraw(unit.draw, new Transformation(t, 1))(ctx);
        }
    }

    return draw;

}


const littleBirdStar: Unit = {
    draw: function (ctx: CanvasRenderingContext2D) {
        let r = sqrt3 - 1;

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
        const r = sqrt3 - 1;

        ctx.save();
        ctx.translate(0, 2);
        for (let i = 0; i < 3; i++) {
            ctx.moveTo(0.5 * r, r * sqrt3 / 2);
            ctx.arc(0.5 * sqrt3, 1.5, 1, 4 * Math.PI / 3, 3 * Math.PI / 2);
            ctx.arc(sqrt3 / 2, -0.5, 1, Math.PI / 2, (11 / 6) * Math.PI, true);
            ctx.arc(sqrt3 / 2, -1.5, 1, Math.PI / 6, (2 / 3) * Math.PI);
            ctx.lineTo(r, 0);
            ctx.lineTo(0.5 * r, r * sqrt3 / 2);
            ctx.rotate((2 / 3) * Math.PI);
        }

        ctx.restore();
    },
    boundingBox: (function () {
        let r = 3 * sqrt3 / 2;
        return new Rectangle(new Vector(-r, -r + 2), new Vector(r, r + 2));
    })()
}


function withFill(draw: Drawable, fillStyle?: string): Drawable {

    return (ctx, transformation) => {
        ctx.beginPath();
        draw(ctx, transformation);
        if (fillStyle) {
            ctx.fillStyle = fillStyle;
        }
        ctx.fill();
    }

}


function withModifyTransformation(draw: Drawable, modifyTransformation: (t: Transformation) => Transformation): Drawable {

    return (ctx, transformation) => draw(ctx, modifyTransformation(transformation));

}


function joinDrawables(drawables: Drawable[]): Drawable {

    return (ctx, transformation) => {
        for (const drawable of drawables) {
            drawable(ctx, transformation);
        }
    }

}

function drawBackground(canvas: Rectangle): Drawable {

    return (ctx, _) => {
        ctx.fillStyle = "white";
        ctx.fillRect(canvas.topLeft.x, canvas.topLeft.y, canvas.width(), canvas.height());
    }
}


function createLittleBirdPattern(canvas: Rectangle): Drawable {

    const colours: { [key: string]: string } = {
        "black": "black",
        "orange": "rgb(176, 93, 37)",
        "green": "rgb(35, 98, 45)",
        "blue": "rgb(81, 122, 184)",
    }

    const colour_order = ["black", "orange", "green", "blue"];

    const starTilingBase = createTiling(littleBirdStar, new Basis(new Vector(0, 12), new Vector(2 * sqrt3, 0)), canvas);
    const wingTilingBase = createTiling(littleBirdWing, new Basis(new Vector(-sqrt3, 3), new Vector(8 * sqrt3, 0)), canvas);

    let tilings: Drawable[] = [];

    for (let i = 0; i < 4; i++) {
        let starTiling = withFill(starTilingBase, colours[colour_order[i]]);
        starTiling = withModifyTransformation(
            starTiling,
            (t) => new Transformation(
                new Vector(t.translation.x + i * sqrt3 * t.scaling, t.translation.y + 3 * i * t.scaling), t.scaling,
            )
        );
        tilings.push(starTiling);

        let wingTiling = withFill(wingTilingBase, colours[colour_order[i]]);
        wingTiling = withModifyTransformation(
            wingTiling,
            (t) => new Transformation(new Vector(t.translation.x + i * 2 * sqrt3 * t.scaling, t.translation.y), t.scaling)
        );
        tilings.push(wingTiling);
    }

    return joinDrawables([drawBackground(canvas), ...tilings]);

}


const canvas = document.querySelector('canvas');
if (canvas != null) {
    const ctx = canvas.getContext('2d');
    if (ctx != null) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let transformation = new Transformation(new Vector(600, 400), 40);

        const canvasRectangle = new Rectangle(new Vector(0, 0), new Vector(canvas.width, canvas.height));
        let pattern = createLittleBirdPattern(canvasRectangle);

        pattern(ctx, transformation);

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

            pattern(ctx, transformation);

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
                pattern(ctx, transformation);
                mouseX = e.offsetX;
                mouseY = e.offsetY;
            }
        });

        document.addEventListener('mouseup', e => {
            if (mouseDown === true) {
                transformation.translation.x += e.offsetX - mouseX;
                transformation.translation.y += e.offsetY - mouseY;
                pattern(ctx, transformation);
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
            pattern(ctx, transformation);
        });

    }
}
