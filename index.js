
class App {

    constructor() {
        this.hourglass = document.getElementById("hourglass");
        this.canvas = document.getElementById("canvas");
        this.context = this.canvas.getContext("2d");

        this.isRendering = false;

        this.reset();

        this.hourglass.classList.remove("hidden");
        setTimeout(() => {
            // postpone to next tick so hourglass can show up
            this.draw();
            this.hourglass.classList.add("hidden");
        }, 1);

        window.addEventListener("resize", this.resize.bind(this));
    }

    /** Draws a black canvas */
    reset() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const ctx = this.context;
        const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const buffer = imageData.data;

        buffer.fill(0);
        for (let i = 3; i < buffer.length; i += 4) {
            buffer[i] = 255;
        }

        ctx.putImageData(imageData, 0, 0);
    }

    draw() {
        this.isRendering = true;

        const ctx = this.context;
        const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const buffer = imageData.data;

        let x = 0;
        let y = 0;
        for (let i = 0; i < this.canvas.width; i++) {
            for (let j = 0; j < this.canvas.height; j++) {
                x = i / 256;  // to avoid integer coordinates, which would generate uniform noise
                y = j / 256;  //

                const noise = FractalImprovedPerlin.noise2d(x, y, 6, 0.5, 2);

                const seaLevel = 0.55;

                const bi = 4 * (this.canvas.width * j + i);
                buffer[bi    ] = 0;
                buffer[bi + 1] = noise >= seaLevel ? noise * 255 : 0;
                buffer[bi + 2] = noise < seaLevel ? noise * 255 : 0;
                buffer[bi + 3] = 255;  // alpha channel
            }
        }

        ctx.putImageData(imageData, 0, 0);
        this.isRendering = false;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (!this.isRendering) {
            this.draw();
        }
    }
}

new App();
