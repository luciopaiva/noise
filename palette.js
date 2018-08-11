

class Palette {

    constructor(size) {
        this.size = size;
        this.colors = Array(this.size << 2);  // r, g, b, a, r, g, b, a, r, g, b, a, ...
        this.nextPosition = 0;
        this.startColor = null;
    }

    /**
     * @param {Number} value - a number in the range [0, 1[
     * @returns {[Number, Number, Number, Number]} the RGBA color
     */
    color(value) {
        const colorIndex = this.valueToColorIndex(value);
        const pos = colorIndex << 2;
        return this.colors.slice(pos, pos + 4);
    }

    addGradientPoint(value, r, g, b, a) {
        if (this.startColor !== null) {
            const endIndex = this.valueToColorIndex(value);
            for (let i = this.nextPosition; i < endIndex; i++) {
                const ratio = (i - this.nextPosition) / (endIndex - this.nextPosition);
                const pos = i << 2;
                this.colors[pos    ] = Math.floor(this.lerp(this.startColor[0], r, ratio));
                this.colors[pos + 1] = Math.floor(this.lerp(this.startColor[1], g, ratio));
                this.colors[pos + 2] = Math.floor(this.lerp(this.startColor[2], b, ratio));
                this.colors[pos + 3] = Math.floor(this.lerp(this.startColor[3], a, ratio));
            }
            this.nextPosition = endIndex;
        }
        this.startColor = [r, g, b, a];
    }

    /**
     * @param {Number} a - any number
     * @param {Number} b - any number
     * @param {Number} t - some value in the range [0, 1[
     * @returns {Number} interpolated value between a and b
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * @private
     * @return {Number}
     */
    valueToColorIndex(value) {
        return Math.floor(value * this.size)
    }
}

class TerrainPalette extends Palette {
    constructor (size) {
        super(size);
        this.addGradientPoint((-1.0000 + 1) / 2,   0,   0, 128, 255);  // deeps
        this.addGradientPoint((-0.2500 + 1) / 2,   0,   0, 255, 255);  // shallow
        this.addGradientPoint(( 0.0000 + 1) / 2,   0, 128, 255, 255);  // shore
        this.addGradientPoint(( 0.0625 + 1) / 2, 240, 240,  64, 255);  // sand
        this.addGradientPoint(( 0.1250 + 1) / 2,  32, 160,   0, 255);  // grass
        this.addGradientPoint(( 0.3750 + 1) / 2, 224, 224,   0, 255);  // dirt
        this.addGradientPoint(( 0.7550 + 1) / 2, 128, 128, 128, 255);  // rock
        this.addGradientPoint(( 1.0000 + 1) / 2, 255, 255, 255, 255);  // snow
    }
}
