# lego-editor

![DroneCI](https://ci.abakus.no/api/badges/webkom/lego-editor/status.svg?branch=master) ![npm (scoped)](https://img.shields.io/npm/v/@webkom/lego-editor?style=flat-square)

> Work-in-progress editor for [lego-webapp](https://github.com/webkom/lego-webapp) written with [Slate.js](https://docs.slatejs.org)

<img src="https://i.imgur.com/6zIQhYm.png" />

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

## Extending the editor

Lego-editor uses [Slate.js](https://github.com/ianstormtaylor/slate) version [0.56](https://docs.slatejs.org/general/changelog#0-56-0-december-17-2019). You can therefore add any plugins as described in this version of Slate.
The `<Editor />` component accepts the prop `plugins`, which takes an array of plugins
(`plugins: (Editor => Editor)[]`).

## Example app

To test out the editor using the development application:

```sh
$ yarn dev
```

## Development

#### Installing dependencies

```sh
$ yarn
```

#### Building the module

```sh
$ yarn build
```

#### Linting & formatting

To run the linter & check formatting

```sh
$ yarn lint
```

Formatting with prettier

```sh
$ yarn prettier
```
