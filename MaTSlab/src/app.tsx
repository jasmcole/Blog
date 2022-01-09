import * as React from 'react';
import styled from 'styled-components';
import Inspector from 'react-inspector';
import { Cell } from './cell';
import { Figs, useFigs } from './use-figs';
import { Row, Col, Button, theme } from './style';
import * as globals from './globals-impl';
import { FigurePanes, Panes } from './figure-panes';
import LZUTF8 = require('lzutf8');
import { base64ToBytes, bytesToBase64 } from 'byte-base64';

const w = window as any;

Object.assign(w, globals);

interface CellState {
  cellName: string;
  onExecute?: () => Promise<void>;
  text: string;
  results?: unknown;
}

interface InitialState {
  cells: CellState[];
  // figs: Figs;
  panes: Panes;
}

const getStateFromURL = (): null | InitialState => {
  const { hash } = window.location;
  if (hash.length < 2) {
    return null;
  }
  try {
    const uint8Array = base64ToBytes(hash.slice(1));
    const uncompressed = JSON.parse(LZUTF8.decompress(uint8Array));
    return uncompressed;
  } catch (err) {
    return null;
  }
};

const saveStateToURL = (state: InitialState) => {
  const compressed = LZUTF8.compress(JSON.stringify(state));
  const base64 = bytesToBase64(compressed);
  window.location.hash = base64;
};

const initialState = getStateFromURL();

const defaultCells = [
  `import React from "./react";

// Plot some data
fig(1).plot([1,2,3], [4,5,6]);

// Log some output
console.log({ hello: 'There!' });

// Share variables
export const some = 'thing';

// Render React components
const Demo = () => {
    const [num, setNum] = React.useState(0);
    return <button onClick={() => setNum(n => n+1)}>
        Clicked {num} time(s)
    </button>
}
render(<Demo />);
export {};`,
  `// Use variables in other cells
export const thing2 = \`\${a.some}2\`;`,
  `import React from "./react";

// Add interactivity
const x = linspace(0, 10, 0.1);
const Sin = () => {
    const [f, setF] = React.useState(1);

    React.useEffect(() => {
        fig(2).plot(x, sin(x.mul(f)));
    }, [f]);

    return (
      <>
        <div>Change frequency</div>
        <input
          type="range"
          min={0.1}
          max={10}
          value={f}
          onChange={e => setF(Number(e.target.value))}
        />
      </>
    );
  }
  
  render(<Sin />);
  export {};`,
];

export const App: React.FC<{}> = () => {
  const [cells, setCells] = React.useState<CellState[]>(
    initialState?.cells ?? [
      { cellName: 'a', text: defaultCells[0] },
      { cellName: 'b', text: defaultCells[1] },
      { cellName: 'name_a_cell', text: defaultCells[2] },
    ],
  );

  const [didExecuteOnStart, setDidExecuteOnStart] = React.useState(false);

  const { figs, addFig, removeFig, setFigs } = useFigs(
    // {},
    initialState
      ? {}
      : {
          figs: [
            { figNum: 1, data: null, onAfterPlot: null },
            { figNum: 2, data: null, onAfterPlot: null },
          ],
        },
  );

  const [panes, setPanes] = React.useState<Panes>(
    initialState?.panes ?? {
      split: 'v',
      panes: [
        {
          frac: 0.5,
          pane: { split: 'v', panes: { figNums: [1], active: 1 } },
        },
        {
          frac: 0.5,
          pane: { split: 'v', panes: { figNums: [2], active: 2 } },
        },
      ],
    },
  );

  React.useEffect(() => {
    for (const { cellName, results } of cells) {
      w[cellName] = results;
    }
  }, [cells]);

  const onAddCell = React.useCallback(
    () =>
      setCells(c => [
        ...c,
        { cellName: String.fromCharCode(c.length + 97), text: '\nexport {};' },
      ]),
    [],
  );

  const onRemoveCell = React.useCallback(
    (cellName: string) =>
      setCells(c => c.filter(cc => cc.cellName !== cellName)),
    [],
  );

  const onRunAll = React.useCallback(async () => {
    console.log('Running all');
    for (const cell of cells) {
      const cellFunction = cell.onExecute;
      if (cellFunction) {
        console.log(`Running cell function for ${cell.cellName}`);
        await cellFunction();
      }
    }
  }, [cells]);

  React.useEffect(() => {
    if (didExecuteOnStart) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setDidExecuteOnStart(true);
      onRunAll();
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [onRunAll, didExecuteOnStart]);

  const onReportOnExecute = React.useCallback(
    (cellName: string, onExecute: () => Promise<void>) => {
      setCells(oldCells =>
        oldCells.map(oldCell =>
          oldCell.cellName === cellName ? { ...oldCell, onExecute } : oldCell,
        ),
      );
    },
    [],
  );

  const onUpdate = React.useCallback((cellName: string, results: unknown) => {
    setCells(oldCells =>
      oldCells.map(oldCell =>
        oldCell.cellName === cellName ? { ...oldCell, results } : oldCell,
      ),
    );
  }, []);

  const onClearAll = React.useCallback(() => {
    setCells([]);
    setFigs([]);
    setPanes({
      split: 'v',
      panes: [
        {
          frac: 1,
          pane: { split: 'v', panes: { figNums: [], active: null } },
        },
      ],
    });
  }, []);

  const onChangeCellContents = React.useCallback(
    (cellName: string, text: string) =>
      onChangeCellContentsWithSetter(cellName, text, setCells),
    [],
  );

  const cellComponents = React.useMemo(
    () =>
      cells.map((c, i) => (
        <Cell
          key={c.cellName}
          cellName={c.cellName}
          initialValue={c.text}
          onAddCell={onAddCell}
          onRemoveCell={onRemoveCell}
          onUpdate={onUpdate}
          onChangeCellName={newCellName =>
            newCellName.match(/\s/g)
              ? null
              : setCells(oldCells =>
                  oldCells.map(oldCell =>
                    oldCell.cellName === c.cellName
                      ? { ...oldCell, cellName: newCellName }
                      : oldCell,
                  ),
                )
          }
          onReportOnExecute={onReportOnExecute}
          onChangeCellContents={onChangeCellContents}
        />
      )),
    [cells, onAddCell, onRemoveCell],
  );

  // TODO - throttle
  React.useEffect(() => {
    saveStateToURL({ cells, panes });
  }, [cells, panes]);

  return (
    <Row
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'hidden',
        overflowX: 'hidden',
      }}
    >
      <Col style={{ flex: 0.5, overflowY: 'auto' }}>
        <Row>
          <Button onClick={onRunAll} style={{ marginLeft: 0, marginRight: 12 }}>
            <span>Execute all</span>
          </Button>
          <Button
            onClick={onClearAll}
            style={{ marginLeft: 0, marginRight: 12 }}
          >
            <span>Clear all</span>
          </Button>
        </Row>
        <VarHeader>Variables</VarHeader>
        {cells.map(c =>
          c.results &&
          typeof c.results === 'object' &&
          Object.keys(c.results).length > 0 ? (
            <CellVars>
              <span>{c.cellName}</span>
              <Inspector data={c.results} />
            </CellVars>
          ) : null,
        )}
      </Col>
      <Col style={{ overflowY: 'auto', overflowX: 'hidden', paddingRight: 15 }}>
        {cellComponents}
        <Button onClick={onAddCell}>
          <span>Add cell</span>
        </Button>
      </Col>
      <Col style={{ marginLeft: 15, height: '100%' }}>
        <FigurePanes
          figs={figs}
          panes={panes}
          addFig={addFig}
          removeFig={removeFig}
          onPanesChange={setPanes}
        />
      </Col>
    </Row>
  );
};

const VarHeader = styled.div`
  font-family: sans-serif;
  border-bottom: 1px solid ${theme.darkGrey};
  margin-bottom: 12px;
  padding-bottom: 4px;
  margin-right: 12px;
  margin-top: 16px;
`;

const CellVars = styled.div`
  padding-bottom: 12px;
  margin-bottom: 12px;
  margin-right: 12px;
  font-family: sans-serif;
  border-bottom: 1px solid ${theme.lightGrey};
`;

let timeout: number;
const onChangeCellContentsWithSetter = (
  cellName: string,
  text: string,
  setCells: (setter: (cells: CellState[]) => CellState[]) => void,
) => {
  if (timeout) {
    clearTimeout(timeout);
  }
  timeout = window.setTimeout(
    () =>
      setCells(oldCells =>
        oldCells.map(oldCell =>
          oldCell.cellName === cellName ? { ...oldCell, text } : oldCell,
        ),
      ),
    500,
  );
};
