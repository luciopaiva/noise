
/**
 * https://en.wikipedia.org/wiki/Linear_congruential_generator
 * "Numerical recipes" parameters
 */
class LCG {

    constructor (seed) {
        this.seed = seed;
        this.current = this.seed;
        this.modulus = 2 ** 32;
    }

    /**
     * @returns {Number} a value in the range [0, 1<<32[
     */
    nextInt32() {
        this.current = (1664525 * this.current + 1013904223) % this.modulus;
        return this.current;
    }

    /**
     * @returns {Number} a value in the range [0, 1[
     */
    next() {
        return this.nextInt32() / this.modulus;
    }
}
