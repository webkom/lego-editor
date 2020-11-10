import React from 'react';
import Editor from '../../src/index';
import '../../src/Editor.css';
import '../../src/components/Toolbar.css';
import '../../src/components/ImageUpload.css';
import 'react-image-crop/dist/ReactCrop.css';
import './App.css';
import '../../src/components/LinkInput.css';

const App = () => (
  <div>
    <h1>Lego editor</h1>
    <Editor
      theme="light" // set do dark to enable dark-mode
      placeholder="Testing lego editor"
      imageUpload={(file) =>
        new Promise((resolve) =>
          setTimeout(() => {
            console.log(file);
            return resolve;
          }, 1000)
        )
      }
      onChange={(str) => {
        console.log(str);
      }}
    />
  </div>
);

export default App;
