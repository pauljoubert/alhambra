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
        const pattern = createLittleBirdPattern(canvasRectangle);
        const transformation = new Transformation(new Vector(600, 400), 40);

        pattern(ctx, transformation);

        const pointerEventCache = new Array<PointerEvent>();

        addEventListenersPointer(document, ctx, pattern, transformation, pointerEventCache);
    }
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
            if (pointerEventCache.length === 1) {
                transformation.translation.x += e.offsetX - pointerX;
                transformation.translation.y += e.offsetY - pointerY;
                pointerX = e.offsetX;
                pointerY = e.offsetY;
            }


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
                    let ratio = currentDistance / previousDistance;
                    ratio = Math.max(ratio, 0.98);
                    ratio = Math.min(ratio, 1.02);
                    zoom(transformation, center, ratio);
                }

                // Cache the distance for the next move event 
                previousDistance = currentDistance;
            }

            pattern(ctx, transformation);
        }
    });

    document.addEventListener('pointerup', e => {

        pointerDown = false;

        remove_event(e, pointerEventCache);

        // If the number of pointers down is less than two then reset diff tracker
        if (pointerEventCache.length < 2) {
            previousDistance = -1;
        }

        if (pointerEventCache.length === 1) {
            pointerX = pointerEventCache[0].offsetX;
            pointerY = pointerEventCache[0].offsetY;
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