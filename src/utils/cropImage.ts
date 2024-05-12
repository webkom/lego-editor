import { Crop } from 'react-image-crop';

interface BlobWithName extends Blob {
  name?: string;
}

const cropImage = (
  image: HTMLImageElement,
  crop: Crop,
  name: string,
): Promise<BlobWithName | null> => {
  if (!crop.width || !crop.height) {
    crop.width = image.width;
    crop.height = image.height;
  }
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext('2d');

  // canvas.getContext(<identifier>) returns null if
  // identifier is not supported, which '2d' is
  if (!ctx) {
    return new Promise((resolve) => resolve(null));
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.drawImage(
    image,
    (crop.x || 0) * scaleX,
    (crop.y || 0) * scaleY,
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((result: BlobWithName | null) => {
      if (result) {
        result.name = name;
        resolve(result);
      } else {
        reject();
      }
    }, 'image/png');
  });
};

export default cropImage;
