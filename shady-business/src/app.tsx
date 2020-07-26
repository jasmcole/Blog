import * as React from "react";
import styled from "styled-components";
import Artboard, { ArtboardPosition } from "./artboard";
import {
  calculate,
  calculateDay,
  SunParams,
  calculateYear,
  AverageParams,
} from "./calculate";
import RectEditor from "./rect-editor";
import { Row, Column, Button, Title } from "./style";
import SunEditor from "./sun-editor";
import AvEditor from "./average-editor";
import { makeRect } from "./rect";
import { Shape } from "./shapes";
import { makeImage } from "./image";
import DraggableArtboard from "./draggable-artboard";
import { makeHouse } from "./house";
import HouseEditor from "./house-editor";
import { FluxBuffer } from "./flux-buffer";
import { Grow } from "./grow";
import ZoomableArtboard from "./zoomable-artboard";

const AppOuter = styled(Row)`
  font-family: "Helvetica", sans-serif;
`;

let initialShapes: Shape[] | null = null;

try {
  // lol
  initialShapes = JSON.parse(atob(window.location.href.split("shapes=")[1]));
} catch (err) {}

let defaultArtboardPosition: ArtboardPosition = {
  pixelSize: { width: 100, height: 100 },
  offset: { x: 0, y: 0 },
  unitsPerPixel: 0.05,
};

const App: React.FC<{}> = () => {
  const [firstRender, setFirstRender] = React.useState(false);

  const [artboardPosition, setArtboardPosition] = React.useState<
    ArtboardPosition
  >(defaultArtboardPosition);

  const [shapes, setShapes] = React.useState<Shape[]>(
    initialShapes || [makeRect()]
  );

  const [active, setActive] = React.useState<number | null>(
    shapes[0]?.id || null
  );

  const [sunParams, setSunParams] = React.useState<SunParams>({
    day_of_year: 180,
    hour_of_day: 10,
    min_of_hour: 0,
    sec_of_min: 0,
    lat_deg: 51,
    long_deg: 0,
  });

  const onChangeShape = React.useCallback(
    (newShape: Partial<Shape>, shape: Shape) => {
      setShapes((oldShapes) => {
        const newShapes = oldShapes.map((oldShape) =>
          oldShape.id === shape.id ? { ...oldShape, ...newShape } : oldShape
        ) as Shape[];

        updateURL(newShapes);

        return newShapes;
      });
    },
    [sunParams]
  );

  const onSelect = React.useCallback((shape: Shape) => {
    setActive(shape.id);
  }, []);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const accCanvasRef = React.useRef<HTMLCanvasElement>(null);

  const activeShape = shapes.find((s) => s.id === active);

  const [progress, setProgress] = React.useState<{
    fractionDone: number;
    result: FluxBuffer | null;
  }>({ fractionDone: 0, result: null });

  const [avParams, setAvParams] = React.useState<AverageParams>({
    colormap: "spectral",
    numIter: 250,
    resolutionScale: 0.5,
    scale: "linear",
    plotType: "flux",
  });

  React.useEffect(() => {
    if (!firstRender && canvasRef.current) {
      try {
        calculate(
          canvasRef.current,
          shapes,
          sunParams,
          artboardPosition,
          avParams
        );
        setFirstRender(true);
      } catch (err) {
        // ...
      }
    }
  }, [firstRender]);

  const clearSim = React.useCallback(() => {
    progress.result?.clear();
  }, [progress.result]);

  const plotSim = React.useCallback(
    (params: AverageParams) => {
      progress.result?.plot(params);
    },
    [progress.result]
  );

  const onProgress = React.useCallback(
    (params: { fractionDone: number; result: FluxBuffer }) => {
      setProgress(params);
      params.result.plot(avParams);
    },
    []
  );

  const download = React.useCallback(
    (fileName?: string) => {
      if (!accCanvasRef.current) {
        return;
      }
      const link = document.createElement("a");
      link.download = fileName + ".png";
      accCanvasRef.current.toBlob((blob) => {
        link.href = URL.createObjectURL(blob);
        link.click();
      });
    },
    [accCanvasRef.current]
  );

  try {
    canvasRef.current &&
      calculate(
        canvasRef.current,
        shapes,
        sunParams,
        artboardPosition,
        avParams
      );
  } catch (err) {
    console.warn(err);
  }

  const nonImages = shapes.filter((s) => s.type !== "image");
  const images = shapes.filter((s) => s.type === "image");

  return (
    <AppOuter style={{ height: "calc(100% - 10px)" }}>
      <Row style={{ flexGrow: 1, height: "100%" }}>
        <Column style={{ flexGrow: 1, height: "100%" }}>
          <Grow
            onResize={(bounds) => {
              setArtboardPosition({
                ...artboardPosition,
                pixelSize: { width: bounds.width, height: bounds.height },
              });
            }}
            onMouseDown={() => setActive(null)}
          >
            <ZoomableArtboard
              position={artboardPosition}
              setArtboardPosition={(x) => {
                clearSim();
                setArtboardPosition(x);
              }}
            >
              <DraggableArtboard
                position={artboardPosition}
                setArtboardPosition={(x) => {
                  clearSim();
                  setArtboardPosition(x);
                }}
              />
              <Artboard
                activeShape={activeShape}
                position={artboardPosition}
                shapes={images}
                onChangeShape={(...args) => {
                  clearSim();
                  onChangeShape(...args);
                }}
                onSelect={onSelect}
              />
              <canvas
                ref={canvasRef}
                style={{
                  width: artboardPosition.pixelSize.width,
                  height: artboardPosition.pixelSize.height,
                  position: "absolute",
                  pointerEvents: "none",
                  opacity: 0.5,
                }}
                width={Math.round(
                  artboardPosition.pixelSize.width * avParams.resolutionScale
                )}
                height={Math.round(
                  artboardPosition.pixelSize.height * avParams.resolutionScale
                )}
              />
              <canvas
                ref={accCanvasRef}
                style={{
                  width: artboardPosition.pixelSize.width,
                  height: artboardPosition.pixelSize.height,
                  position: "absolute",
                  pointerEvents: "none",
                }}
                width={Math.round(
                  artboardPosition.pixelSize.width * avParams.resolutionScale
                )}
                height={Math.round(
                  artboardPosition.pixelSize.height * avParams.resolutionScale
                )}
              />
              <Artboard
                activeShape={activeShape}
                position={artboardPosition}
                shapes={nonImages}
                onChangeShape={(...args) => {
                  clearSim();
                  onChangeShape(...args);
                }}
                onSelect={onSelect}
              />
              {progress.fractionDone > 0 ? (
                <progress
                  value={progress.fractionDone}
                  style={{ position: "absolute", bottom: 10, right: 10 }}
                />
              ) : null}
              <Button
                style={{ position: "absolute", bottom: 10, left: 10 }}
                onClick={() => {
                  const newShapes = [makeRect()];
                  setShapes(newShapes);
                  setArtboardPosition({
                    ...artboardPosition,
                    offset: { x: 0, y: 0 },
                  });
                  clearSim();
                  updateURL(newShapes);
                }}
              >
                Reset
              </Button>
            </ZoomableArtboard>
          </Grow>
        </Column>

        <Column
          style={{ marginLeft: 20, overflowY: "auto" }}
          onWheel={(e) => {
            e.stopPropagation();
          }}
        >
          <Title>Sun position</Title>
          <SunEditor
            sunParams={sunParams}
            onUpdate={(x) => {
              clearSim();
              setSunParams(x);
            }}
          />
          <Title>Simulation</Title>

          <Row>
            <Button
              onClick={() => {
                setActive(null);
                canvasRef.current &&
                  accCanvasRef.current &&
                  calculateDay(
                    canvasRef.current,
                    accCanvasRef.current,
                    shapes,
                    sunParams,
                    avParams,
                    artboardPosition,
                    onProgress
                  );
              }}
            >
              Average over day
            </Button>
            <Button
              onClick={() => {
                setActive(null);
                canvasRef.current &&
                  accCanvasRef.current &&
                  calculateYear(
                    canvasRef.current,
                    accCanvasRef.current,
                    shapes,
                    sunParams,
                    avParams,
                    artboardPosition,
                    onProgress
                  );
              }}
            >
              Average over year
            </Button>
            {progress.result && (
              <Button
                onClick={() => {
                  download("Simulation");
                }}
              >
                Download
              </Button>
            )}
            <Button
              onClick={() => {
                clearSim();
              }}
            >
              Clear
            </Button>
          </Row>
          <AvEditor
            avParams={avParams}
            onUpdate={(newParams) => {
              if (newParams.resolutionScale !== avParams.resolutionScale) {
                clearSim();
              } else {
                plotSim(newParams);
              }
              setAvParams(newParams);
            }}
          />

          <Title>Objects</Title>
          <Row>
            <Buttons
              setArtboardPosition={setArtboardPosition}
              setShapes={setShapes}
            />
          </Row>
          {activeShape && activeShape.type === "rect" ? (
            <RectEditor
              rect={activeShape}
              onUpdate={(rect) =>
                setShapes((prev) =>
                  prev.map((p) => (p.id === rect.id ? rect : p))
                )
              }
            />
          ) : activeShape && activeShape.type === "house" ? (
            <HouseEditor
              house={activeShape}
              onUpdate={(house) =>
                setShapes((prev) =>
                  prev.map((p) => (p.id === house.id ? house : p))
                )
              }
            />
          ) : null}
          {activeShape ? (
            <Row>
              <ShapeButtons activeShape={activeShape} setShapes={setShapes} />
            </Row>
          ) : null}
        </Column>
      </Row>
    </AppOuter>
  );
};

export default App;

type Setter<T> = (param: T | ((update: T) => void)) => void;

const Buttons: React.FC<{
  setArtboardPosition: Setter<ArtboardPosition>;
  setShapes: Setter<Shape[]>;
}> = ({ setArtboardPosition, setShapes }) => (
  <>
    <Button
      onClick={() =>
        setShapes((oldShapes) => {
          const newShapes = [...oldShapes, makeRect()];
          updateURL(newShapes);
          return newShapes;
        })
      }
    >
      Add rectangle
    </Button>
    <Button
      onClick={() =>
        setShapes((oldShapes) => {
          const newShapes = [...oldShapes, makeHouse()];
          updateURL(newShapes);
          return newShapes;
        })
      }
    >
      Add house
    </Button>
    <Button
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file";
        input.style.cssText = "display:none;";
        document.body.appendChild(input);
        const onchange: HTMLInputElement["onchange"] = (event: any) => {
          if (
            event &&
            event.target &&
            event.target.files &&
            event.target.files[0]
          ) {
            const file = event.target.files[0];
            const src = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
              const divisor = 10 / Math.max(img.width, img.height);

              setShapes((oldShapes) => {
                const newShapes = [
                  ...oldShapes,
                  makeImage(src, img.width * divisor, img.height * divisor),
                ];
                updateURL(newShapes);
                return newShapes;
              });
            };
            img.src = src;
            document.body.removeChild(input);
          }
        };
        input.onchange = onchange;
        input.click();
      }}
    >
      Upload image
    </Button>
  </>
);

const ShapeButtons: React.FC<{
  activeShape: Shape;
  setShapes: Setter<Shape[]>;
}> = ({ activeShape, setShapes }) => (
  <>
    <Button
      onClick={() => {
        if (!activeShape) {
          return;
        }
        setShapes((oldShapes) => {
          const newShapes = [
            ...oldShapes,
            { ...activeShape, id: makeRect().id },
          ];
          updateURL(newShapes);
          return newShapes;
        });
      }}
    >
      Duplicate
    </Button>
    <Button
      onClick={() => {
        if (!activeShape) {
          return;
        }
        setShapes((oldShapes) => {
          const newShapes = oldShapes.filter((s) => s.id !== activeShape.id);
          updateURL(newShapes);
          return newShapes;
        });
      }}
    >
      Delete
    </Button>
  </>
);

const debounce = <T,>(
  fun: (...args: T[]) => void,
  interval: number = 500
): ((...args: T[]) => void) => {
  let timeout: number | null = null;

  return (...args: T[]) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      fun(...args);
    }, interval);
  };
};

const updateURL = debounce((shapes: Shape[]) => {
  const path =
    window.location.origin +
    window.location.pathname +
    `?shapes=${btoa(JSON.stringify(shapes))}`;

  window.history.replaceState({ path }, "", path);
});
