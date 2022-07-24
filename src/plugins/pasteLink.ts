import isUrl from '../utils/isUrl';
import {
  Transforms,
  Editor,
  Range,
  Element,
  BaseEditor,
  Location,
} from 'slate';
import { LEditor, nodeType } from '../index';

export interface LinkEditor extends BaseEditor {
  insertLink: (url: string, text?: string) => void;
  wrapLink: (url: string, at?: Location) => void;
  unwrapLink: () => void;
}

const links = <T extends Editor>(e: T): T & LinkEditor => {
  const editor = e as T & LinkEditor;
  const { isInline, insertData, insertText } = editor;
  // Tell the editor that `link` elements are inline
  editor.isInline = (element: Element & { type?: string }): boolean => {
    if (element.type === 'link') {
      return true;
    } else {
      return isInline(element);
    }
  };

  editor.insertLink = (url, text) => {
    Transforms.insertNodes(editor, {
      type: 'link',
      url: url,
      children: [{ text: text || url }],
    });
  };

  editor.wrapLink = (url, optionAt) => {
    // Links should only contain text, so we just use the first text node
    // in the current selection
    const at = (optionAt || editor.selection) as Range | null;
    if (at) {
      // Unwrap any existing link elements, if they exist in the selection
      if (LEditor.isElementActive(editor, 'link', { at })) {
        Transforms.unwrapNodes(editor, {
          match: nodeType('link'),
          split: true,
          at,
        });
      }
      Transforms.wrapNodes(
        editor,
        { type: 'link', url: url, children: [] },
        { split: true, at }
      );
    }
  };

  editor.unwrapLink = () => {
    Transforms.unwrapNodes(editor, { match: nodeType('link') });
  };

  editor.insertData = (data) => {
    const text = data.getData('text/plain');
    if (isUrl(text)) {
      const { selection } = editor;
      if (selection && Range.isCollapsed(selection)) {
        editor.insertLink(text);
      } else {
        editor.wrapLink(text);
      }
    } else {
      insertData(data);
    }
  };

  editor.insertText = (text) => {
    if (isUrl(text)) {
      const { selection } = editor;
      if (selection && Range.isCollapsed(selection)) {
        editor.insertLink(text);
      } else {
        editor.wrapLink(text);
      }
    } else {
      insertText(text);
    }
  };

  return editor;
};

export default links;
