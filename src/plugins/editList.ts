import { Editor, Element, Node, Location, NodeEntry, Command } from 'slate';
import isHotKey from 'is-hotkey';
import { DEFAULT_BLOCK } from '../index';

const LIST_TYPES = ['ul_list', 'ol_list'];

/**
 *  This plugin defines a set of commands and querys to edit lists
 *  as well as key handlers for running these commands.
 *
 *  Commands:
 *    increaseListDepth(editor, key: string) => void
 *      increase the list depth of a specified list item
 *    decreaseListDepth(editor, key: string) => void
 *      decrease the list depth of a specified list item
 *    setListType(editor, key: string, type: string) => void
 *      sets the type of list or makes list
 *
 *  Queries:
 *    isList(editor) => boolean
 *      returns true if there is a list in the current selection
 *    getListDepth(editor, node) => integer
 *    returns the list depth of a node (how many of the nodes ancestors are lists)
 *    getListItem(editor, node) => node
 *      return the closest list item ancestor of a node
 *    getParentList(editor, node) => node
 *      returns the closest list node ancestor of a node
 */
const editList = (editor: Editor): Editor => {
  const { exec } = editor;

  editor.exec = command => {
    if (command.type === 'key_handler' && editor.isList()) {
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
    Editor.splitNodes(editor, { match: 'text' });
    Editor.splitNodes(editor, { match: { type: 'list_item' } });
  }
};

const handleShiftEnter = (editor: Editor, command: Command): void => {
  if (!editor.selection) {
    return;
  }
  command.event.preventDefault();

  Editor.splitNodes(editor, { match: 'block' });
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
  const prevEntry = Editor.previous(editor, listItemPath);

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
      match: { type: 'list_item' },
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
  const prevEntry = Editor.previous(editor, listItemPath);

  // If the siblinglist exists and is an ul or ol, move the list item into it.
  if (prevEntry) {
    const [previousNode, previousNodePath] = prevEntry;
    if (isList(previousNode)) {
      Editor.moveNodes(editor, { at: listItemPath, to: previousNodePath });
      return;
    }
    // Else, wrap the item in a new list
  }
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
  // TODO wait for the new release and add lowest mode
  Editor.unwrapNodes(editor, {
    match: { type: parentList.type },
    at: listItemPath,
    split: true
  });
  if (depth === 1) {
    Editor.unwrapNodes(editor, { match: { type: 'list_item' } });
  }
};

/**
 *  Sets the type of the list at the location specified. Defaults to current selection
 *  If there is no list, wraps the current block in a list of the specified type
 */
const setListType = (editor: Editor, command: Command): void => {
  const { list_type } = command;
  const parentList = getParentList(editor);

  if (parentList) {
    const [listNode] = parentList;
    if (listNode.type != list_type) {
      Editor.setNodes(editor, { type: list_type }, { match: isList });
    } else {
      return editor.exec({ type: 'decrease_list_depth' });
    }
  } else {
    Editor.wrapNodes(editor, {
      type: list_type,
      children: []
    });
    Editor.wrapNodes(editor, {
      type: 'list_item',
      children: [{ type: DEFAULT_BLOCK, children: [] }]
    });
  }
};

export default editList;
