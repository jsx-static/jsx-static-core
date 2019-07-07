import React from "react"
import ReactDOMServer from "react-dom/server"
import { ReactElement } from "react"

import { isClass } from "./util"


interface Compiled {
  filename: string,
  html: string
}

function compile(data: ReactElement): string {
  return "<!DOCTYPE html>" + ReactDOMServer.renderToStaticMarkup(data)
}

function genHTML(component: string, data: any, basename: string): Compiled[] {
  const page = eval(component)
    const template = new page.default(data)
    if(React.isValidElement(template)) {
      return [{
        filename: basename,
        html: compile(page.default(data))
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
          filename: config && config.filename ? config.filename : basename,
          html: compile(template.render())
        }]
      }
    }
}

export {
  genHTML,
  Compiled
}