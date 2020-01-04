import jsxs from "../src/index"
import fs from "fs"
import MemoryFileSystem from "memory-fs"
import { fs as mfs, vol } from 'memfs'
import { ufs } from "unionfs"
import path from "path"

///
/// this will spit out an error about not having a data entry, this is fine, if all the tests pass then it is good
///

const fileData = {
  "/site/Simple Functional Page.jsx": `export default () => <h1>hi</h1>`,
  "/site/Simple Class Page.jsx": `export default class extends React.Component {
    render() {
      return <h1>hi</h1>
    }
  }`,
  "/components/Hello.jsx": `export default props => <h1>hi</h1>`,
  "/site/Component Functional Page.jsx": `
    import Hello from "Hello.jsx"
    export default () => <Hello />
  `,
  "/site/Component Class Page.jsx": `
    import Hello from "Hello.jsx"
    export default class extends React.Component {
      render() {
        return <Hello />
      }
    }
  `,

}

vol.fromJSON(fileData)

const outputFs = new MemoryFileSystem()

beforeAll(() => 
  jsxs.build({
    inputFs: ufs.use(mfs).use(fs), // mfs for the site, fs for node_modules
    outputFs
  })  
)

jest.setTimeout(10000)

for(let file in fileData) {
  if(file.indexOf("/site/") === 0) {
    test(`${file} compiles successfully`, () => {
      expect(outputFs.data["build"][path.basename(file).replace(".jsx", ".html")].toString())
        .toBe("<!DOCTYPE html><h1>hi</h1>") // all of the pages defined in fileData should compile to this
    })
  }
}