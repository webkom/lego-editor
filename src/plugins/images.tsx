import React from 'react';
import ImageBlock from '../components/ImageBlock';
import { Editor } from 'slate';
import { RenderBlockProps, Plugin } from 'slate-react';

interface Options {
  uploadFunction: (file: Blob) => Promise<string>;
}

export default function images(options: Options): Plugin {
  /*
   *  Plugin to insert and render images, needs a function for uloading the file.
   */
  const { uploadFunction } = options;
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
              src={node.data.get('src')}
              isFocused={isFocused}
              attributes={attributes}
              node={node}
            />
          );
        }
        case 'image_caption': {
          return (
            <figcaption className="_legoEditor_figcaption" {...attributes}>
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
        /*
         *  Inserts the ImageBlock, and runs the provided callback.
         */
        uploadFunction(file).then((src: string) =>
          editor.insertBlock({ data: { src }, type: 'image' })
        );
        return editor;
      }
    }
  };
}
