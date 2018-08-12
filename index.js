
class App {

    static get MAX_THREADS() { return 8; }

    constructor() {
        this.elevationData = [];
        this.lightingData = [];

        this.palette = new TerrainPalette(512);

        this.threadsElement = document.getElementById("threads");
        this.octavesElement = document.getElementById("octaves");
        this.terrainModeElement = document.getElementById("terrain-mode");
        this.noisePointsElement = document.getElementById("noise-points");
        this.sunModeElement = document.getElementById("sun-mode");
        this.dayAndNightElement = document.getElementById("day-and-night");
        this.refreshButton = document.getElementById("refresh");

        this.generateTerrainOnEvent(this.threadsElement, "input");
        this.generateTerrainOnEvent(this.octavesElement, "input");
        this.generateTerrainOnEvent(this.terrainModeElement, "input");
        this.generateTerrainOnEvent(this.noisePointsElement, "input");
        this.generateTerrainOnEvent(this.sunModeElement, "input");
        this.generateTerrainOnEvent(this.refreshButton, "click");

        this.workers = Array.from(Array(App.MAX_THREADS), (_,i) => new Worker(`worker.js?${i+1}`));
        console.info(`Threads available: ${this.workers.length}`);

        this.hourglass = document.getElementById("hourglass");
        this.canvas = document.getElementById("canvas");
        this.context = this.canvas.getContext("2d");

        this.isGeneratingTerrain = false;
        this.seaLevel = 0.5;  // ToDo this currently can't be changed without also manually changing the CSS color palette
        this.sunAngle = .65 * Math.PI;
        this.sunStep = Math.PI / 30;  // each animation frame will step this many radians
        this.sunsetAngle = (5/4) * Math.PI;  // a bit after sunset actually
        this.sunriseAngle = -(1/4) * Math.PI;  // a bit before sunrise actually

        this.reset();
        this.showHourglassAndGenerateTerrain();

        this.generateTerrainOnEvent(window, "resize");

        this.draw();
    }

    generateTerrainOnEvent(element, event) {
        element.addEventListener(event, () => this.showHourglassAndGenerateTerrain());
    }

    showHourglassAndGenerateTerrain() {
        this.hourglass.classList.remove("hidden");
        setTimeout(async () => {
            // postpone to next tick so hourglass can show up
            await this.generateTerrain();
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

    updateCanvas(buffer, x, y, noise, lightingLevel = 1) {
        // ToDo turn transformations into proper independent modules
        // noise = this.transform2(noise, x);

        const bi = 4 * (this.canvas.width * y + x);

        const isTerrainMode = this.terrainModeElement.checked;

        if (isTerrainMode) {
            const [r, g, b, a] = this.palette.color(noise);
            buffer[bi    ] = Math.floor(r * lightingLevel);
            buffer[bi + 1] = Math.floor(g * lightingLevel);
            buffer[bi + 2] = Math.floor(b * lightingLevel);
            buffer[bi + 3] = a;
        } else {
            const channelValue = noise * 255;
            buffer[bi    ] = channelValue;
            buffer[bi + 1] = channelValue;
            buffer[bi + 2] = channelValue;
            buffer[bi + 3] = 255;
        }
    }

    /** @return {void} */
    async generateTerrain() {
        if (this.isGeneratingTerrain) {
            return;
        }

        if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
            // unnecessarily resetting the canvas blanks it momentarily, making it difficult to compare settings changes
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        const totalAreaSize = this.canvas.width * this.canvas.height;
        if (totalAreaSize !== this.elevationData.length) {
            this.elevationData = Array(totalAreaSize);
            this.lightingData = Array(totalAreaSize);
        }

        console.time("render");
        this.isGeneratingTerrain = true;

        const desiredOctaves = parseInt(this.octavesElement.value, 10);

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

                let rowPosition = 0;
                for (let y = 0; y < this.canvas.height; y++) {
                    for (let x = x0; x < x1; x++) {
                        this.elevationData[rowPosition + x] = chunks[sliceIndex][y * currentSliceWidth + x];
                    }
                    rowPosition += this.canvas.width;
                }
            }
        } else {
            let min = Number.POSITIVE_INFINITY;
            let max = Number.NEGATIVE_INFINITY;

            // single-thread mode
            let rowPosition = 0;
            for (let y = 0; y < this.canvas.height; y++) {
                for (let x = 0; x < this.canvas.width; x++) {
                    let noise = generateNoise(x, y, desiredOctaves);
                    this.elevationData[rowPosition + x] = noise;
                    if (noise > max) max = noise;
                    if (noise < min) min = noise;
                }
                rowPosition += this.canvas.width;
            }

            console.info(`min=${min.toFixed(3)}, max=${max.toFixed(3)}`);
        }

        this.isGeneratingTerrain = false;
        console.timeEnd("render");

        this.drawOnce();
    }

    draw() {
        if (!this.isGeneratingTerrain && this.dayAndNightElement.checked) {
            this.sunAngle += this.sunStep;
            if (this.sunAngle > this.sunsetAngle) {
                // advance through the night quickly
                this.sunAngle = this.sunriseAngle;
            }
            this.drawOnce();
        }

        requestAnimationFrame(this.draw.bind(this));
    }

    drawOnce() {
        if (this.sunModeElement.checked) {
            this.calculateLighting();
        }

        const ctx = this.context;
        const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const buffer = imageData.data;

        let rowPosition = 0;
        for (let y = 0; y < this.canvas.height; y++) {
            for (let x = 0; x < this.canvas.width; x++) {
                const elevation = this.elevationData[rowPosition + x];
                const lighting = this.sunModeElement.checked ? this.lightingData[rowPosition + x] : 1;
                this.updateCanvas(buffer, x, y, elevation, lighting);
            }
            rowPosition += this.canvas.width;
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
    }

    calculateLighting() {
        const sunSin = Math.sin(this.sunAngle);
        const sun = new Vector(Math.cos(this.sunAngle), sunSin, 0);
        const seaBrightness = .75 * sunSin;
        const a = new Vector(0, 0, 0);
        const b = new Vector(0, 0, 0);
        let rowPosition = 0;
        let minLight = Number.POSITIVE_INFINITY;
        let maxLight = Number.NEGATIVE_INFINITY;
        for (let y = 0; y < this.canvas.height; y++) {
            for (let x = 0; x < this.canvas.width; x++) {
                let light = 1;
                const elevation = this.elevationData[rowPosition + x];
                if (x > 0) {
                    if (elevation > this.seaLevel) {
                        // take the elevation next to us as reference to calculate our normal
                        const previousElevation = this.elevationData[rowPosition + x - 1];
                        a.set(0, previousElevation, 0);
                        b.set(0.02, elevation, 0);  // x coord empirically determined for best results
                        // the dot product will check how aligned with sun rays our normal is
                        light = a.subtract(b).normalize().rotateZ(-Math.PI / 2).dot(sun);
                        light = Math.max(0, light);  // negative values mean total darkness

                        this.lightingData[rowPosition + x] = light;

                        if (light > maxLight) maxLight = light;
                        if (light < minLight) minLight = light;
                    } else {
                        this.lightingData[rowPosition + x] = seaBrightness;
                    }
                } else {
                    // sacrifice the first column
                    this.lightingData[rowPosition] = 0;
                }
            }
            rowPosition += this.canvas.width;
        }
        console.info(`Surface light variation: ${minLight}, ${maxLight}`);
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
