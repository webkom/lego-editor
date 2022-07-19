import {
  Editor,
  Element,
  Node,
  NodeEntry,
  Range,
  Transforms,
  BaseEditor,
} from 'slate';
import isHotKey from 'is-hotkey';
import { LEditor, DEFAULT_BLOCK } from '../index';
import type { Elements, Mark } from '../custom-types';
import { deserializeHtmlString } from '../serializer';

import lists, { ListEditor } from './editList';
import links, { LinkEditor } from './pasteLink';
import images, { ImageEditor } from './images';
import markdownShortcuts from './markdown';

export { lists, links, images, markdownShortcuts };
export { ListEditor, LinkEditor, ImageEditor };

type KeyHandlerCommand = {
  event: KeyboardEvent;
};

export interface PluginsEditor extends BaseEditor {
  keyHandler: (command: KeyHandlerCommand) => void;
  toggleMark: (mark: Mark) => void;
  toggleBlock: (block: Elements) => void;
}

/**
 *  A simple plugin that inserts a 'tab' character on pressing tab.
 */
export const insertTab = <T extends Editor>(editor: T): T & PluginsEditor => {
  const e = editor as T & PluginsEditor;
  const { keyHandler } = e;
  e.keyHandler = (command: KeyHandlerCommand) => {
    const { selection } = editor;
    if (
      isHotKey('Tab')(command.event) &&
      selection &&
      Range.isCollapsed(selection)
    ) {
      command.event.preventDefault();
      editor.insertText('\t');
    } else {
      keyHandler(command);
    }
  };
  return e;
};

/**
 *  A plugin that enables soft enter if selection has blocks
 *  of a type specified. For all other blocks enables soft enter on
 *  Shift+Enter
 */
export const softEnter = <T extends Editor>(
  editor: T
): Editor & PluginsEditor => {
  const e = editor as T & PluginsEditor;

  const { keyHandler } = e;

  e.keyHandler = (command: KeyHandlerCommand) => {
    const { event } = command;
    if (
      isHotKey('Enter')(event) &&
      LEditor.isElementActive(editor, 'code_block') &&
      editor.selection !== null
    ) {
      event.preventDefault();
      editor.insertText('\n');
      Transforms.move(editor);
    } else if (
      isHotKey('Shift+Enter')(event) &&
      LEditor.isElementActive(editor, 'code_block') &&
      editor.selection
    ) {
      return;
    } else if (isHotKey('Shift+Enter')(event)) {
      event.preventDefault();
      editor.insertText('\n');
    } else {
      keyHandler(command);
    }
  };
  return e;
};

const TEXT_BLOCKS: Elements[] = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'paragraph',
  'code_block',
  'quote',
];

/**
 *  A base plugin that defines some general commands, queries ans normalization rules
 */
export const basePlugin = <T extends Editor>(editor: T): Editor => {
  const { normalizeNode, insertData } = editor;

  const e = editor as T & PluginsEditor;

  // Toggle the block type of everything except lists
  e.toggleBlock = (block: Elements) => {
    if (!(block === 'ul_list' || block === 'ol_list')) {
      const isActive = LEditor.isElementActive(e, block);
      Transforms.setNodes(e, {
        type: isActive ? DEFAULT_BLOCK : block,
      });
    }
  };

  e.toggleMark = (mark) => {
    const isActive = LEditor.isMarkActive(e, mark);
    if (isActive) {
      e.removeMark(mark);
    } else {
      e.addMark(mark, true);
    }
  };

  e.insertData = (data) => {
    const text = data.getData('text/html');
    const fragment = deserializeHtmlString(text);
    if (text) {
      Editor.insertFragment(e, fragment);
    } else {
      insertData(data);
    }
  };

  editor.normalizeNode = (entry: NodeEntry) => {
    const [node, path] = entry;

    if (Element.isElement(node) && TEXT_BLOCKS.includes(node.type)) {
      for (const [child, childPath] of Node.children(e, path)) {
        if (Element.isElement(child) && !e.isInline(child)) {
          Transforms.unwrapNodes(e, { at: childPath });
          return;
        }
      }
    }

    /*
     *  The last element in the document should always be a text node.
     *  This is because it simplifies the logic when the last node is a
     *  special node like a figure or video. This way we can simply
     *  deny splitting these nodes, and the user would still be able to
     *  edit the document.
     */
    if (path.length === 1 && path[0] === Editor.last(e, [])[1][0]) {
      if (Element.isElement(node) && !TEXT_BLOCKS.includes(node.type)) {
        // If the last node is not a text node we insert a default block
        // at the top level next path.
        Transforms.insertNodes(
          e,
          { type: DEFAULT_BLOCK, children: [] },
          { at: [Editor.last(e, [])[1][0] + 1] }
        );
        return;
      }
    }

    /*
     *  If the last node is an empty text node and the
     *
     */

    normalizeNode(entry);
  };

  return editor;
};
