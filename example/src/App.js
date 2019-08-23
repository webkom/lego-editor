import React from 'react';
import Editor from '../../dist/index.js';
import '../../dist/Editor.css';
import '../../dist/components/Toolbar.css';
import '../../dist/components/ImageUpload.css';
import 'react-image-crop/dist/ReactCrop.css';
import './App.css';

const App = () => (
  <div>
    <h1>Lego editor</h1>
    <Editor placeholder="Testing lego editor" />
  </div>
);

export default App;
