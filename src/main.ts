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

        const pointerEventCache = new Array<PointerEvent>();

        addEventListenersKeyboard(document, ctx, pattern, transformation, canvasRectangle.center());
        addEventListenersPointer(document, ctx, pattern, transformation, pointerEventCache);
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


function addEventListenersPointer(
    document: Document, ctx: CanvasRenderingContext2D, pattern: Drawable, transformation: Transformation, pointerEventCache: Array<PointerEvent>
) {

    let pointerX = 0;
    let pointerY = 0;
    let pointerDown = false;
    let previousDistance = -1;


    document.addEventListener('pointerdown', e => {
        pointerX = e.offsetX;
        pointerY = e.offsetY;
        pointerDown = true;
        pointerEventCache.push(e);
    });


    document.addEventListener('pointermove', e => {
        if (pointerDown) {
            transformation.translation.x += e.offsetX - pointerX;
            transformation.translation.y += e.offsetY - pointerY;
            pointerX = e.offsetX;
            pointerY = e.offsetY;

            // Find this event in the cache and update its record with this event
            for (var i = 0; i < pointerEventCache.length; i++) {
                if (e.pointerId == pointerEventCache[i].pointerId) {
                    pointerEventCache[i] = e;
                    break;
                }
            }

            // If two pointers are down, check for pinch gestures
            if (pointerEventCache.length == 2) {
                // Calculate the distance between the two pointers
                let point0 = new Vector(pointerEventCache[0].clientX, pointerEventCache[0].clientY);
                let point1 = new Vector(pointerEventCache[1].clientX, pointerEventCache[1].clientY);
                var currentDistance = point0.subtract(point1).norm();
                let center = point0.add(point1).scale(0.5);

                if (previousDistance > 0) {
                    if (currentDistance > (previousDistance + 5)) {
                        // The distance between the two pointers has increased, zoom in
                        zoom(transformation, center, 1.02)
                    }
                    if (currentDistance < (previousDistance - 5)) {
                        // The distance between the two pointers has decreased, zoom out
                        zoom(transformation, center, 0.98)
                    }
                }

                // Cache the distance for the next move event 
                previousDistance = currentDistance;
            }

            pattern(ctx, transformation);
        }
    });

    document.addEventListener('pointerup', e => {
        if (pointerDown) {
            transformation.translation.x += e.offsetX - pointerX;
            transformation.translation.y += e.offsetY - pointerY;
            pattern(ctx, transformation);
            pointerDown = false;

            remove_event(e, pointerEventCache);

            // If the number of pointers down is less than two then reset diff tracker
            if (pointerEventCache.length < 2) {
                previousDistance = -1;
            }
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


function remove_event(e: PointerEvent, evCache: Array<PointerEvent>) {
    // Remove this event from the target's cache
    for (var i = 0; i < evCache.length; i++) {
        if (evCache[i].pointerId == e.pointerId) {
            evCache.splice(i, 1);
            break;
        }
    }
}