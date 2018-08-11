
function generateNoise(x, y, octaves) {
    // avoid integer coordinates, which would generate uniform noise
    const adjustedX = x / FractalImprovedPerlin.INTER_GRADIENT_SPACING;
    const adjustedY = y / FractalImprovedPerlin.INTER_GRADIENT_SPACING;

    return FractalImprovedPerlin.noise2d(adjustedX, adjustedY, octaves, 0.5, 2);
}
