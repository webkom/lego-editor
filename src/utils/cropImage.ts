import { Crop } from 'react-image-crop';

const cropImage = (image: HTMLImageElement, crop: Crop, fileName: string): Promise<Blob> => {
  if (!crop.width || !crop.height) {
    crop.width = image.width;
    crop.height = image.height;
  }
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise(resolve => {
    canvas.toBlob(blob => {
      blob.name = fileName;
      resolve(blob);
    }, 'image/jpeg');
  });
};

export default cropImage;
