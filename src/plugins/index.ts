import { Editor, Command, Element, Node, NodeEntry, Range } from 'slate';
import isHotKey from 'is-hotkey';
import { LEditor, Elements, DEFAULT_BLOCK } from '../index';
import { deserializeHtmlString } from '../serializer';

import lists from './editList';
import links from './pasteLink';
import images from './images';
import markdownShortcuts from './markdown';

export { lists, links, images, markdownShortcuts };

/**
 *  A simple plugin that inserts a 'tab' character on pressing tab.
 */
export const insertTab = (editor: Editor): Editor => {
  const { exec } = editor;

  editor.exec = (command: Command) => {
    const { selection } = editor;
    if (
      command.type === 'key_handler' &&
      isHotKey('Tab')(command.event) &&
      selection &&
      Range.isCollapsed(selection)
    ) {
      command.event.preventDefault();
      editor.exec({ type: 'insert_text', text: '\t' });
    } else {
      exec(command);
    }
  };
  return editor;
};

/**
 *  A plugin that enables soft enter if selection has blocks
 *  of a type specified. For all other blocks enables soft enter on
 *  Shift+Enter
 */
export const softEnter = (editor: Editor): Editor => {
  const { exec } = editor;
  editor.exec = (command: Command) => {
    if (command.type === 'key_handler') {
      const { event } = command;
      if (
        isHotKey('Enter')(event) &&
        LEditor.isElementActive(editor, 'code_block') &&
        editor.selection !== null
      ) {
        event.preventDefault();
        editor.exec({ type: 'insert_text', text: '\n' });
        Editor.move(editor);
      } else if (
        isHotKey('Shift+Enter')(event) &&
        LEditor.isElementActive(editor, 'code_block') &&
        editor.selection
      ) {
        return;
      } else if (isHotKey('Shift+Enter')(event)) {
        event.preventDefault();
        editor.exec({ type: 'insert_text', text: '\n' });
      } else {
        exec(command);
      }
    } else {
      exec(command);
    }
  };
  return editor;
};

const TEXT_BLOCKS: Elements[] = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'paragraph',
  'code_block'
];

/**
 *  A base plugin that defines some general commands, queries ans normalization rules
 */
export const basePlugin = (editor: Editor): Editor => {
  const { exec, normalizeNode } = editor;

  editor.exec = (command: Command) => {
    // Toggles the block type of everything except lists
    if (
      command.type === 'toggle_block' &&
      !(command.block === 'ul_list' || command.block === 'ol_list')
    ) {
      const isActive = LEditor.isElementActive(editor, command.block);
      Editor.setNodes(editor, {
        type: isActive ? DEFAULT_BLOCK : command.block
      });
    } else if (command.type === 'toggle_mark') {
      editor.exec({
        type: 'format_text',
        properties: { [command.mark]: true }
      });
    }
    if (command.type === 'insert_data') {
      const text = command.data.getData('text/html');
      const fragment = deserializeHtmlString(text);
      if (text) {
        Editor.insertFragment(editor, fragment);
      } else {
        exec(command);
      }
    } else {
      exec(command);
    }
  };

  editor.normalizeNode = (entry: NodeEntry) => {
    const [node, path] = entry;

    if (Element.isElement(node) && TEXT_BLOCKS.includes(node.type)) {
      for (const [child, childPath] of Node.children(editor, path)) {
        if (Element.isElement(child) && !editor.isInline(child)) {
          Editor.unwrapNodes(editor, { at: childPath });
          return;
        }
      }
    }

    normalizeNode(entry);
  };

  return editor;
};
