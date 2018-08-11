
class App {

    static get MAX_THREADS() { return 8; }

    constructor() {
        this.threadsElement = document.getElementById("threads");
        this.octavesElement = document.getElementById("octaves");
        this.terrainModeElement = document.getElementById("terrain-mode");
        this.noisePointsElement = document.getElementById("noise-points");
        this.refreshButton = document.getElementById("refresh");

        this.drawOnEvent(this.threadsElement, "input");
        this.drawOnEvent(this.octavesElement, "input");
        this.drawOnEvent(this.terrainModeElement, "input");
        this.drawOnEvent(this.noisePointsElement, "input");
        this.drawOnEvent(this.refreshButton, "click");

        this.workers = Array.from(Array(App.MAX_THREADS), (_,i) => new Worker(`worker.js?${i+1}`));
        console.info(`Threads available: ${this.workers.length}`);

        this.hourglass = document.getElementById("hourglass");
        this.canvas = document.getElementById("canvas");
        this.context = this.canvas.getContext("2d");

        this.isRendering = false;

        this.reset();
        this.showHourglassAndDraw();

        this.drawOnEvent(window, "resize");
    }

    drawOnEvent(element, event) {
        element.addEventListener(event, () => this.showHourglassAndDraw());
    }

    showHourglassAndDraw() {
        this.hourglass.classList.remove("hidden");
        setTimeout(async () => {
            // postpone to next tick so hourglass can show up
            await this.draw();
            this.hourglass.classList.add("hidden");
        }, 1);
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
    submitJob(workerIndex, x0, x1, y0, y1, octaves) {
        const worker = this.workers[workerIndex];
        return new Promise(resolve => {
            worker.addEventListener("message", () => resolve(event.data), { once: true });
            worker.postMessage([x0, x1, y0, y1, octaves]);
        });
    }

    updateCanvas(buffer, x, y, noise) {
        // ToDo turn transformations into proper independent modules
        // noise = this.transform2(noise, x);

        const bi = 4 * (this.canvas.width * y + x);

        const wantsSeaLevel = this.terrainModeElement.checked;

        if (wantsSeaLevel) {
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
        if (this.isRendering) {
            return;
        }

        if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
            // unnecessarily resetting the canvas blanks it momentarily, making it difficult to compare settings changes
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        console.time("render");
        this.isRendering = true;

        const desiredOctaves = parseInt(this.octavesElement.value, 10);

        const ctx = this.context;
        const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const buffer = imageData.data;

        const workerCount = Math.min(App.MAX_THREADS, parseInt(this.threadsElement.value, 10));
        if (workerCount > 0) {
            // submit map slices to workers in parallel
            const sliceWidth = Math.ceil(this.canvas.width / workerCount);
            let promises = [];
            for (let i = 0, x = 0; i < workerCount; i++, x += sliceWidth) {
                promises.push(this.submitJob(i, x, Math.min(x + sliceWidth, this.canvas.width), 0, this.canvas.height, desiredOctaves));
            }
            // wait for all workers to be done
            const chunks = await Promise.all(promises);

            for (let sliceIndex = 0; sliceIndex < workerCount; sliceIndex++) {
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
            let min = Number.POSITIVE_INFINITY;
            let max = Number.NEGATIVE_INFINITY;

            // single-thread mode
            for (let x = 0; x < this.canvas.width; x++) {
                for (let y = 0; y < this.canvas.height; y++) {
                    let noise = generateNoise(x, y, desiredOctaves);
                    this.updateCanvas(buffer, x, y, noise);
                    if (noise > max) max = noise;
                    if (noise < min) min = noise;
                }
            }

            console.info(`min=${min.toFixed(3)}, max=${max.toFixed(3)}`);
        }

        ctx.putImageData(imageData, 0, 0);

        if (this.noisePointsElement.checked) {
            ctx.fillStyle = "red";
            for (let x = 0; x < this.canvas.width; x += FractalImprovedPerlin.INTER_GRADIENT_SPACING) {
                for (let y = 0; y < this.canvas.height; y += FractalImprovedPerlin.INTER_GRADIENT_SPACING) {
                    this.drawPoint(x, y);
                }
            }
        }

        this.isRendering = false;
        console.timeEnd("render");
    }

    drawPoint(x, y) {
        const ctx = this.context;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
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
}

new App();
