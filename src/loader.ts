import path from "path"
import { genHTML } from "./compiler"
import { getOptions } from 'loader-utils'

export default function(source: string) {
  // getOptions()
  // @ts-ignore // outputFileSystem.data is not a thing except it is because mf
  // console.log("sauce: ", source)
  const compiled = eval(source)
  const outFile = path.basename(this.resourcePath).replace(".jsx", ".html")
  //TODO: should be data
  const compiledPages = genHTML(compiled, {}, outFile)
  for (let i = 0; i < compiledPages.length - 1; i++) {
    this.emitFile(compiledPages[i].filename, compiledPages[i].html)
  }

  return compiledPages[compiledPages.length - 1].html 
}