import * as React from 'react';
import { RenderElementProps, useSelected } from 'slate-react';
import cx from 'classnames';

interface Props extends React.PropsWithChildren<RenderElementProps> {
  src: string;
  uploading?: boolean;
}

const ImageBlock = (props: Props): JSX.Element => {
  // https://github.com/yannickcr/eslint-plugin-react/issues/2654
  // eslint-disable-next-line react/prop-types
  const { src, children, uploading, attributes } = props;

  const isFocused = useSelected();
  const baseClass = isFocused ? '_legoEditor_imgSelected' : '_legoEditor_img';
  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <img
          src={src}
          alt="Failed to load image..."
          className={cx(baseClass, uploading && '_legoEditor_imgUploading')}
        />
      </div>
      {children}
    </div>
  );
};

export default ImageBlock;
