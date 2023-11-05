import React, { useState } from 'react';
import Editor from '../../src/index';
import '../../src/Editor.css';
import '../../src/components/Toolbar.css';
import '../../src/components/ImageUpload.css';
import '../../src/components/LinkInput.css';
import 'react-image-crop/dist/ReactCrop.css';
import './App.css';

const App = () => {
  const [darkMode, setDarkmode] = useState(false);

  const handleDarkModeToggle = (e) => {
    const isChecked = e.target.checked;
    setDarkmode(isChecked);
    document.documentElement.setAttribute(
      'data-theme',
      isChecked ? 'dark' : 'light'
    );
  };

  return (
    <div>
      <h1>Lego editor</h1>
      <label>
        Darkmode:
        <input
          type="checkbox"
          checked={darkMode}
          onChange={handleDarkModeToggle}
        />
      </label>
      <Editor
        darkMode={darkMode}
        placeholder="Testing lego editor"
        imageUpload={(file) =>
          new Promise((resolve) => {
            resolve({ src: null });
          })
        }
      />
    </div>
  );
};

export default App;
