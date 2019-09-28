import * as React from "react";
import Canvas from "./canvas";
import WebGLCanvas, { CircleCallback } from "./webgl-canvas";

interface AppState {
  callback: null | CircleCallback;
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
          reportUpdate={(callback: CircleCallback) =>
            this.setState({ callback })
          }
        />
      </div>
    );
  }
}

export default App;
