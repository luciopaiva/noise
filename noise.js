
function makeMountain(x, y, mx, my) {
    const mountainPosition = new Vector(mx, my);
    const queryPosition = new Vector(x, y);
    const mountainRadius = 100;
    const baseFactor = Math.min(1, queryPosition.subtract(mountainPosition).length / mountainRadius);
    return 0.2 * Math.cos(baseFactor * Math.PI / 2);
}

function makeLake(x, y, mx, my) {
    const lakePosition = new Vector(mx, my);
    const queryPosition = new Vector(x, y);
    const lakeRadius = 100;
    const baseFactor = Math.min(1, queryPosition.subtract(lakePosition).length / lakeRadius);
    return -0.1 * Math.cos(baseFactor * Math.PI / 2);
}

function applyRandomFeatures(noise, x, y) {
    return Math.min(1, noise +
        makeMountain(x, y, 300, 300) +
        makeMountain(x, y, 600, 500) +
        makeLake(x, y, 450, 400));
}

function generateNoise(x, y, octaves) {
    // avoid integer coordinates, which would generate uniform noise
    const adjustedX = x / FractalImprovedPerlin.INTER_GRADIENT_SPACING;
    const adjustedY = y / FractalImprovedPerlin.INTER_GRADIENT_SPACING;

    const noise = FractalImprovedPerlin.noise2d(adjustedX, adjustedY, octaves, 0.5, 2);
    // return applyRandomFeatures(noise, x, y);
    return noise;
}
