
function runWebWorker() {
    importScripts("improved-perlin.js", "fractal-improved-perlin.js", "noise.js");

    const workerId = `[worker${location.search.substr(1)}]`;
    console.info(`${workerId} started`);

    onmessage = function ({data}) {
        const [x0, x1, y0, y1] = data;
        const width = x1 - x0;
        const height = y1 - y0;
        const result = Array(width * height);

        console.info(`${workerId} processing [${x0}, ${x1}]`);

        for (let x = x0; x < x1; x++) {
            for (let y = y0; y < y1; y++) {
                result[y * width + x] = generateNoise(x, y);
            }
        }

        postMessage(result);
    };
}

const isWebWorker = self.constructor.name === "DedicatedWorkerGlobalScope";

if (isWebWorker) {
    runWebWorker();
}
