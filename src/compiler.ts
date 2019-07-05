import ReactDOMServer from "react-dom/server"
import { isClass } from "./util"

interface Compiled {
  filename: string,
  html: string
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
        html: ReactDOMServer.renderToString(template.render(instance.data))
      }))
    } else {
      return [{
        filename: config && config.filename ? config.filename : basename,
        html: ReactDOMServer.renderToString(template.render())
      }]
    }
  } else {
    return [{
      filename: basename,
      html: ReactDOMServer.renderToString(page.default())
    }]
  }
}

export {
  genHTML
}