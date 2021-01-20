import React from 'react';
import Editor from '../../src/index';
import '../../src/Editor.css';
import '../../src/components/Toolbar.css';
import '../../src/components/ImageUpload.css';
import '../../src/components/LinkInput.css';
import 'react-image-crop/dist/ReactCrop.css';
import './App.css';

const App = () => {
  const [darkMode, setDarkmode] = React.useState(false);

  return (
    <div>
      <h1>Lego editor</h1>
      <label>
        Darkmode:
        <input
          type="checkbox"
          onChange={(e) => setDarkmode(e.target.checked)}
        />
      </label>
      <Editor
        darkMode={darkMode}
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
};

export default App;
