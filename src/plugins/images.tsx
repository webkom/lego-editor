import { Editor, Command, Element, NodeEntry, Node, Location } from 'slate';
import { DEFAULT_BLOCK, nodeType } from '../index';

interface Options {
  uploadFunction: (file: Blob) => Promise<Record<string, unknown>>;
}

/**
 *  Plugin for inserting and normalizing images, needs a function for uploading the file.
 */
const images = (options: Options): ((editor: Editor) => Editor) => {
  const { uploadFunction } = options;
  return (editor: Editor): Editor => {
    const { exec, isVoid, normalizeNode } = editor;

    editor.exec = (
      command: Command & { src?: string; file?: unknown; at?: Location }
    ) => {
      if (command.type === 'insert_image') {
        const { file, src, at } = command;
        if (!file) {
          return;
        }
        const objectUrl = URL.createObjectURL(file);
        uploadFunction(file as Blob).then(
          (returnData: Record<string, unknown>) =>
            Editor.insertNodes(
              editor,
              {
                type: 'figure',
                children: [
                  {
                    type: 'image',
                    objectUrl,
                    src: src || returnData?.src,
                    children: [{ text: '' }],
                    ...returnData,
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
            )
        );
      } else {
        exec(command);
      }
    };

    editor.isVoid = (element: Element): boolean => {
      return element.type === 'image' ? true : isVoid(editor);
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
            Editor.removeNodes(editor, { at: path });
          }
          return;
        }
        /**
         *  Ensure the only nodes are images and figure captions.
         *  Any image_captions will be kept and turned into a paragraph
         */
        if (children[0][0].type !== 'image') {
          Editor.setNodes(
            editor,
            { type: DEFAULT_BLOCK },
            { at: path, match: nodeType('image_caption') }
          );
          Editor.unwrapNodes(editor, { at: path });
          return;
        }

        if (children.length === 1) {
          Editor.insertNodes(
            editor,
            { type: 'image_caption', children: [] },
            { at: path }
          );
          return;
        }

        if (children[1][0].type !== 'image_caption') {
          const text = Editor.string(editor, children[1][1]);
          Editor.removeNodes(editor, { at: children[0][1] });
          Editor.insertNodes(
            editor,
            { type: 'image_caption', children: [{ text }] },
            { at: path }
          );
          return;
        }
      }

      if (Element.isElement(node) && node.type === 'image_caption') {
        if (Editor.parent(editor, path)[0].type !== 'figure') {
          Editor.setNodes(editor, { type: DEFAULT_BLOCK }, { at: path });
          return;
        }
      }
      normalizeNode(entry);
    };

    return editor;
  };
};

export default images;
