import React from "react"
import ReactDOMServer from "react-dom/server"
import { JsxsConfig } from "./config"
import { isReactClass } from "./util"

const DOCTYPE = "<!DOCTYPE html>"

export interface Compilation {
  html: string,
  filename: string
}

function getHTML(config: JsxsConfig, page: object, filename: string): string {
  if(React.isValidElement(page)) {
    const html = DOCTYPE + ReactDOMServer.renderToStaticMarkup(page)
    if(config.hooks && config.hooks.postProcess) return config.hooks.postProcess(html)
    else return html
  } else {
    console.error(filename, " is not a valid react element")
    return "<h1>not a valid react element</h1>" //TODO: make a better error page
  }
}

export function compilePage(config: JsxsConfig, filename: string, source: string, data: any): Compilation[] {
  const component = eval(source).default
  const isClass = isReactClass(component)

  if(isClass) {
    const page = new component(data)
    if(page.iterator) {
      const iteratorData = page.iterator()
      if(Array.isArray(iteratorData)) {
        return iteratorData.map(instanceData => ({
          html: getHTML(config, page.render(instanceData.data), instanceData.filename),
          filename: instanceData.filename
        }))
      } else {
        console.error(`(${ filename }) Data returned from \`iterator\` must be an array!`)
        return []
      }
    } else {
      return [{
        html: getHTML(config, new component(data).render(), filename),
        filename
      }]
    }
  } else {
    return [{
      html: getHTML(config, component(data), filename),
      filename
    }]
  } 
}