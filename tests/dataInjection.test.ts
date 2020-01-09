import jsxs from "../src/index"
import fs from "fs"
import MemoryFileSystem from "memory-fs"
import { fs as mfs, vol } from 'memfs'
import { ufs } from "unionfs"
import path from "path"

const fileData = {
  "/data/index.js": `global.jsxsData = { hello: "hi" }`,
  "/site/Data Functional Page.jsx": `export default props => <h1>{ props.hello }</h1>`,
  "/site/Data Class Page.jsx": `export default class DataPage extends React.Component {
    constructor(props) {
      super(props)
    }

    render() {
      return <h1>{ this.props.hello }</h1>
    }
  }`,
}

vol.fromJSON(fileData)

const outputFs = new MemoryFileSystem()

beforeAll(() => 
  jsxs.build({
    inputFs: ufs.use(mfs).use(fs), // mfs for the site, fs for node_modules
    outputFs,
    inRoot: "/",
    dataEntry: "index.js"
  })
)

jest.setTimeout(10000)

for(let file in fileData) {
  if(file.indexOf("/site/") === 0) {
    test(`${file} compiles successfully`, () => {
      expect(outputFs.data["build"][path.basename(file).replace(".jsx", ".html")].toString())
        .toBe("<!DOCTYPE html><h1>hi</h1>")
    })
  }
}