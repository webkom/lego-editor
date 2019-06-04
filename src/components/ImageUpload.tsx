import * as React from "react";
import Dropzone from "react-dropzone";
import ReactCrop from "react-image-crop";

interface Crop {
  aspect?: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface Props {
  uploadFunction?: (image: Blob) => void;
}

interface Image {
  file: Blob;
  url: string;
}

interface State {
  hasImage: boolean;
  currentImage: Image | undefined;
  crop: Crop | undefined;
}

// TODO Allow for several images in one component
export default class ImageUpload extends React.Component<Props, State> {
  state = {
    hasImage: false,
    crop: undefined,
    currentImage: undefined,
  };

  onDrop = (files: Blob[]) => {
    if (files.length === 1) {
      const file = files[0];
      this.setState({
        currentImage: { file: file, url: URL.createObjectURL(file) },
      });
    }
  };

  handleCrop = (crop: Crop) => {
    this.setState({ crop });
  };

  render(): React.ReactNode {
    const { currentImage, crop } = this.state;

    return currentImage === undefined ? (
      <div>
        <Dropzone onDrop={this.onDrop} multiple={false}>
          {({ getRootProps, getInputProps }) => (
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <h4>Drop file here or click to select</h4>
            </div>
          )}
        </Dropzone>
      </div>
    ) : (
      <div>{/*<ReactCrop src={currentImage.url} onChange={this.handleCrop} crop={crop} />*/}</div>
    );
  }
}
