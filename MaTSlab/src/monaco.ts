import * as monaco from 'monaco-editor';
import { defs } from './globals.json';
import { react } from './react.json';

const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  model: null,
  language: 'typescript',
  theme: 'my-theme',
  scrollbar: {
    alwaysConsumeMouseWheel: false,
  },
};

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  target: monaco.languages.typescript.ScriptTarget.Latest,
  allowNonTsExtensions: true,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  esModuleInterop: true,
  jsx: monaco.languages.typescript.JsxEmit.React,
  reactNamespace: 'React',
  allowJs: true,
  typeRoots: ['node_modules/@types'],
  noImplicitAny: true,
  isolatedModules: true
});

monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: false,
  noSyntaxValidation: false,
});

monaco.languages.typescript.typescriptDefaults.addExtraLib(
  react,
  `file:///react/index.d.ts`,
);

monaco.editor.defineTheme('my-theme', {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#00000000',
  },
});

const globalModel = monaco.editor.createModel(defs, 'typescript');

export const addEditor = (ref: HTMLElement, cellName: string) => {
  const defModel = monaco.editor.createModel(``, 'typescript');

  const textModel = monaco.editor.createModel(
    ``,
    'typescript',
    monaco.Uri.parse(`file:///${cellName}.tsx`),
  );

  textModel.updateOptions({ tabSize: 2 });

  const e2 = monaco.editor.create(ref, editorOptions);

  e2.setModel(textModel);

  const tsWorker = monaco.languages.typescript
    .getTypeScriptWorker()
    .then(worker => worker(defModel.uri, textModel.uri, globalModel.uri));

  return { editor: e2, definitionModel: defModel, textModel, tsWorker };
};
