const fs = require("fs");
const path = require("path");

const defs = fs.readFileSync(
  path.join(process.cwd(), "src", "globals.ts"),
  { encoding: "utf-8" });

const react = fs.readFileSync(
  path.join(process.cwd(), 'node_modules', '@types', 'react', 'index.d.ts'),
  'utf-8'
);

const globalsJSON = JSON.stringify({ defs });
const reactJSON = JSON.stringify({ react });

fs.writeFileSync(
  path.join(process.cwd(), "src", "globals.json"),
  globalsJSON
);

fs.writeFileSync(
  path.join(process.cwd(), "src", "react.json"),
  reactJSON
);