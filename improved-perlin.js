/**
 * Improved Perlin noise. Not to be confused with Simplex noise, since it uses a cube grid.
 * Based on http://flafla2.github.io/2014/08/09/perlinnoise.html
 */
class ImprovedPerlin {

    static floor(n) {
        return n | 0;
    }

    static noise2d(x, y) {
        const floorX = ImprovedPerlin.floor(x);
        const floorY = ImprovedPerlin.floor(y);

        // get unit cube coordinate
        const xi = floorX & 255;
        const yi = floorY & 255;

        // local intra-cube coordinates
        const xf = x - floorX;
        const yf = y - floorY;

        // smooth intra-cube position
        const u = ImprovedPerlin.smooth(xf);
        const v = ImprovedPerlin.smooth(yf);

        // obtain gradients
        const aa = ImprovedPerlin.hash2d(xi,     yi,     0);
        const ab = ImprovedPerlin.hash2d(xi,     yi + 1, 0);
        const ba = ImprovedPerlin.hash2d(xi + 1, yi,     0);
        const bb = ImprovedPerlin.hash2d(xi + 1, yi + 1, 0);

        const lerp = ImprovedPerlin.lerp;
        const dot = ImprovedPerlin.dotProduct;

        const x1 = lerp(dot(aa, xf, yf, 0), dot(ba, xf-1, yf, 0), u);
        const x2 = lerp(dot(ab, xf, yf-1, 0), dot(bb, xf-1, yf-1, 0), u);
        return (lerp(x1, x2, v) + 1) / 2;  // map from [-1, 1[ to [0, 1[
    }

    static noise3d(x, y, z) {
        const floorX = ImprovedPerlin.floor(x);
        const floorY = ImprovedPerlin.floor(y);
        const floorZ = ImprovedPerlin.floor(z);

        // get unit cube coordinate
        const xi = floorX & 255;
        const yi = floorY & 255;
        const zi = floorZ & 255;

        // local intra-cube coordinates
        const xf = x - floorX;
        const yf = y - floorY;
        const zf = z - floorZ;

        // smooth intra-cube position
        const u = ImprovedPerlin.smooth(xf);
        const v = ImprovedPerlin.smooth(yf);
        const w = ImprovedPerlin.smooth(zf);

        // obtain gradients
        const aaa = ImprovedPerlin.hash3d(xi,     yi,     zi    );
        const aba = ImprovedPerlin.hash3d(xi,     yi + 1, zi    );
        const aab = ImprovedPerlin.hash3d(xi,     yi,     zi + 1);
        const abb = ImprovedPerlin.hash3d(xi,     yi + 1, zi + 1);
        const baa = ImprovedPerlin.hash3d(xi + 1, yi,     zi    );
        const bba = ImprovedPerlin.hash3d(xi + 1, yi + 1, zi    );
        const bab = ImprovedPerlin.hash3d(xi + 1, yi,     zi + 1);
        const bbb = ImprovedPerlin.hash3d(xi + 1, yi + 1, zi + 1);

        const lerp = ImprovedPerlin.lerp;
        const dot = ImprovedPerlin.dotProduct;

        const x1a = lerp(dot(aaa, xf, yf, zf), dot(baa, xf-1, yf, zf), u);
        const x2a = lerp(dot(aba, xf, yf-1, zf), dot(bba, xf-1, yf-1, zf), u);
        const y1 = lerp(x1a, x2a, v);

        const x1b = lerp(dot(aab, xf, yf, zf-1), dot(bab, xf-1, yf, zf-1), u);
        const x2b = lerp(dot(abb, xf, yf-1, zf-1), dot(bbb, xf-1, yf-1, zf-1), u);
        const y2 = lerp(x1b, x2b, v);

        return (lerp(y1, y2, w) + 1) / 2;  // map from [-1, 1[ to [0, 1[
    }

    /** Hash input coordinates to get gradients using permutation table. It's a cheap way to obtain random values */
    static hash3d(xi, yi, zi) {
        const p = ImprovedPerlin.permutation;
        return p[p[p[xi] + yi] + zi];
    }

    static hash2d(xi, yi) {
        const p = ImprovedPerlin.permutation;
        return p[p[xi] + yi];
    }

    static smooth(t) {
        return ImprovedPerlin.quinticSmooth(t);
    }

    static quinticSmooth(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);  // 6t^5 - 15t^4 + 10t^3
    }

    static cubicSmooth(t) {
        return t * t * (3 - 2 * t);
    }

    static noSmooth(t) {
        return t;
    }

    static lerp(a, b, t) {
        return a + t * (b - a);
    }

    static dotProduct(hash, x, y, z) {
        hash &= 0xF;
        const u = (hash < 8) ? x : y;
        const v = (hash < 4) ? y : ((hash === 12 || hash === 14) ? x : z);
        return ((hash & 1) === 0 ? u : -u) + ((hash & 2) === 0 ? v : -v);

        // code from https://riven8192.blogspot.com/2010/08/calculate-perlinnoise-twice-as-fast.html
        // this is way slower in Chrome - I'm talking 100x slower! Ken's original code runs in 2ms against more than 200ms here
        //
        // switch (hash & 0xF) {
        //     case 0x0: return  x + y;
        //     case 0x1: return -x + y;
        //     case 0x2: return  x - y;
        //     case 0x3: return -x - y;
        //     case 0x4: return  x + z;
        //     case 0x5: return -x + z;
        //     case 0x6: return  x - z;
        //     case 0x7: return -x - z;
        //     case 0x8: return  y + z;
        //     case 0x9: return -y + z;
        //     case 0xA: return  y - z;
        //     case 0xB: return -y - z;
        //     case 0xC: return  y + x;
        //     case 0xD: return -y + z;
        //     case 0xE: return  y - x;
        //     case 0xF: return -y - z;
        //     default: return 0; // never happens
        // }
    }
}

// hash lookup table as defined by Ken Perlin. This is a randomly arranged array of all numbers from 0-255 inclusive
ImprovedPerlin.shuffled256 = [151,160,137,91,90,15,
    131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
    190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
    88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
    77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
    102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
    135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
    5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
    223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
    129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
    251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
    49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
    138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

ImprovedPerlin.permutation = ImprovedPerlin.shuffled256.concat(ImprovedPerlin.shuffled256);
