import {
  Editor,
  Transforms,
  Range,
  Element,
  Point,
  EditorDirectedDeletionOptions,
} from 'slate';
import { LEditor, DEFAULT_BLOCK } from '../index';
import type { Elements } from '../custom-types';

type TextUnit = NonNullable<EditorDirectedDeletionOptions['unit']>;

const getType = (chars: string): Elements | null => {
  switch (chars) {
    case '*':
    case '-':
    case '+':
      return 'ul_list';
    case '1.':
      return 'ol_list';
    case '#':
      return 'h1';
    case '##':
      return 'h2';
    case '###':
      return 'h3';
    case '####':
      return 'h4';
    case '#####':
      return 'h5';
    case '>':
      return 'quote';
    default:
      return null;
  }
};

/**
 *  A plugin that uses markdown prefixes to set block type.
 */
const MarkdownShortcuts = <T extends Editor>(editor: T): T => {
  const { insertText, deleteBackward } = editor;

  /**
   * On space, if it was after an auto-markdown shortcut, convert the current
   * node into the shortcut's corresponding type.
   */
  const onSpace = (editor: Editor, text: string): void => {
    const { selection } = editor;
    if (selection && Range.isCollapsed(selection)) {
      const { anchor } = selection;
      const element = Editor.above(editor, { match: Element.isElement });
      const start = Editor.start(editor, element ? element[1] : []);
      const charsRange = { anchor, focus: start };
      const chars = Editor.string(editor, charsRange);

      const type = getType(chars);
      if (!type || (type === 'ul_list' && editor.isList())) {
        insertText(text);
        return;
      }

      Transforms.delete(editor, { at: charsRange });

      if (type === 'ul_list' || type === 'ol_list') {
        editor.toggleList(type);
      } else {
        editor.toggleBlock(type);
      }
    } else {
      insertText(text);
    }
  };

  /**
   * On backspace, if at the start of a non-default, convert it back into a
   * default block.
   */
  const onBackspace = (editor: Editor, unit: TextUnit): void => {
    const { selection } = editor;

    const element = Editor.above(editor, { match: Element.isElement });
    const start = Editor.start(editor, element ? element[1] : []);

    if (
      !selection ||
      !Range.isCollapsed(selection) ||
      editor.isList() ||
      LEditor.isElementActive(editor, DEFAULT_BLOCK) ||
      !Point.equals(selection.anchor, start)
    ) {
      deleteBackward(unit);
      return;
    }

    editor.toggleBlock(DEFAULT_BLOCK);
  };

  editor.insertText = (text) => {
    if (text === ' ') {
      onSpace(editor, text);
    } else {
      insertText(text);
    }
  };

  editor.deleteBackward = (unit) => {
    onBackspace(editor, unit);
  };

  return editor;
};

export default MarkdownShortcuts;
