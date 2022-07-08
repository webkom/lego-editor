import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import ReactCrop, { Crop } from 'react-image-crop';
import cropImage from '../utils/cropImage';
import Modal from './Modal';
import { FunctionComponent, useState } from 'react';

interface Props {
  uploadFunction?: (image: Blob) => void;
  cancel: () => void;
}

interface Image {
  file: Blob & { name: string };
  url: string;
}

interface ImageDropProps {
  onDrop: (images: File[]) => void;
}

const ImageDrop: FunctionComponent<ImageDropProps> = ({ onDrop }) => {
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

const ImageUpload: FunctionComponent<Props> = ({ uploadFunction, cancel }) => {
  const [currentImage, setCurrentImage] = useState<Image>();
  const [crop, setCrop] = useState<Crop>();
  const [imageDimensions, setImageDimensions] =
    useState<{ width: number; height: number }>();

  const onDrop = (files: (Blob & { name: string })[]): void => {
    if (files.length === 1) {
      const file = files[0];
      setCurrentImage({ file: file, url: URL.createObjectURL(file) });
    }
  };

  const onImageLoaded = (image: HTMLImageElement): void => {
    setCrop({
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
      unit: 'px',
    });
    setImageDimensions({ width: image.width, height: image.height });
  };

  const submitImage = (): void => {
    if (!currentImage || !imageDimensions || !crop || !uploadFunction) {
      return;
    }

    const { url, file } = currentImage;
    const image = new Image(imageDimensions.width, imageDimensions.height);
    image.src = url;

    cropImage(image, crop, file.name).then((result: Blob | null) => {
      if (result) {
        uploadFunction(result);
      }
    });
  };

  return (
    <Modal onCancel={cancel} onSubmit={submitImage}>
      <div className="_legoEditor_imageUploader_crop_wrapper">
        {currentImage ? (
          <div className="_legoEditor_imageUploader_crop_container">
            <ReactCrop onChange={setCrop} crop={crop}>
              <img
                src={currentImage.url}
                alt="Uploaded image"
                onLoad={(evt) => onImageLoaded(evt.currentTarget)}
              />
            </ReactCrop>
          </div>
        ) : (
          <ImageDrop onDrop={onDrop} />
        )}
      </div>
    </Modal>
  );
};

export default ImageUpload;
