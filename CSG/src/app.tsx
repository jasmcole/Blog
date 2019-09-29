import * as React from "react";
import styled from "styled-components";
import Canvas, { Row, Column } from "./canvas";
import WebGLCanvas from "./webgl-canvas";
import { Primitive } from "./primitives";

export type SetPrimitives = (primitives: Primitive[]) => void;

export const Body = styled.div`
  font-family: sans-serif;
  padding-left: 10px;
  max-width: 800px;
`;

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
      <Column>
        <Row>
          <Body>
            <p>Click and drag to draw projections in the three planes below.</p>
            <p>
              'Filled in' areas are indicated in black, which are approximated
              by the rectangles drawn. Make the approximation more accurate at
              the expense of GPU rendering speed.
            </p>
            <p>To erase filled areas, click the 'Toggle paint/erase' button.</p>
            <p>To change the size of the brush, scroll up or down</p>
          </Body>
        </Row>
        <Row>
          <Canvas
            width={512}
            height={512}
            callback={callbacks.XY}
            title="x-y plane"
          />
          <Canvas
            width={512}
            height={512}
            callback={callbacks.YZ}
            title="y-z plane"
          />
          <Canvas
            width={512}
            height={512}
            callback={callbacks.XZ}
            title="x-z plane"
          />
        </Row>
        <WebGLCanvas
          name="Something"
          reportCallbacks={(callbacks: Callbacks3D) =>
            this.setState({
              callbacks
            })
          }
        />
      </Column>
    );
  }
}

export default App;
