import React from 'react';
import ImageBlock from '../components/ImageBlock';
import { Editor } from 'slate';
import { RenderBlockProps, Plugin } from 'slate-react';

interface Options {
  uploadFunction: (file: Blob) => Promise<Record<string, any>>;
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
          const src = node.data.has('src')
            ? node.data.get('src')
            : node.data.get('objectUrl');
          return (
            <ImageBlock
              editor={editor}
              src={src}
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
      insertImage(editor: Editor, file: Blob, data?: Record<string, any>) {
        /*
         *  Inserts the ImageBlock, and runs the provided callback. We create a objectUrl to use if
         *  the uploadFunction does not immediatly return a src.
         */
        const objectUrl = URL.createObjectURL(file);
        uploadFunction(file).then((returnData: Record<string, any>) =>
          editor.insertBlock({
            data: { ...returnData, ...data, objectUrl },
            type: 'image'
          })
        );
        return editor;
      }
    }
  };
}
