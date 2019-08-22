import * as React from 'react';
import { Editor, Node } from 'slate';
import { RenderAttributes } from 'slate-react';

interface Props {
  editor: Editor;
  file: Blob;
  imageUrl: string;
  src: string;
  isFocused: boolean;
  attributes: RenderAttributes;
  node: Node;
}

export default class ImageBlock extends React.Component<Props> {
  componentDidMount(): void {
    //if (this.props.file) {
    //this.props.uploadFile({ file: this.props.file, isPublic: true }).then(({ meta }) => {
    //});
    //}
    const { editor, file, imageUrl } = this.props;
    editor.setNodeByKey(this.props.node.key, {
      data: { imageUrl, file /*, fileKey: meta.fileToken.split(":")[0]*/ },
      type: 'image',
    });
  }

  render(): React.ReactNode {
    const { imageUrl, src, attributes, isFocused } = this.props;
    return (
      <img
        onLoad={() => URL.revokeObjectURL(imageUrl)}
        src={src ? src : imageUrl}
        alt="Failed to load image..."
        className={isFocused ? '_legoEditor_imgSelected' : '_legoEditor_img'}
        {...attributes}
      />
    );
  }
}
