
# Noise

Experimenting with noise to generate terrain.

![](screenshot.png)

## Using it

Simply open `index.html` on browser. It defaults to loading map chunks in multi-thread mode. To disable it, set `App.workerCount` (check the constructor) to zero in `index.js`.

## How it works

Terrain is generated based on the improved Perlin noise algorithm. Noise is added in a fractal way and the user can adjust it by changing the number of octaves defined.

Terrain colors are selected according to elevation. A palette is defined in the CSS file, parsed and filled with a linear-interpolated gradient, contributing to finer detail. A bit of sauce is added to the palette: +/-5% uniformly distributed noise.

Normals are calculated for each terrain point and lighting is added based on that and considering current sun position.

To run the terrain generation, web workers can be used by setting `Threads` to something greater than zero in the control panel.
