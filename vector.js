

class Vector {

    /**
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     */
    constructor(x, y, z) {
        this.set(x, y, z);
    }

    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    /**
     * @returns {Number}
     */
    get length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }

    /**
     * @returns {Vector}
     */
    normalize() {
        const len = this.length;
        this.x /= len;
        this.y /= len;
        this.z /= len;

        return this;
    }

    /**
     * @param {Vector|Number} v
     */
    add(v) {
        if (v instanceof Vector) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
        } else {
            this.x += v;
            this.y += v;
            this.z += v;
        }
        return this;
    }

    /**
     * @param {Vector|Number} v
     */
    subtract(v) {
        if (v instanceof Vector) {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
        } else {
            this.x -= v;
            this.y -= v;
            this.z -= v;
        }
        return this;
    }

    /**
     * @param {Vector} v
     * @returns {Number}
     */
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    /**
     * @param {Vector} v
     * @param {Vector} [result] optional result vector to avoid creating a new Vector object every time
     * @returns {Vector}
     */
    cross(v, result) {
        const x = this.y * v.z - this.z * v.y;
        const y = this.z * v.x - this.x * v.z;
        const z = this.x * v.y - this.y * v.x;
        return result ? result.set(x, y, z) : new Vector(x, y, z);
    }

    /**
     * @param {Number} theta - angle in radians
     * @returns {Vector}
     */
    rotateX(theta) {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        this.x = x;
        this.y = y * cos - z * sin;
        this.z = y * sin + z * cos;
        return this;
    }

    /**
     * @param {Number} theta - angle in radians
     * @returns {Vector}
     */
    rotateY(theta) {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        this.x = x * cos + z * sin;
        this.y = y;
        this.z = -x * sin + z * cos;
        return this;
    }

    /**
     * @param {Number} theta - angle in radians
     * @returns {Vector}
     */
    rotateZ(theta) {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        this.x = x * cos - y * sin;
        this.y = x * sin + y * cos;
        this.z = z;
        return this;
    }
}
