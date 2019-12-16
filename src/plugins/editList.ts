import {
  Editor,
  Text,
  Element,
  Node,
  Location,
  NodeEntry,
  Command
} from 'slate';
import isHotKey from 'is-hotkey';
import { DEFAULT_BLOCK, nodeType } from '../index';

const LIST_TYPES = ['ul_list', 'ol_list'];

/**
 *  This plugin defines a set of commands and querys to edit lists
 *  as well as key handlers for running these commands.
 *
 *  Commands:
 *    { type: 'increase_list_depth' }
 *      increase the list depth of a specified list item
 *    { type: 'decrease_list_depth' }
 *      decrease the list depth of a specified list item
 *    { type: 'toggle_list', listType: 'ul_list' | 'ol_list' }
 *      Toggles the list type of the current list
 *
 *  Queries:
 *    isList() => boolean
 *      returns true if there is a list in the current selection
 *    listDepth(options: {at?: Location) => number
 *      returns the list depth at a location (how many of the nodes ancestors are lists)
 */
const editList = (editor: Editor): Editor => {
  const { exec } = editor;

  editor.exec = command => {
    if (command.type === 'key_handler' && !editor.isList()) {
      const { event } = command;
      if (isHotKey('mod+l')(event)) {
        event.preventDefault();
        editor.exec({ type: 'toggle_list', listType: 'ul_list' });
      } else {
        exec(command);
      }
    } else if (command.type === 'key_handler' && editor.isList()) {
      const parentList = Editor.nodes(editor, {
        match: (node: Node) =>
          node.type === 'ul_list' || node.type === 'ol_list'
      });
      if (!parentList) {
        return exec(command);
      }
      const { event } = command;
      if (isHotKey('Enter')(event)) {
        handleEnter(editor, command);
      } else if (isHotKey('Shift+Enter')(event)) {
        handleShiftEnter(editor, command);
      } else if (isHotKey('Backspace')(event)) {
        handleBackspace(editor, command);
      } else if (isHotKey('Tab')(event)) {
        handleTab(editor, command);
      } else if (isHotKey('Shift+Tab')(event)) {
        handleShiftTab(editor, command);
      }
    } else if (command.type === 'increase_list_depth') {
      increaseListDepth(editor);
    } else if (command.type === 'decrease_list_depth') {
      decreaseListDepth(editor);
    } else if (command.type === 'toggle_list') {
      setListType(editor, command);
    } else {
      exec(command);
    }
  };

  editor.isList = (): boolean => {
    const [match] = Editor.nodes(editor, { match: isList });
    return !!match;
  };

  editor.listDepth = (options: { at?: Location }) => {
    return getListDepth(editor, options.at);
  };

  return editor;
};

const isList = (node: Node): boolean => LIST_TYPES.includes(node.type);

const handleEnter = (editor: Editor, command: Command): void => {
  // unwrap lowest level block from list_item and list if empty
  const listEntry = getListItem(editor);
  if (!listEntry || !editor.selection) {
    return;
  }
  const [, listItemPath] = listEntry;

  command.event.preventDefault();
  if (!Editor.text(editor, listItemPath)) {
    editor.exec({ type: 'decrease_list_depth' });
    // If the selection is at the end of the current list item, insert a new
    // block at the location after the current one
  } else if (Editor.isEnd(editor, editor.selection.focus, listItemPath)) {
    const path = listItemPath;
    path[listItemPath.length - 1] += 1;
    Editor.insertNodes(
      editor,
      { type: 'list_item', children: [{ type: DEFAULT_BLOCK, children: [] }] },
      { at: path }
    );
    Editor.select(editor, path);
  } else {
    Editor.splitNodes(editor, { match: Text.isText });
    Editor.splitNodes(editor, { match: nodeType('list_item') });
  }
};

const handleShiftEnter = (editor: Editor, command: Command): void => {
  if (!editor.selection) {
    return;
  }
  command.event.preventDefault();

  Editor.splitNodes(editor, { match: editor.i });
};

const handleBackspace = (editor: Editor, command: Command): void => {
  const listItemEntry = getListItem(editor);
  if (!listItemEntry) {
    return;
  }
  const [, listItemPath] = listItemEntry;

  // unwrap and remove the current node if its empty
  if (!Editor.text(editor, listItemPath)) {
    command.event.preventDefault();
    editor.exec({ type: 'decrease_list_depth' });
  }
};

const handleTab = (editor: Editor, command: Command): void => {
  const listItemEntry = getListItem(editor);
  if (!listItemEntry) {
    return;
  }
  const [, listItemPath] = listItemEntry;
  const prevEntry = Editor.previous(editor, { at: listItemPath });

  if (!prevEntry) {
    // if the list is the only one of its level, do nothing
    return;
  }
  if (!Editor.text(editor, listItemPath)) {
    command.event.preventDefault();
    // If the list has no text, increse the depth
    increaseListDepth(editor, listItemPath);
  }
};

const handleShiftTab = (editor: Editor, command: Command): void => {
  const listItemEntry = getListItem(editor);
  if (!listItemEntry) {
    return;
  }
  const [, listItemPath] = listItemEntry;
  command.event.preventDefault();
  decreaseListDepth(editor, listItemPath);
};

/**
 *  Get the first list item node in the location specified, or in the current
 *  selection if omitted.
 */
const getListItem = (editor: Editor, at?: Location): NodeEntry | undefined => {
  if (!!at || editor.selection !== null) {
    const [match] = Editor.nodes(editor, {
      at,
      match: nodeType('list_item'),
      reverse: true
    });
    return match;
  }
};

/**
 *  Get the first ul or ol node in the location specified, or in the current
 *  selection if omitted.
 */
const getParentList = (
  editor: Editor,
  at?: Location
): NodeEntry | undefined => {
  if (!!at || editor.selection !== null) {
    const [match] = Editor.nodes(editor, {
      match: (node: Node) => node.type === 'ul_list' || node.type === 'ol_list',
      at,
      reverse: true
    });
    return match;
  }
};

//const isList(editor: Editor): boolean {
//return !!getListItem(editor, getCurrentBlock(editor).key);
//}

/**
 *  Get the depth of a list item. (Number of ol or ul items from the root node)
 *  Defaults to current selection.
 */
const getListDepth = (editor: Editor, at?: Location): number => {
  const listNodes = Editor.nodes(editor, {
    at,
    match: isList,
    reverse: true
  });
  return Array.from(listNodes).length;
};

/**
 *  Increases the depth of the parent list of a node in a location.
 *  If the previous (sibling) node is a list (ol or ul), the current
 *  list item is moved into that node. If it's a list item, wraps the current
 *  list item in the appropriate list type.
 */
const increaseListDepth = (editor: Editor, at?: Location): void => {
  const listEntry = getListItem(editor, at);
  const parentEntry = getParentList(editor, at);
  if (!parentEntry || !listEntry) {
    return;
  }
  const [parentList] = parentEntry;
  const [, listItemPath] = listEntry;
  const prevEntry = Editor.previous(editor, { at: listItemPath });
  const nextEntry = Editor.next(editor, { at: listItemPath });

  // If the siblinglist exists and is an ul or ol, move the list item into it.
  let path;
  if (prevEntry) {
    const [previousNode] = prevEntry;
    if (isList(previousNode)) {
      path = [...prevEntry[1], prevEntry[0].children.length];
    }
  } else if (nextEntry) {
    const [nextNode] = nextEntry;
    if (isList(nextNode)) {
      path = [...nextEntry[1], 0];
    }
  }
  if (path) {
    Editor.moveNodes(editor, { at: listItemPath, to: path });
    return;
  }
  // Else, wrap the item in a new list
  if (parentList != null) {
    Editor.wrapNodes(
      editor,
      { type: parentList.type, children: [] },
      { at: listItemPath }
    );
  }
};

/**
 *  Decreases the depth of the current list item in the selection:
 *  If the parent list is the top level list, unwrap the list item.
 *  Always unwraps the list
 */
const decreaseListDepth = (editor: Editor, at?: Location): void => {
  const listEntry = getListItem(editor, at);
  const parentEntry = getParentList(editor, at);
  if (!parentEntry || !listEntry || !editor.selection) {
    return;
  }
  const [parentList] = parentEntry;
  const [, listItemPath] = listEntry;

  const depth = getListDepth(editor, listItemPath);
  Editor.unwrapNodes(editor, {
    match: nodeType(parentList.type),
    at: listItemPath,
    split: true
  });
  if (depth === 1) {
    Editor.unwrapNodes(editor, { match: nodeType('list_item') });
  }
};

/**
 *  Sets the type of the list at the location specified. Defaults to current selection
 *  If there is no list, wraps the current block in a list of the specified type
 */
const setListType = (editor: Editor, command: Command): void => {
  const { listType } = command;
  const parentList = getParentList(editor);

  if (parentList) {
    const [listNode] = parentList;
    if (listNode.type != listType) {
      Editor.setNodes(editor, { type: listType }, { match: isList });
    } else {
      return editor.exec({ type: 'decrease_list_depth' });
    }
  } else {
    const selectedNodes = Editor.nodes(editor, { match: Element.isElement });
    for (const [, nodePath] of selectedNodes) {
      Editor.pathRef(editor, nodePath);
    }
    Editor.wrapNodes(editor, {
      type: listType,
      children: []
    });
    for (const pathRef of Editor.pathRefs(editor)) {
      const path = pathRef.unref();
      if (path) {
        Editor.wrapNodes(
          editor,
          {
            type: 'list_item',
            children: []
          },
          { at: path }
        );
      }
    }
  }
};

export default editList;
