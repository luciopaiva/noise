

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
                this.colors[pos    ] = Math.floor(Palette.lerp(this.startColor[0], r, ratio));
                this.colors[pos + 1] = Math.floor(Palette.lerp(this.startColor[1], g, ratio));
                this.colors[pos + 2] = Math.floor(Palette.lerp(this.startColor[2], b, ratio));
                this.colors[pos + 3] = Math.floor(Palette.lerp(this.startColor[3], a, ratio));
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
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * @private
     * @return {Number}
     */
    valueToColorIndex(value) {
        return Math.floor(value * this.size)
    }

    static getCssPaletteColorProperty(i) {
        const isValid = value => typeof value === "string" && value.length > 0;
        const value = window.getComputedStyle(document.documentElement).getPropertyValue(`--palette-${i}-value`);
        const color = window.getComputedStyle(document.documentElement).getPropertyValue(`--palette-${i}-color`);
        if (isValid(value) && isValid(color)) {
            const matchRGBA = color.match(/rgba.*?\(.*?(\d+).*?(\d+).*?(\d+).*?(\d+).*?\)/);
            if (matchRGBA) {
                const r = parseInt(matchRGBA[1], 10);
                const g = parseInt(matchRGBA[2], 10);
                const b = parseInt(matchRGBA[3], 10);
                const a = Math.floor(parseFloat(matchRGBA[4]) * 255);
                return [parseFloat(value), r, g, b, a];
            } else {
                const matchRGB = color.match(/rgb.*?\(.*?(\d+).*?(\d+).*?(\d+).*?\)/);
                if (matchRGB) {
                    const r = parseInt(matchRGB[1], 10);
                    const g = parseInt(matchRGB[2], 10);
                    const b = parseInt(matchRGB[3], 10);
                    const a = 255;
                    return [parseFloat(value), r, g, b, a];
                }
            }
        }
        return null;
    }

    loadColorsFromCssProperties() {
        for (let i = 0; ; i++) {
            const colorParams = Palette.getCssPaletteColorProperty(i);
            if (colorParams === null) {
                break;
            }
            colorParams[0] = (colorParams[0] + 1) / 2;  // convert from [-1, 1] to [0, 1]
            this.addGradientPoint(...colorParams);
        }
    }
}

class TerrainPalette extends Palette {
    constructor (size) {
        super(size);
        this.loadColorsFromCssProperties();
    }
}
