
class App {

    constructor() {
        this.hourglass = document.getElementById("hourglass");
        this.canvas = document.getElementById("canvas");
        this.context = this.canvas.getContext("2d");

        this.isRendering = false;

        this.wantsSeaLevel = true;

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
        console.time("render");
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

                let noise = FractalImprovedPerlin.noise2d(x, y, 6, 0.5, 2);
                // ToDo turn transformations into proper independent modules
                // noise = this.transform2(noise, x);

                const bi = 4 * (this.canvas.width * j + i);

                if (this.wantsSeaLevel) {
                    const seaLevel = 0.55;
                    buffer[bi    ] = 0;
                    buffer[bi + 1] = noise >= seaLevel ? noise * 255 : 0;
                    buffer[bi + 2] = noise < seaLevel ? noise * 255 : 0;
                    buffer[bi + 3] = 255;  // alpha channel
                } else {
                    const channelValue = noise * 255;
                    buffer[bi    ] = channelValue;
                    buffer[bi + 1] = channelValue;
                    buffer[bi + 2] = channelValue;
                    buffer[bi + 3] = 255;  // alpha channel
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
        this.isRendering = false;
        console.timeEnd("render");
    }

    transform1(noise) {
        // formula idea taken from GPU Gems, Chapter 5: Implementing Improved Perlin Noise
        // https://developer.nvidia.com/gpugems/GPUGems/gpugems_ch05.html
        noise = Math.abs((noise - 0.55) * 2);
        noise = noise < 0.004 ? 0 : 1;
        return noise;
    }

    transform2(noise, x) {
        // formula idea taken from GPU Gems, Chapter 5: Implementing Improved Perlin Noise
        // https://developer.nvidia.com/gpugems/GPUGems/gpugems_ch05.html
        noise = (noise - 0.5) * 2;
        noise = (Math.sin(50 * x + 50 * noise) + 1) / 2;
        return noise;
    }

    transform3(noise, x) {
        // formula idea taken from GPU Gems, Chapter 5: Implementing Improved Perlin Noise
        // https://developer.nvidia.com/gpugems/GPUGems/gpugems_ch05.html
        noise = (noise - 0.5) * 2;
        noise = (Math.sin(20 * x + 20 * noise) + 1) / 2;
        return noise;
    }

    transform4(noise, x) {
        // formula idea taken from GPU Gems, Chapter 5: Implementing Improved Perlin Noise
        // https://developer.nvidia.com/gpugems/GPUGems/gpugems_ch05.html
        noise = (noise - 0.5) * 2;
        noise = (Math.sin(200 * x + 200 * noise) + 1) / 2;
        return noise;
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
