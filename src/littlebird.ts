import { Vector, Basis, Rectangle, Transformation, Unit } from "./typing";
import { Drawable, createTiling, withFill, withModifyTransformation, joinDrawables, drawBackground } from "./drawing";


const sqrt3 = Math.sqrt(3);


export function createLittleBirdPattern(canvas: Rectangle): Drawable {

    const colours: { [key: string]: string } = {
        "black": "black",
        "orange": "rgb(176, 93, 37)",
        "green": "rgb(35, 98, 45)",
        "blue": "rgb(81, 122, 184)",
    }

    const colour_order = ["black", "orange", "green", "blue"];

    const starTilingReference = createTiling(littleBirdStar, new Basis(new Vector(0, 12), new Vector(2 * sqrt3, 0)), canvas);
    const wingTilingReference = createTiling(littleBirdWing, new Basis(new Vector(-sqrt3, 3), new Vector(8 * sqrt3, 0)), canvas);

    let tilings: Drawable[] = [];

    for (let i = 0; i < 4; i++) {
        let starTiling = withFill(starTilingReference, colours[colour_order[i]]);
        starTiling = withModifyTransformation(
            starTiling,
            (t) => new Transformation(
                new Vector(t.translation.x + i * sqrt3 * t.scaling, t.translation.y + 3 * i * t.scaling), t.scaling,
            )
        );
        tilings.push(starTiling);

        let wingTiling = withFill(wingTilingReference, colours[colour_order[i]]);
        wingTiling = withModifyTransformation(
            wingTiling,
            (t) => new Transformation(new Vector(t.translation.x + i * 2 * sqrt3 * t.scaling, t.translation.y), t.scaling)
        );
        tilings.push(wingTiling);
    }

    return joinDrawables([drawBackground(canvas), ...tilings]);

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
