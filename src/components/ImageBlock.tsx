import * as React from 'react';
import { RenderElementProps, useFocused } from 'slate-react';

interface Props extends RenderElementProps {
  src: string;
}

const ImageBlock = (props: Props): JSX.Element => {
  const { src, children } = props;

  const isFocused = useFocused();
  return (
    <div>
      <img
        src={src}
        alt="Failed to load image..."
        className={isFocused ? '_legoEditor_imgSelected' : '_legoEditor_img'}
      />
      {children}
    </div>
  );
};

export default ImageBlock;
