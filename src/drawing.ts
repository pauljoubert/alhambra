import { Basis, Rectangle, Transformation, Unit } from "./typing";
import { generateCovering } from "./covering";

export type Drawable = (ctx: CanvasRenderingContext2D, transformation: Transformation) => void;


/**
 * Unit repeated across a 2D grid.
 */
export function createTiling(unitOriginal: Unit, basisOriginal: Basis, canvas: Rectangle): Drawable {

    return (ctx, transformation) => {

        let unit = transformUnit(unitOriginal, transformation);
        const basis = basisOriginal.scale(transformation.scaling);

        // Translate unit by vector in span of basis to move bounding box close to canvas center.
        const difference = canvas.center().subtract(unit.boundingBox.center());
        const roundedDifference = basis.fromCoefficients(basis.toCoefficients(difference).round());
        unit = transformUnit(unit, new Transformation(roundedDifference, 1));

        const debug = false;
        if (debug) {
            drawRectangle(ctx, unit.boundingBox);
        }

        for (const coefficients of generateCovering(unit.boundingBox, basis, canvas)) {
            const t = basis.fromCoefficients(coefficients);
            transformDraw(unit.draw, new Transformation(t, 1))(ctx);
        }
    }

}


export function withFill(draw: Drawable, fillStyle?: string): Drawable {

    return (ctx, transformation) => {
        ctx.beginPath();
        draw(ctx, transformation);
        if (fillStyle) {
            ctx.fillStyle = fillStyle;
        }
        ctx.fill();
    }

}


export function withModifyTransformation(draw: Drawable, modifyTransformation: (t: Transformation) => Transformation): Drawable {

    return (ctx, transformation) => draw(ctx, modifyTransformation(transformation));

}


export function joinDrawables(drawables: Drawable[]): Drawable {

    return (ctx, transformation) => {
        for (const drawable of drawables) {
            drawable(ctx, transformation);
        }
    }

}


export function drawBackground(canvas: Rectangle): Drawable {

    return (ctx, _) => {
        ctx.fillStyle = "white";
        ctx.fillRect(canvas.topLeft.x, canvas.topLeft.y, canvas.width(), canvas.height());
    }
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


function transformUnit(unit: Unit, transformation: Transformation): Unit {
    return {
        draw: transformDraw(unit.draw, transformation),
        boundingBox: unit.boundingBox.transform(transformation)
    }
}


function drawRectangle(ctx: CanvasRenderingContext2D, rectangle: Rectangle, lineWidth = 5, strokeStyle = "red") {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.strokeRect(rectangle.topLeft.x, rectangle.topLeft.y, rectangle.width(), rectangle.height());
}
