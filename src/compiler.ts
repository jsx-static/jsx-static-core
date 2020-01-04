import React from "react"
import ReactDOMServer from "react-dom/server"
import { JsxsConfig } from "./config"
import { isReactClass } from "./util"

const DOCTYPE = "<!DOCTYPE html>"

export interface Compilation {
  html: string,
  filename: string
}

export function genHTML(config: JsxsConfig, filename: string, source: string, data: any): Compilation[] {
  const component = eval(source).default
  const page = isReactClass(component)
    ? (() => {
      const page = new component(data)
      return React.isValidElement(page) ? page : page.render()
      // return page.render()
    })()
    : component(data)

  if(React.isValidElement(page)) {
    const html = DOCTYPE + ReactDOMServer.renderToStaticMarkup(page)
    if(config.hooks && config.hooks.postProcess) return [{
      html: config.hooks.postProcess(html),
      filename
    }]
    else return [{
      html,
      filename
    }]
  } else {
    console.error(filename, "is not a valid react element")
    return [{
      html: "<h1>not a valid react element</h1>",
      filename
    }] //TODO: make a better error page
  }
}