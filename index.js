
class App {

    constructor() {
        // set this to ZERO to disable multi-thread mode
        this.workerCount = 4;

        this.workers = this.workerCount > 0 ?
            Array.from(Array(this.workerCount), (_,i) => new Worker(`worker.js?${i+1}`)) : null;
        console.info("Multi-thread mode is %c" + ((this.workerCount > 0) ? "enabled" : "disabled"),
            "font-weight: bold");

        this.hourglass = document.getElementById("hourglass");
        this.canvas = document.getElementById("canvas");
        this.context = this.canvas.getContext("2d");

        this.isRendering = false;

        this.wantsSeaLevel = true;

        this.reset();

        this.hourglass.classList.remove("hidden");
        setTimeout(async () => {
            // postpone to next tick so hourglass can show up
            await this.draw();
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

    // send map chunk request to worker thread
    submitJob(workerIndex, x0, x1, y0, y1) {
        const worker = this.workers[workerIndex];
        return new Promise(resolve => {
            worker.addEventListener("message", () => resolve(event.data), { once: true });
            worker.postMessage([x0, x1, y0, y1]);
        });
    }

    updateCanvas(buffer, x, y, noise) {
        // ToDo turn transformations into proper independent modules
        // noise = this.transform2(noise, x);

        const bi = 4 * (this.canvas.width * y + x);

        if (this.wantsSeaLevel) {
            const seaLevel = 0.55;
            buffer[bi    ] = 0;
            buffer[bi + 1] = noise >= seaLevel ? noise * 255 : 0;
            buffer[bi + 2] = noise < seaLevel ? noise * 255 : 0;
        } else {
            const channelValue = noise * 255;
            buffer[bi    ] = channelValue;
            buffer[bi + 1] = channelValue;
            buffer[bi + 2] = channelValue;
        }
        buffer[bi + 3] = 255;  // alpha channel
    }

    /** @return {void} */
    async draw() {
        console.time("render");
        this.isRendering = true;

        const ctx = this.context;
        const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const buffer = imageData.data;

        if (this.workerCount > 0) {
            // submit map slices to workers in parallel
            const sliceWidth = Math.ceil(this.canvas.width / this.workerCount);
            let promises = [];
            for (let i = 0, x = 0; i < this.workerCount; i++, x += sliceWidth) {
                promises.push(this.submitJob(i, x, Math.min(x + sliceWidth, this.canvas.width), 0, this.canvas.height));
            }
            // wait for all workers to be done
            const chunks = await Promise.all(promises);

            for (let sliceIndex = 0; sliceIndex < this.workerCount; sliceIndex++) {
                const x0 = sliceIndex * sliceWidth;
                const x1 = Math.min(x0 + sliceWidth, this.canvas.width);
                const currentSliceWidth = x1 - x0;

                for (let x = x0; x < x1; x++) {
                    for (let y = 0; y < this.canvas.height; y++) {
                        let noise = chunks[sliceIndex][y * currentSliceWidth + x];
                        this.updateCanvas(buffer, x, y, noise);
                    }
                }
            }
        } else {
            // single-thread mode
            for (let x = 0; x < this.canvas.width; x++) {
                for (let y = 0; y < this.canvas.height; y++) {
                    let noise = generateNoise(x, y);
                    this.updateCanvas(buffer, x, y, noise);
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
