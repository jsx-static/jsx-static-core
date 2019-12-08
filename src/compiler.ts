import React from "react"
import ReactDOMServer from "react-dom/server"
import { ReactElement } from "react"
import path from "path"

import { isClass } from "./util"
import { getPath, setRoot, setPostProcess, postProcess } from "./util/file"
import { defaultBuildConfig, genWebpackConfig, getConfig, BuildConfig } from "./config"

interface Compiled {
  filename: string,
  html: string
}

interface FileOutput {
  source: string,
  name: string
}

function compile(data: ReactElement): string {
  return "<!DOCTYPE html>" + ReactDOMServer.renderToStaticMarkup(data)
}

function genHTML(component: string, data: any, basename: string): Compiled[] {
  const page = eval(component)
  console.log(page)
  if (isClass(page)) {
    console.log("is class")
    const template = new page(data)
    if(React.isValidElement(template)) {
      return [{
        filename: basename,
        html: compile(page(data))
      }]
    } else {
      const iterator = template.iterator && template.iterator()
      const config = template.config && template.config()
      if(iterator) {
        return iterator.map((instance: any) => ({
          filename: instance.filename,
          html: compile(template.render(instance.data))
        }))
      } else {
        return [{
          filename: (config && config.filename) ? config.filename : basename,
          html: compile(template.render())
        }]
      }
    }
  } else {
    return [{
      filename: basename,
      html: compile(page(data))
    }]
  }
}

function writeFiles(files: FileOutput[], config: BuildConfig, data: any) {
  for (let i = 0; i < files.length; i++) {
    const compiled = eval(files[i].source)
    const outFile = path.basename(files[i].name).replace(".jsx", ".html")
    console.log(outFile)
    const compiledPages = genHTML(compiled, data, outFile)
    for (let i = 0; i < compiledPages.length; i++) {
      console.log(compiledPages[i])
      config.fs.writeFileSync(getPath(path.join(config.outputDir, compiledPages[i].filename)), compiledPages[i].html)
    }
  }
}

export {
  genHTML,
  Compiled,
  writeFiles,
  FileOutput
}