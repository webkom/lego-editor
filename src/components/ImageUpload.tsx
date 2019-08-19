import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import cropImage from '../utils/cropImage';

interface Props {
  uploadFunction?: (image: Blob) => void;
  cancel: () => void;
}

interface Image {
  file: Blob;
  url: string;
}

interface State {
  hasImage: boolean;
  currentImage?: Image;
  crop?: Crop;
  imageWidth?: number;
  imageHeight?: number;
}

interface ImageDropProps {
  onDrop: (images: File[]) => void;
}

const ImageDrop: React.StatelessComponent<ImageDropProps> = (props: ImageDropProps) => {
  const { onDrop } = props;
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="_legoEditor_imageUploader_dropZone" {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive ? <h4>Drop files here...</h4> : <h4>Click to select or drop files here</h4>}
    </div>
  );
};

// TODO Allow for several images in one component
export default class ImageUpload extends React.Component<Props, State> {
  state = {
    hasImage: false,
    currentImage: undefined,
    crop: undefined,
    imageWidth: undefined,
    imageHeight: undefined,
  };

  onDrop = (files: Blob[]) => {
    if (files.length === 1) {
      const file = files[0];
      this.setState({
        currentImage: { file: file, url: URL.createObjectURL(file) },
      });
    }
  };

  onImageLoaded = (image: HTMLImageElement) => {
    this.setState({
      crop: { x: 0, y: 0, width: image.width, height: image.height },
      imageWidth: image.width,
      imageHeight: image.height,
    });
    return false;
  };

  handleCrop = (crop: Crop) => {
    this.setState({ crop });
  };

  submitImage = () => {
    //@ts-ignore
    const { url } = this.state.currentImage;
    const { crop } = this.state;
    const image = new Image(this.state.imageWidth, this.state.imageHeight);
    image.src = url;

    if (crop) {
      if (this.props.uploadFunction) {
        cropImage(image, crop, 'croppedImage').then((result: Blob) => {
          this.props.uploadFunction(result);
        });
      }
    }
  };

  cancel = () => {
    this.props.cancel();
  };

  render(): React.ReactNode {
    const { currentImage, crop } = this.state;

    return (
      <div className="_legoEditor_imageUploader_wrapper">
        <div className="_legoEditor_imageUploader_root">
          {!currentImage ? (
            <div>
              <ImageDrop onDrop={this.onDrop} />
            </div>
          ) : (
            <div className="_legoEditor_imageUploader_crop_container">
              <ReactCrop
                src={currentImage.url}
                onChange={this.handleCrop}
                onImageLoaded={this.onImageLoaded}
                crop={crop}
              />
              <button className="_legoEditor_imageUploader_applyButton" onClick={this.submitImage}>
                Apply
              </button>
            </div>
          )}
          <button className="_legoEditor_imageUploader_cancelButton" onClick={this.cancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }
}
