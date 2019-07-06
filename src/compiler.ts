import ReactDOMServer from "react-dom/server"
import { isClass } from "./util"
import { ReactElement } from "react";

interface Compiled {
  filename: string,
  html: string
}

function compile(data: ReactElement): string {
  return "<!DOCTYPE html>" + ReactDOMServer.renderToStaticMarkup(data)
}

function genHTML(component: string, data: any, basename: string): Compiled[] {
  const page = eval(component)
  if(isClass(page)) {
    const template = new page.default(data)
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
  } else {
    return [{
      filename: basename,
      html: compile(page.default(data))
    }]
  }
}

export {
  genHTML,
  Compiled
}