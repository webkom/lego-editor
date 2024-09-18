import { Button, Flex, Modal } from '@webkom/lego-bricks';
import React, { useMemo } from 'react';
import cx from 'classnames';
import { type Accept, useDropzone } from 'react-dropzone';
import ReactCrop, { Crop } from 'react-image-crop';
import cropImage from '../utils/cropImage';
import { FunctionComponent, useState } from 'react';

import './ImageUpload.css';

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
  const accept: Accept = {
    'image/jpeg': ['*'],
    'image/png': ['*'],
    'image/gif': ['*'],
    'image/tif': ['*'],
    'image/bmp': ['*'],
    'image/avif': ['*'],
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isFocused,
    isDragAccept,
    isDragReject,
  } = useDropzone({ onDrop, accept });

  const style = useMemo(
    () =>
      cx(
        isFocused && '_legoEditor_imageUploader_dropZone_focused',
        isDragAccept && '_legoEditor_imageUploader_dropZone_dragAccept',
        isDragReject && '_legoEditor_imageUploader_dropZone_dragReject',
      ),
    [isFocused, isDragAccept, isDragReject],
  );

  return (
    <div
      {...getRootProps({
        className: cx('_legoEditor_imageUploader_dropZone', style),
      })}
    >
      <div className="_legoEditor_imageUploader_dropArea">
        {isDragActive ? (
          <h4>Dropp bilder her ...</h4>
        ) : (
          <h4>Dropp bilder her eller trykk for å velge fra filsystem</h4>
        )}
      </div>
      <input {...getInputProps()} />
    </div>
  );
};

const ImageUpload: FunctionComponent<Props> = ({ uploadFunction, cancel }) => {
  const [showModal, setShowModal] = useState(true);
  const [currentImage, setCurrentImage] = useState<Image>();
  const [crop, setCrop] = useState<Crop>();
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  }>();

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

  const onModalOpenChange = (isOpen: boolean): void => {
    if (!isOpen) {
      cancel();
    }
    setShowModal(isOpen);
  };

  return (
    <Modal isOpen={showModal} onOpenChange={onModalOpenChange}>
      <Flex
        column
        alignItems="center"
        justifyContent="center"
        gap={35}
        className="_legoEditor_imageUploader_crop_wrapper"
      >
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
        <Flex wrap gap={35}>
          <Button flat onPress={() => onModalOpenChange(false)}>
            Avbryt
          </Button>
          <Button secondary disabled={!currentImage} onPress={submitImage}>
            Last opp
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default ImageUpload;
