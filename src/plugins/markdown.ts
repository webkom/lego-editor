import { Editor, Command, Range, Element, Point } from 'slate';
import { LEditor, DEFAULT_BLOCK } from '../index';

const getType = (chars: string): string | null => {
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
    case '######':
      return 'h6';
    case '>':
      return 'quote';
    default:
      return null;
  }
};

/**
 *  A plugin that uses markdown prefixes to set block type.
 */
const MarkdownShortcuts = (editor: Editor): Editor => {
  const { exec } = editor;

  /**
   * On space, if it was after an auto-markdown shortcut, convert the current
   * node into the shortcut's corresponding type.
   */
  const onSpace = (editor: Editor, command: Command): void => {
    const { selection } = editor;
    if (selection && Range.isCollapsed(selection)) {
      const { anchor } = selection;
      const element = Editor.above(editor, { match: Element.isElement });
      const start = Editor.start(editor, element ? element[1] : []);
      const charsRange = { anchor, focus: start };
      const chars = Editor.text(editor, charsRange);

      const type = getType(chars);
      if (!type || (type === 'ul_list' && editor.isList())) {
        exec(command);
        return;
      }

      Editor.delete(editor, { at: charsRange });

      if (type === 'ul_list' || type === 'ol_list') {
        editor.exec({ type: 'toggle_list', listType: type });
      } else {
        editor.exec({ type: 'toggle_block', block: type });
      }
    } else {
      exec(command);
    }
  };

  /**
   * On backspace, if at the start of a non-default, convert it back into a
   * default block.
   */
  const onBackspace = (editor: Editor, command: Command): void => {
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
      exec(command);
      return;
    }

    editor.exec({ type: 'toggle_block', block: DEFAULT_BLOCK });
  };

  editor.exec = (command: Command) => {
    if (command.type === 'insert_text' && command.text === ' ') {
      onSpace(editor, command);
    } else if (command.type === 'delete_backward') {
      onBackspace(editor, command);
    } else {
      exec(command);
    }
  };
  return editor;
};

export default MarkdownShortcuts;
