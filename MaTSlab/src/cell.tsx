import * as React from 'react';
import * as monaco from 'monaco-editor';
import { addEditor } from './monaco';
import styled from 'styled-components';
import { Button, ButtonCommand, RowV, theme } from './style';
import { LogEntry, LogOutput } from './log-output';

window.React = React;
const w = window as any;

const CellOuter = styled.div`
  border: 1px solid ${theme.darkGrey};
  background: ${theme.veryLightGrey};
  border-radius: 4px;
  padding: 8px;
  padding-left: 0px;
  font-family: sans-serif;
  margin-bottom: 20px;
  position: relative;
  transition: 200ms ease-out;

  ${ButtonCommand} {
    color: ${theme.darkGrey};
  }

  &:focus-within {
    border: 1px solid rgb(148, 148, 254);
    background: rgba(148, 148, 254, 0.02);

    ${ButtonCommand} {
      color: gray;
    }
  }
`;

const Title = styled.input`
  flex: 1;
  margin-left: 18px;
  margin-right: 15px;
  padding-top: 6px;
  padding-bottom: 6px;
  padding-right: 0;
  border: none;
  border-bottom: 1px solid ${theme.darkGrey};
  background: none;
  transition: 200ms ease-out;

  &:hover {
    border-bottom: 1px solid rgb(148, 148, 254);
  }
`;

const RenderOutput = styled.div`
  padding-left: 8px;
`;

const LogOutputOuter = styled.div`
  padding-left: 8px;
`;

export const Cell: React.FC<{
  cellName: string;
  initialValue: string;
  onUpdate: (cellName: string, results: any) => void;
  onChangeCellName: (cellName: string) => void;
  onAddCell: () => void;
  onRemoveCell: (cellName: string) => void;
  onReportOnExecute: (cellName: string, onExecute: () => Promise<void>) => void;
  onChangeCellContents: (cellName: string, text: string) => void;
  reportedOnExecute?: () => Promise<void>;
}> = ({
  cellName,
  initialValue,
  onUpdate,
  onChangeCellName,
  onAddCell,
  onRemoveCell,
  onReportOnExecute,
  onChangeCellContents,
  reportedOnExecute,
}) => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [output, setOutput] = React.useState<LogEntry[]>([]);
  const [showOutput, setShowOutput] = React.useState(true);
  const [toRender, setToRender] = React.useState<any[]>([]);
  const [height, setHeight] = React.useState(200);
  const [tempCellName, setTempCellName] = React.useState(cellName);

  const [didInit, setDidInit] = React.useState(false);
  const [
    e1,
    setE1,
  ] = React.useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [defs, setDefs] = React.useState<monaco.editor.ITextModel | null>(null);
  const [
    textModel,
    setTextModel,
  ] = React.useState<monaco.editor.ITextModel | null>(null);
  const [
    tsWorker,
    setTSWorker,
  ] = React.useState<Promise<monaco.languages.typescript.TypeScriptWorker> | null>(
    null,
  );

  React.useEffect(() => {
    if (e1) {
      e1.onDidChangeModelContent(e => {
        onChangeCellContents(cellName, e1.getValue());
        setHeight(getHeight(e1.getValue()));
      });
    }
  }, [e1, onChangeCellContents, cellName]);

  React.useEffect(() => {
    if (e1) {
      const onResize = () => e1.layout();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
  }, [e1]);

  React.useEffect(() => {
    if (ref.current && !didInit) {
      const { editor, definitionModel, textModel, tsWorker } = addEditor(
        ref.current,
        cellName,
      );
      setE1(editor);
      setTSWorker(tsWorker);
      setDefs(definitionModel);
      setTextModel(textModel);
      setDidInit(true);
      editor.setValue(initialValue);
      setHeight(getHeight(initialValue));
    }
  }, [ref.current, didInit]);

  React.useEffect(() => {
    e1?.layout();
  }, [height, e1]);

  const updateTS = React.useCallback(async () => {
    if (!(e1 && defs && tsWorker)) {
      return { js: '', ts: '' };
    }
    const worker = await tsWorker;
    const transpiled = await worker.getEmitOutput(
      e1.getModel()!.uri.toString(),
    );

    const text = transpiled.outputFiles[0].text;
    const constMatches = getMatches(text, findConstants);
    const constMatchNames = constMatches.map(m => m[2]);
    const dynamicMatches = ([] as string[]).concat(
      ...getMatches(text, findDynamics).map(m =>
        m[1].split(',').map(s => s.trim()),
      ),
    );
    const exportedNames = [...new Set([...constMatchNames, ...dynamicMatches])];
    const jsWithoutExportsImports = text
      .split('\n')
      .map(line =>
        line.startsWith('export default') ||
        line.startsWith('export {') ||
        line.startsWith('import ')
          ? ''
          : line.replace(/^export\s+/g, ''),
      )
      .join('\n');

    const tsWithoutExports = e1
      .getValue()
      .split('\n')
      .map(line =>
        line.startsWith('export default') ||
        line.startsWith('export {') ||
        line.match(/^\s*import\s+/)
          ? ''
          : line.replace(/^export\s+/g, ''),
      )
      .join('\n');

    const jsWithReturn = `
const func = (console, render) => {
  ${jsWithoutExportsImports}
  return { ${exportedNames.join(', ')} };
};
return func({ log: window.logger['${cellName}'] }, window.render['${cellName}']);
`;

    const tsWithReturn = `const ${cellName} = (() => {
  ${tsWithoutExports}
  return { ${exportedNames.join(', ')} };
})();
`;
    defs.setValue(tsWithReturn);
    // console.log('TS WITH RETURN:', tsWithReturn);
    return { js: jsWithReturn, ts: tsWithReturn };
  }, [e1, defs, tsWorker, cellName]);

  const onExecute = React.useCallback(async () => {
    const { js, ts } = await updateTS();

    if (!w.logger) {
      w.logger = {};
    }
    w.logger[cellName] = (...args: any[]) =>
      setOutput(o => [
        ...o,
        { timestamp: new Date(), payload: args, type: 'info' },
      ]);
    if (!w.render) {
      w.render = {};
    }
    const thisRender: any[] = [];
    w.render[cellName] = (...args: any[]) => thisRender.push(...args);
    try {
      // console.log('JS', js);
      const func = new Function(js);
      const results = func();
      onUpdate(cellName, results);
      setToRender(thisRender);
    } catch (err) {
      // console.log(err);
      setOutput(o => [
        ...o,
        { timestamp: new Date(), payload: [err], type: 'error' },
      ]);
    }
  }, [updateTS, onUpdate, cellName]);

  React.useEffect(() => {
    if (reportedOnExecute !== onExecute) {
      onReportOnExecute(cellName, onExecute);
    }
  }, [onExecute, onReportOnExecute, reportedOnExecute, cellName]);

  React.useEffect(() => {
    if (e1) {
      e1.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onExecute);
      e1.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_D, () =>
        onRemoveCell(cellName),
      );
    }
  }, [e1, onExecute, onAddCell, onRemoveCell, cellName]);

  React.useEffect(() => {
    updateTS();
  }, [cellName]);

  return (
    <>
      <CellOuter>
        <RowV style={{ marginBottom: 8 }}>
          <Title
            value={tempCellName}
            onChange={e => setTempCellName(e.target.value)}
            onBlur={() => setTempCellName(cellName)}
            onKeyDown={e =>
              e.key === 'Enter' ? onChangeCellName(tempCellName) : null
            }
          />
          <Button onClick={onExecute}>
            <span>Execute</span>
            <ButtonCommand>⌘ + ↵</ButtonCommand>
          </Button>
          <Button onClick={() => onRemoveCell(cellName)}>
            <span>Delete</span>
            <ButtonCommand>⌘ + d</ButtonCommand>
          </Button>
        </RowV>
        <div
          ref={r => (ref.current = r)}
          style={{ height, transform: 'translateX(-10px)' }}
        />
        {toRender.length ? (
          <RenderOutput>
            <LogOutputToolbar>
              <span style={{ flexGrow: 1 }}>Rendered</span>
              <LogOutputButton title="Clear" onClick={() => setToRender([])}>
                ×
              </LogOutputButton>
            </LogOutputToolbar>
            {toRender.map((c, i) => (
              <React.Fragment key={i}>{c}</React.Fragment>
            ))}
          </RenderOutput>
        ) : null}
        {output.length ? (
          <LogOutputOuter>
            <LogOutputToolbar>
              <span style={{ flexGrow: 1 }}>Console</span>
              <LogOutputButton
                style={{ paddingTop: 2 }}
                title="Expand/collapse"
                onClick={() => setShowOutput(!showOutput)}
              >
                ↕
              </LogOutputButton>
              <LogOutputButton
                title="Clear"
                onClick={() => {
                  setOutput([]);
                  setShowOutput(true);
                }}
              >
                ×
              </LogOutputButton>
            </LogOutputToolbar>
            {showOutput ? output.map(o => <LogOutput {...o} />) : null}
          </LogOutputOuter>
        ) : null}
      </CellOuter>
      {defs && textModel && (
        <ModelDisposer defModel={defs} textModel={textModel} />
      )}
    </>
  );
};

const ModelDisposer: React.FC<{
  defModel: monaco.editor.ITextModel;
  textModel: monaco.editor.ITextModel;
}> = ({ defModel, textModel }) => {
  React.useEffect(() => {
    return () => {
      textModel.dispose();
      defModel.dispose();
    };
  }, []);

  return null;
};

const LogOutputToolbar = styled(RowV)`
  font-size: 12px;
  margin-top: 8px;
  margin-bottom: 6px;
  border-bottom: 1px solid ${theme.darkGrey};
  height: 20px;
  padding-right: 6px;
`;

const LogOutputButton = styled(RowV)`
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  margin-left: 12px;

  &:hover {
    color: ${theme.primary};
  }
`;

// https://github.com/stackblitz/monaco-auto-import/blob/master/src/parser/regex.ts
const findConstants = /export[ \t\n]+(?:declare[ \t\n]+)?(const +enum|default|class|interface|let|var|const|enum|type|function)[ \t\n]+([^=\n\t (:;<]+)/g;
const findDynamics = /export +{([^}]+)}/g;
const getMatches = (string: string, regex: RegExp) => {
  const matches = [];
  let match;
  while ((match = regex.exec(string))) {
    matches.push(match);
  }
  return matches;
};

const getHeight = (text: string): number => (text.split('\n').length + 1) * 19;