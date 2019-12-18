import isUrl from 'is-url';
import { Command, Editor, Range, Element } from 'slate';
import { LEditor, nodeType } from '../index';

const links = (editor: Editor): Editor => {
  const { exec, isInline } = editor;
  // Tell the editor that `link` elements are inline
  editor.isInline = (element: Element & { type?: string }): boolean => {
    if (element.type === 'link') {
      return true;
    } else {
      return isInline(element);
    }
  };

  // Add link editing commands
  editor.exec = (command: Command) => {
    switch (command.type) {
      case 'insert_link':
        Editor.insertNodes(editor, {
          type: 'link',
          url: command.url,
          children: [{ text: command.text || command.url }]
        });
        break;
      case 'wrap_link': {
        // Links should only contain text, so we just use the first text node
        // in the current selection
        const at = command.at || editor.selection;
        if (at !== null) {
          // Unwrap any existing link elements, if they exist in the selection
          if (LEditor.isElementActive(editor, 'link', { at })) {
            Editor.unwrapNodes(editor, {
              match: nodeType('link'),
              split: true,
              at
            });
          }
          Editor.wrapNodes(
            editor,
            { type: 'link', url: command.url, children: [] },
            { split: true, at }
          );
        }
        break;
      }
      case 'unwrap_ink':
        Editor.unwrapNodes(editor, { match: nodeType('link') });
        break;

      // Pasting links should issue link commands
      case 'insert_text':
      case 'insert_data': {
        let text;
        if (command.type === 'insert_data') {
          text = command.data.getData('text/plain');
        } else {
          text = command.text;
        }
        if (isUrl(text)) {
          const { selection } = editor;
          if (selection && Range.isCollapsed(selection)) {
            editor.exec({ type: 'insert_link', url: text });
          } else {
            editor.exec({ type: 'wrap_link', url: text });
          }
        } else {
          exec(command);
        }
        break;
      }
      default:
        exec(command);
    }
  };
  return editor;
};

export default links;
