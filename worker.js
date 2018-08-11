
function runWebWorker() {
    importScripts("improved-perlin.js", "fractal-improved-perlin.js", "noise.js");

    const workerId = `[worker${location.search.substr(1)}]`;
    console.info(`${workerId} started`);

    const log = message => console.info(`${workerId} ${message}`);

    onmessage = function ({data}) {
        const [x0, x1, y0, y1, octaves] = data;
        const width = x1 - x0;
        const height = y1 - y0;
        const result = Array(width * height);

        log(`processing [${x0}, ${x1}] (octaves: ${octaves})`);

        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;

        for (let x = x0; x < x1; x++) {
            for (let y = y0; y < y1; y++) {
                const noise = generateNoise(x, y, octaves);
                result[y * width + x] = noise;
                if (noise > max) max = noise;
                if (noise < min) min = noise;
            }
        }

        log(`min=${min.toFixed(3)}, max=${max.toFixed(3)}`);

        postMessage(result);
    };
}

const isWebWorker = self.constructor.name === "DedicatedWorkerGlobalScope";

if (isWebWorker) {
    runWebWorker();
}
