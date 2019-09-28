import * as React from "react";
import Canvas from "./canvas";
import WebGLCanvas, { SetPrimitives } from "./webgl-canvas";

interface AppState {
  callback: null | SetPrimitives;
}

class App extends React.Component<{}, AppState> {
  public readonly state: AppState = {
    callback: null
  };

  public render() {
    const { callback } = this.state;
    return (
      <div>
        <Canvas width={512} height={512} callback={callback} />
        <WebGLCanvas
          name="Something"
          reportUpdate={(callback: SetPrimitives) =>
            this.setState({ callback })
          }
        />
      </div>
    );
  }
}

export default App;
