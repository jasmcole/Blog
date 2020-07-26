import { projectViridis, projectSpectral } from "./colormaps";
import { AverageParams } from "./calculate";

export class FluxBuffer {
  private flux: Float64Array;
  private time: Float64Array;
  private maxFlux: number = 0;
  private maxTime: number = 0;

  constructor(
    private size: { width: number; height: number },
    private resolutionScale: number,
    private context: CanvasRenderingContext2D
  ) {
    this.flux = new Float64Array(size.width * size.height);
    this.time = new Float64Array(size.width * size.height);
  }

  public accumulate(shadowMap: ImageData, fromHorizon: number) {
    if (
      shadowMap.width !== this.size.width ||
      shadowMap.height !== this.size.height
    ) {
      console.error(`Cannot accumulate shadowMap of inconsistent dimensions`);
    }
    const flux = Math.sin((fromHorizon * Math.PI) / 180);
    this.maxFlux += flux;
    this.maxTime += 1;

    for (let i = 0; i < this.size.height; i += 1) {
      for (let j = 0; j < this.size.width; j += 1) {
        const ourInd = i * this.size.width + j;
        const theirInd = ourInd * 4;
        const a = shadowMap.data[theirInd + 3];

        // Cheeky colorbar
        if (j > this.size.width - 40 * this.resolutionScale) {
          this.flux[ourInd] += (1 - i / this.size.height) * flux;
          this.time[ourInd] += 1 - i / this.size.height;
          continue;
        }

        // If the pixel has a === 255, a shadow has been drawn
        if (a < 255) {
          this.flux[ourInd] += flux;
          this.time[ourInd] += 1;
        }
      }
    }
  }

  public toImageData(params: AverageParams) {
    const imageBuffer = new Uint8ClampedArray(
      this.size.width * this.size.height * 4
    );
    const colormap =
      params.colormap === "viridis" ? projectViridis : projectSpectral;
    for (let i = 0; i < this.size.width * this.size.height; i++) {
      const ratio =
        params.plotType === "time"
          ? this.time[i] / this.maxTime
          : this.flux[i] / this.maxFlux;
      const color = colormap(ratio);
      imageBuffer[i * 4] = color[0] * 255;
      imageBuffer[i * 4 + 1] = color[1] * 255;
      imageBuffer[i * 4 + 2] = color[2] * 255;
      imageBuffer[i * 4 + 3] = 255; // Opaque
    }
    const imageData = new ImageData(
      imageBuffer,
      this.size.width,
      this.size.height
    );
    return imageData;
  }

  public plot(params: AverageParams) {
    requestAnimationFrame(() =>
      this.context.putImageData(this.toImageData(params), 0, 0)
    );
  }

  public clear() {
    this.context.clearRect(0, 0, this.size.width, this.size.height);
  }
}
