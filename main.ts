import { Vector, Rectangle, Transformation } from "./typing";
import { createLittleBirdPattern } from "./littlebird";
import { Drawable } from "./drawing";

const canvas = document.querySelector('canvas');

if (canvas != null) {
    const ctx = canvas.getContext('2d');
    
    if (ctx != null) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const canvasRectangle = new Rectangle(new Vector(0, 0), new Vector(canvas.width, canvas.height));
        let pattern = createLittleBirdPattern(canvasRectangle);
        let transformation = new Transformation(new Vector(600, 400), 40);

        pattern(ctx, transformation);

        addEventListenersKeyboard(document, ctx, pattern, transformation, canvasRectangle.center());
        addEventListenersMouse(document, ctx, pattern, transformation);
    }
}


function addEventListenersKeyboard(
    document: Document, ctx: CanvasRenderingContext2D, pattern: Drawable, transformation: Transformation, canvasCenter: Vector
) {

    document.addEventListener('keydown', (event) => {

        let shiftSpeed = 10

        switch (event.code) {
            case 'Minus':
                zoom(transformation, canvasCenter, 0.98)
                break;
            case 'Equal':
                zoom(transformation, canvasCenter, 1.02)
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

}


function addEventListenersMouse(document: Document, ctx: CanvasRenderingContext2D, pattern: Drawable, transformation: Transformation) {

    let mouseX = 0;
    let mouseY = 0;
    let mouseDown = false;


    document.addEventListener('mousedown', e => {
        mouseX = e.offsetX;
        mouseY = e.offsetY;
        mouseDown = true;
    });


    document.addEventListener('mousemove', e => {
        if (mouseDown) {
            transformation.translation.x += e.offsetX - mouseX;
            transformation.translation.y += e.offsetY - mouseY;
            pattern(ctx, transformation);
            mouseX = e.offsetX;
            mouseY = e.offsetY;
        }
    });

    document.addEventListener('mouseup', e => {
        if (mouseDown) {
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
        let factor = e.deltaY > 0 ? 0.98 : 1.02;
        zoom(transformation, new Vector(e.offsetX, e.offsetY), factor)
        pattern(ctx, transformation);
    });
}


function zoom(transformation: Transformation, center: Vector, ratio: number) {
    transformation.scaling *= ratio;
    transformation.translation = transformation.translation.scale(ratio).subtract(center.scale(ratio - 1));
}