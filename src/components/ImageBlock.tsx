import * as React from 'react';
import { Editor, Node } from 'slate';
import { RenderAttributes } from 'slate-react';

interface Props {
  editor: Editor;
  src: string;
  isFocused: boolean;
  attributes: RenderAttributes;
  node: Node;
}

export default class ImageBlock extends React.Component<Props> {
  render(): React.ReactNode {
    const { src, attributes, isFocused } = this.props;
    return (
      <img
        src={src}
        alt="Failed to load image..."
        className={isFocused ? '_legoEditor_imgSelected' : '_legoEditor_img'}
        {...attributes}
      />
    );
  }
}
