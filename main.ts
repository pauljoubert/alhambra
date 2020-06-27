import { Vector, Rectangle, Transformation} from "./typing";
import { createLittleBirdPattern } from "./littlebird";

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
