import React from 'react';
import ImageBlock from '../components/ImageBlock';
import { Editor } from 'slate';
import { RenderBlockProps, Plugin } from 'slate-react';

// plugin to insert images: Creates an imageBlock from a file blob
// and creates a URL to the file for local storage
// TODO consider only uploading after submit
export default function images(options?: object): Plugin {
  return {
    renderBlock(props: RenderBlockProps, editor: Editor, next: () => void) {
      const { attributes, node, children, isFocused } = props;
      switch (node.type) {
        case 'figure': {
          return (
            <figure className="_legoEditor_figure" {...attributes}>
              {children}
            </figure>
          );
        }
        case 'image': {
          return (
            <ImageBlock
              editor={editor}
              imageUrl={node.data.get('imageUrl')}
              src={node.data.get('src')}
              file={node.data.get('file')}
              isFocused={isFocused}
              attributes={attributes}
              node={node}
            />
          );
        }
        case 'image_caption': {
          return (
            <figcaption className="figcaption" {...attributes}>
              {children}
            </figcaption>
          );
        }
        default:
          return next();
      }
    },
    commands: {
      insertImage(editor: Editor, file: Blob) {
        const imageUrl = URL.createObjectURL(file);
        return editor.insertBlock({ data: { file, imageUrl }, type: 'image' });
      },
    },
  };
}
