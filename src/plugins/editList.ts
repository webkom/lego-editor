import { Editor, Block, Node } from 'slate';
import { Plugin } from 'slate-react';
import { Next } from '../index';
/*
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

export default function editList(options = { useKeyHandlers: true }): Plugin {
  const { useKeyHandlers } = options;
  return {
    onKeyDown(e: Event, editor: Editor, next: Next) {
      const event = e as KeyboardEvent;
      if (!useKeyHandlers) {
        return next();
      }
      switch (event.key) {
        case 'Enter': {
          if (!isList(editor)) {
            return next();
          }
          event.preventDefault();
          handleEnter(editor, event, next);
          break;
        }

        case 'Backspace': {
          if (!isList(editor)) {
            return next();
          }
          handleBackspace(editor, event, next);
          break;
        }

        case 'Tab': {
          if (!isList(editor)) {
            return next();
          }
          event.preventDefault();
          handleTab(editor, event, next);
          break;
        }

        default:
          return next();
      }
    },
    commands: {
      increaseListDepth,
      decreaseListDepth,
      setListType,
    },
    queries: {
      isList,
      getListDepth,
      getListItem,
      getParentList,
    },
  };
}

function handleEnter(editor: Editor, event: KeyboardEvent, next: Next): any {
  const currentBlock = getCurrentBlock(editor);
  if (currentBlock === null) {
    return next();
  }

  const parentList = getParentList(editor, currentBlock.key) as Block;
  if (parentList === null) {
    return next();
  }

  // split the lowest level block on shift+enter
  if (event.shiftKey) {
    return editor.splitBlock(1);
  }
  // unwrap lowest level block from list_item and list if empty
  if (!currentBlock.text) {
    if (getListDepth(editor, currentBlock.key) == 1) {
      editor.unwrapBlock('list_item');
    }
    editor.unwrapBlock(parentList.type);
    // split the list_item block
  } else {
    editor.splitBlock(2);
  }
}

function handleBackspace(editor: Editor, event: KeyboardEvent, next: Next): any {
  const currentBlock = getCurrentBlock(editor);
  if (currentBlock === null) {
    return;
  }

  const parentList = getParentList(editor, currentBlock.key) as Block;
  if (parentList === null) {
    return;
  }

  // unwrap and remove the current node if its empty
  if (!currentBlock.text) {
    event.preventDefault();
    editor
      .unwrapBlock('list_item')
      .unwrapBlock(parentList.type)
      .removeNodeByKey(getCurrentBlock(editor).key);
  } else {
    return next();
  }
}

function handleTab(editor: Editor, event: KeyboardEvent, next: Next): any {
  const { document } = editor.value;

  const currentBlock = getCurrentBlock(editor);

  const listItem = getListItem(editor, currentBlock.key);
  if (listItem === null) {
    return next();
  }

  // unwrap when holding shift
  if (event.shiftKey) {
    decreaseListDepth(editor, currentBlock.key);
  } else if (!document.getPreviousSibling(listItem.key)) {
    // if the list is the only one of its level, do nothing
    return next();
  } else if (!currentBlock.text) {
    // If the list has no text, increse the depth
    increaseListDepth(editor, currentBlock.key);
  }
}

function getCurrentBlock(editor: Editor): Node {
  return editor.value.startBlock;
}

function getListItem(editor: Editor, key: string): Node | null {
  return editor.value.document.getClosest(key, a => a.object == 'block' && a.type == 'list_item') as Block | null;
}

function getParentList(editor: Editor, key: string): Node | null {
  const { document } = editor.value;

  return document.getClosest(
    key,
    a => a.object == 'block' && (a.type == 'ul_list' || a.type == 'ol_list'),
  ) as Block | null;
}

function isList(editor: Editor): boolean {
  return !!getListItem(editor, getCurrentBlock(editor).key);
}

function getListDepth(editor: Editor, key: string): number {
  // Returns the amount of ancestor lists of a node
  const { document } = editor.value;

  // @ts-ignore document should not be null
  return document
    .getAncestors(key)
    .filter(a => a != undefined && a.object == 'block' && (a.type == 'ol_list' || a.type == 'ul_list')).size;
}

function increaseListDepth(editor: Editor, key: string): Editor {
  /* Increases the depth of the parent list of a node by key:
   * If the previous (sibling) node is a list (ol or ul), the current
   * list item is moved into that node. If its a list item, wrap the current
   * list item in the appropriate list type.
   */

  const { document } = editor.value;

  const parentList = getParentList(editor, key) as Block;
  const listItem = getListItem(editor, key);
  if (listItem === null) {
    return editor;
  }
  const siblingList = document.getPreviousSibling(listItem.key) as Block;

  // If the siblinglist exists and is an ul or ol, move the list item into it.
  if (siblingList && (siblingList.type == 'ol_list' || siblingList.type == 'ul_list')) {
    editor.moveNodeByKey(listItem.key, siblingList.key, siblingList.nodes.size);
    // Else, wrap the item in a new list
  } else if (parentList != null) {
    editor.wrapBlockByKey(listItem.key, parentList.type);
  }
  return editor;
}

function decreaseListDepth(editor: Editor, key: string): Editor {
  /*
   * Decreases the depth of the current list item in the selection:
   * If the parent list is the top level list, unwrap the list item.
   * Always unwraps the list
   */

  const parentList = getParentList(editor, key) as Block;

  if (parentList === null) {
    return editor;
  }

  // if the list is the top level, unwrap list_item also
  if (getListDepth(editor, key) == 1) {
    editor.unwrapBlock('list_item');
  }
  return editor.unwrapBlock(parentList.type);
}

function setListType(editor: Editor, key: string, type: 'ol_list' | 'ul_list'): Editor {
  /*
   *  Sets the type of the list closest to node by key.
   *  If there is no list, wraps the current block in a list of the specified type
   */

  const parentList = getParentList(editor, key) as Block;

  if (parentList) {
    if (parentList.type != type) {
      return editor.setNodeByKey(parentList.key, type);
    } else {
      return editor.command('decreaseListDepth', key);
    }
  } else {
    return editor.wrapBlock(type).wrapBlock('list_item');
  }
}
