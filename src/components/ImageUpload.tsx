import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import ReactCrop, { Crop } from 'react-image-crop';
import Modal from 'react-modal';
import cropImage from '../utils/cropImage';
import cx from 'classnames';

interface Props {
  uploadFunction?: (image: Blob) => void;
  cancel: () => void;
}

interface Image {
  file: Blob & { name: string };
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

const ImageDrop: React.StatelessComponent<ImageDropProps> = (
  props: ImageDropProps
) => {
  const { onDrop } = props;
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="_legoEditor_imageUploader_dropZone" {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <h4>Drop files here...</h4>
      ) : (
        <h4>Click to select or drop files here</h4>
      )}
    </div>
  );
};

export default class ImageUpload extends React.Component<Props, State> {
  readonly state: State = {
    hasImage: false
  };

  onDrop = (files: (Blob & { name: string })[]): void => {
    if (files.length === 1) {
      const file = files[0];
      this.setState({
        currentImage: { file: file, url: URL.createObjectURL(file) }
      });
    }
  };

  onImageLoaded = (image: HTMLImageElement): boolean => {
    this.setState({
      crop: { x: 0, y: 0, width: image.width, height: image.height },
      imageWidth: image.width,
      imageHeight: image.height
    });
    return false;
  };

  handleCrop = (crop: Crop): void => {
    this.setState({ crop });
  };

  submitImage = (): void => {
    if (!this.state.currentImage) {
      return;
    }
    const { url, file } = this.state.currentImage;
    const { crop } = this.state;
    const { uploadFunction } = this.props;
    const image = new Image(this.state.imageWidth, this.state.imageHeight);
    image.src = url;

    crop &&
      uploadFunction &&
      cropImage(image, crop, file.name).then((result: Blob) =>
        uploadFunction(result)
      );
  };

  cancel = (): void => {
    this.props.cancel();
  };

  render(): React.ReactNode {
    const { currentImage, crop } = this.state;

    return (
      <Modal isOpen={true} className="_legoEditor_imageUploader_modal">
        <div className="_legoEditor_imageUploader_wrapper">
          <div className="_legoEditor_imageUploader_root">
            <div className="_legoEditor_imageUploader_crop_wrapper">
              {currentImage ? (
                <div className="_legoEditor_imageUploader_crop_container">
                  <ReactCrop
                    src={currentImage.url}
                    onChange={this.handleCrop}
                    onImageLoaded={this.onImageLoaded}
                    crop={crop}
                  />
                </div>
              ) : (
                <ImageDrop onDrop={this.onDrop} />
              )}
            </div>
            <div className="_legoEditor_imageUploader_buttonContainer">
              <button
                className={cx(
                  '_legoEditor_imageUploader_applyButton',
                  '_legoEditor_imageUploader_button'
                )}
                onClick={this.submitImage}
                type="button"
              >
                Apply
              </button>

              <button
                className={cx(
                  '_legoEditor_imageUploader_cancelButton',
                  '_legoEditor_imageUploader_button'
                )}
                onClick={this.cancel}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}
