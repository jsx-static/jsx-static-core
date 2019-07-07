// the "file system" used for all tests
// all of these should be compiled into the same output:
const output = "<!DOCTYPE html><html>hi</html>"

export {
  output
}

export default {
  "/build/.keep": "keep",
  "/data/index.js": `
    module.exports = {
      testStr: "hi"
    }
  `,
  "/site/Simple Functional Page.jsx": "export default () => <html>hi</html>", // simple functional page no data
  "/site/Simple Functional Page with Data.jsx": "export default data => <html>{ data.testStr }</html>", // simple fimctional page with data,
  "/site/Simple Class Page.jsx": `
    export default class extends React.Component {
      render() {
        return <html>hi</html>
      }
    }
  `,
  "/site/Simple Class Page with Data.jsx": `
    export default class extends React.Component {
      constructor(props) {
        super(props)
      }
      render() {
        return <html>{ this.props.testStr }</html>
      }
    }
  `,
}