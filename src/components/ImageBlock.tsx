import * as React from "react";
import { Editor, Node } from "slate";
import { RenderAttributes } from "slate-react";

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
  componentDidMount() {
    //if (this.props.file) {
    //this.props.uploadFile({ file: this.props.file, isPublic: true }).then(({ meta }) => {
    //});
    //}
    const { editor, file, imageUrl } = this.props;
    editor.setNodeByKey(this.props.node.key, {
      data: { imageUrl, file /*, fileKey: meta.fileToken.split(":")[0]*/ },
      type: "image",
    });
  }

  render() {
    const { imageUrl, src, attributes, isFocused } = this.props;
    return (
      <img
        onLoad={() => URL.revokeObjectURL(imageUrl)}
        src={src ? src : imageUrl}
        alt="Bildet kunne ikke vises"
        className={isFocused ? "imgSelected" : "img"}
        {...attributes}
      />
    );
  }
}
