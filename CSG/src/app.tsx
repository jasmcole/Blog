import * as React from "react";
import Canvas from "./canvas";
import WebGLCanvas from "./webgl-canvas";
import { Primitive } from "./primitives";

export type SetPrimitives = (primitives: Primitive[]) => void;

export type Callbacks3D = {
  XY: SetPrimitives | null;
  YZ: SetPrimitives | null;
  XZ: SetPrimitives | null;
};

interface AppState {
  callbacks: Callbacks3D;
}

class App extends React.Component<{}, AppState> {
  public readonly state: AppState = {
    callbacks: { XY: null, YZ: null, XZ: null }
  };

  public render() {
    const { callbacks } = this.state;
    return (
      <div>
        <div style={{ display: "flex" }}>
          <Canvas width={512} height={512} callback={callbacks.XY} />
          <Canvas width={512} height={512} callback={callbacks.YZ} />
          <Canvas width={512} height={512} callback={callbacks.XZ} />
        </div>
        <WebGLCanvas
          name="Something"
          reportCallbacks={(callbacks: Callbacks3D) =>
            this.setState({
              callbacks
            })
          }
        />
      </div>
    );
  }
}

export default App;
