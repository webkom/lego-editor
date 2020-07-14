# lego-editor

[![Build Status](https://ci.webkom.dev/api/badges/webkom/lego-editor/status.svg)](https://ci.webkom.dev/webkom/lego-editor) ![npm (scoped)](https://img.shields.io/npm/v/@webkom/lego-editor?style=flat-square) [![Dependabot](https://badgen.net/dependabot/webkom/lego-editor/?icon=dependabot)](https://github.com/webkom/lego-editor/pulls?q=is%3Aopen+is%3Apr+label%3Adependencies) ![Dependencies](https://badgen.net/david/dep/webkom/lego-editor/)

> Editor made for [lego-webapp](https://github.com/webkom/lego-webapp) written with [Slate.js](https://docs.slatejs.org)

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

## Props

| name          | Type                                  | Default | Description                                                                                                                                                                     |
| ------------- | ------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`       | `string`                              |         | The editors value/default value                                                                                                                                                 |
| `disabled`    | `Boolean`                             | `False` | Disables the ability to edit the content                                                                                                                                        |
| `simple`      | `Boolean`                             | `False` | Removes the toolbar.                                                                                                                                                            |
| `onChange`    | `string => void`                      |         | Handler called when the editor value changes. Takes the serialized value                                                                                                        |
| `onBlur`      | `event => void`                       |         | Handler called on blur                                                                                                                                                          |
| `onFocus`     | `event => void`                       |         | Handler called on focus                                                                                                                                                         |
| `autoFocus`   | `Boolean`                             | `False` | Enables autoFocus                                                                                                                                                               |
| `placeholder` | `string`                              |         | A placeholder shown when the editor is empty                                                                                                                                    |
| `imageUpload` | `Blob => Promise<Record<string,any>>` |         | A function for uploading images. Should contain `src` in the promise object.                                                                                                    |
| `plugins`     | `(Editor => Editor)[]`                |         | An array of plugins to load. The first plugin will be applied first (the last one will override any other plugins)                                                              |
| `domParser`   | `string => HTMLDocument`              |         | Custom function that the deserializer will use to parse the input value to a HTML document. Can be useful for environments where the browser API is not available, like Node.js |

> See type definitions for more detailed types

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
