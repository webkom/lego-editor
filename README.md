# lego-editor

![DroneCI](https://ci.abakus.no/api/badges/webkom/lego-editor/status.svg?branch=master) ![npm (scoped)](https://img.shields.io/npm/v/@webkom/lego-editor?style=flat-square)


> Work-in-progress editor for [lego-webapp](https://github.com/webkom/lego-webapp) written with [Slate.js](https://docs.slatejs.org) <img src="https://i.imgur.com/6zIQhYm.png" />

## Installation
- Add the package
  ```sh
  $ yarn add @webkom/lego-editor
  ```
- Import the component in your project
    ```JSX
    import Editor from '@webkom/lego-editor'
    // Add the stylesheets
    import '@webkom/lego-editor/dist/Editor.css'
    import '@webkom/lego-editor/dist/components/Toolbar.css'
    import '@webkom/lego-editor/dist/components/ImageUpload.css'
    // Also add the stylesheet from react-image-crop
    import 'react-image-crop/dist/ReactCrop.css'


    const YourComponent = () => (
      <div>
        <Editor placeholder="Let the words flow!">
      </div>
    )
    ```


## Example app
To test out the editor in using the developement application:
```sh
$ yarn example
```

## Development

#### Installing dependecies

```
$ yarn
```

#### Building the module

```
$ yarn build
```

#### Linting & formatting

To run linter & check formatting
```
$ yarn lint
```

Formatting with prettier
```
$ yarn prettier
```
