
class FractalImprovedPerlin {

    /**
     * Generates 2D fractal improved Perlin noise.
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Number} octaves some integer value greater or equal than 1 - more octaves mean more detail
     * @param {Number} persistence value normally in the range [0, 1[ to scale amplitude down each octave
     * @param {Number} lacunarity usually 2, scalar to multiply frequency for every next octave
     * @returns {Number} a value in the range [0, 1[
     */
    static noise2d(x, y, octaves = 1, persistence = 0.5, lacunarity = 2) {
        let value = 0;
        let amplitude = 1;
        let maxValue = 0;
        let frequency = 1;

        for (let octave = 0; octave < octaves; octave++) {
            value += ImprovedPerlin.noise2d(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }

        return value / maxValue;  // normalize it
    }

    /**
     * Generates 3D fractal improved Perlin noise.
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @param {Number} octaves some integer value greater or equal than 1 - more octaves mean more detail
     * @param {Number} persistence value normally in the range [0, 1[ to scale amplitude down each octave
     * @param {Number} lacunarity usually 2, scalar to multiply frequency for every next octave
     * @returns {Number} a value in the range [0, 1[
     */
    static noise3d(x, y, z, octaves = 1, persistence = 0.5, lacunarity = 2) {
        let value = 0;
        let amplitude = 1;
        let maxValue = 0;
        let frequency = 1;

        for (let octave = 0; octave < octaves; octave++) {
            value += ImprovedPerlin.noise3d(x * frequency, y * frequency, z * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }

        return value / maxValue;  // normalize it
    }
}

FractalImprovedPerlin.INTER_GRADIENT_SPACING = 64;  // this many pixels between adjacent gradients
