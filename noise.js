
function generateNoise(x, y) {
    const adjustedX = x / 256;  // to avoid integer coordinates, which would generate uniform noise
    const adjustedY = y / 256;  //

    return FractalImprovedPerlin.noise2d(adjustedX, adjustedY, 6, 0.5, 2);
}
