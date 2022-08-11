import {
  Editor,
  BaseEditor,
  Element,
  NodeEntry,
  Node,
  Location,
  Transforms,
} from 'slate';
import { DEFAULT_BLOCK, nodeType } from '../index';

interface Options {
  uploadFunction: (file: Blob) => Promise<Record<string, unknown>>;
}

type InsertImageOptions = {
  src?: string;
  file?: Blob;
  at?: Location;
};

export interface ImageEditor extends BaseEditor {
  insertImage: (options: InsertImageOptions) => void;
}

/**
 *  Plugin for inserting and normalizing images, needs a function for uploading the file.
 */
const images = (
  options: Options
): (<T extends Editor>(editor: T) => Editor) => {
  const { uploadFunction } = options;
  return <T extends Editor>(editorBase: T): Editor & ImageEditor => {
    const editor = editorBase as T & ImageEditor;
    const { isVoid, normalizeNode } = editor;

    editor.insertImage = (options: InsertImageOptions) => {
      const { file, src, at } = options;
      if (!file) {
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      uploadFunction(file).then((returnData: Record<string, unknown>) => {
        Transforms.insertNodes(
          editor,
          {
            type: 'figure',
            children: [
              {
                type: 'image',
                objectUrl,
                src: src || (returnData?.src as string),
                ...returnData,
                children: [],
              },
              {
                type: 'image_caption',
                children: [{ text: 'Caption', italic: true }],
              },
            ],
          },
          {
            at: at,
          }
        );
      });
    };

    editor.isVoid = (element: Element): boolean => {
      return element.type === 'image' ? true : isVoid(element);
    };

    /**
     *  Normalize figure and image blocks.
     */
    editor.normalizeNode = (entry: NodeEntry): void => {
      const [node, path] = entry;

      if (Element.isElement(node) && node.type === 'figure') {
        const children = Array.from(Node.children(editor, path));

        // A figure should only contain an img and a figure caption
        if (children.length > 2) {
          for (const [, path] of children.slice(2, children.length)) {
            Transforms.removeNodes(editor, { at: path });
          }
          return;
        }
        /**
         *  Ensure the only nodes are images and figure captions.
         *  Any image_captions will be kept and turned into a paragraph
         */
        const img = children[0][0];
        if (!Element.isElement(img) || img.type !== 'image') {
          Transforms.setNodes(
            editor,
            { type: DEFAULT_BLOCK },
            { at: path, match: nodeType('image_caption') }
          );
          Transforms.unwrapNodes(editor, { at: path });
          return;
        }

        if (children.length === 1) {
          Transforms.insertNodes(
            editor,
            { type: 'image_caption', children: [] },
            { at: path }
          );
          return;
        }

        const capt = children[1][0];
        if (!Element.isElement(capt) || capt.type !== 'image_caption') {
          const text = Editor.string(editor, children[1][1]);
          Transforms.removeNodes(editor, { at: children[0][1] });
          Transforms.insertNodes(
            editor,
            { type: 'image_caption', children: [{ text }] },
            { at: path }
          );
          return;
        }
      }

      if (Element.isElement(node) && node.type === 'image_caption') {
        const fig = Editor.parent(editor, path)[0];
        if (Element.isElement(fig) && fig.type !== 'figure') {
          Transforms.setNodes(editor, { type: DEFAULT_BLOCK }, { at: path });
          return;
        }
      }
      normalizeNode(entry);
    };

    return editor;
  };
};

export default images;
