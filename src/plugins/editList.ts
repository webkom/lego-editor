import {
  Editor,
  BaseEditor,
  Text,
  Element,
  Node,
  Location,
  Path,
  Range,
  Transforms,
} from 'slate';
import isHotKey from 'is-hotkey';
import { DEFAULT_BLOCK, nodeType } from '../index';
type NodeEntry<T extends Node = Node> = [T, Path];

const LIST_TYPES = ['ul_list', 'ol_list'] as const;

type ListType = typeof LIST_TYPES[number];

export interface ListEditor extends BaseEditor {
  increaseListDepth: (at?: Location) => void;
  decreaseListDepth: (at?: Location) => void;
  toggleList: (listType: ListType) => void;
  isList: (options?: { at?: Location }) => boolean;
  listDepth: (options?: { at?: Location }) => number;
}

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
const editList = <T extends Editor>(baseEditor: T): T & ListEditor => {
  const editor = baseEditor as T & ListEditor;
  const { normalizeNode, keyHandler } = editor;

  editor.keyHandler = (command) => {
    if (!editor.isList()) {
      const { event } = command;
      if (isHotKey('mod+l')(event)) {
        event.preventDefault();
        editor.toggleList('ul_list');
      } else {
        keyHandler(command);
      }
    } else if (editor.isList()) {
      const parentList = Editor.nodes(editor, {
        match: (node: Node) =>
          Element.isElement(node) &&
          (node.type === 'ul_list' || node.type === 'ol_list'),
      });
      if (!parentList) {
        return keyHandler(command);
      }
      const { event } = command;
      if (isHotKey('Enter')(event)) {
        handleEnter(editor, command, keyHandler);
      } else if (isHotKey('Backspace')(event)) {
        handleBackspace(editor, command, keyHandler);
      } else if (isHotKey('Tab')(event)) {
        handleTab(editor, command, keyHandler);
      } else if (isHotKey('Shift+Tab')(event)) {
        handleShiftTab(editor, command, keyHandler);
      }
    }
  };

  editor.increaseListDepth = (at) => increaseListDepth(editor, at);
  editor.decreaseListDepth = (at) => decreaseListDepth(editor, at);
  editor.toggleList = (listType) => setListType(editor, listType);

  editor.isList = (options?: { at?: Location }): boolean => {
    const [match] = Editor.nodes(editor, { match: isList, at: options?.at });
    return !!match;
  };

  editor.listDepth = (options?: { at?: Location }) => {
    return getListDepth(editor, options?.at);
  };

  // Normalization for lists
  editor.normalizeNode = (entry: NodeEntry): void => {
    const [node, path] = entry;

    // list_item rules
    if (Element.isElement(node) && node.type === 'list_item') {
      // A list item should always be a child of a list
      if (!isList(Editor.parent(editor, path)[0])) {
        Transforms.unwrapNodes(editor, {
          at: path,
          match: nodeType('list_item'),
        });
        return;
      }

      // A list item should always contain another block element
      const children = Array.from(Node.children(editor, path));
      if (Text.isText(children[0])) {
        Transforms.setNodes(
          editor,
          { type: DEFAULT_BLOCK, children: [] },
          { at: path }
        );
        Transforms.wrapNodes(
          editor,
          { type: 'list_item', children: [] },
          { at: path }
        );
        return;
      }
    }

    // ul_list and ol_list rules
    if (Element.isElement(node) && isList(node)) {
      // A list should always contain list_item is list children
      const children = Array.from(Node.children(editor, path));
      if (!children) {
        Transforms.setNodes(
          editor,
          { type: DEFAULT_BLOCK, children: [] },
          { at: path }
        );
        return;
      }

      for (const [child, childPath] of children) {
        if (
          Element.isElement(child) &&
          !isList(child) &&
          child.type !== 'list_item'
        ) {
          Transforms.unwrapNodes(editor, { at: childPath });
          return;
        }
      }
    }

    normalizeNode(entry);
  };

  return editor;
};

const isList = (node: Node): boolean =>
  Element.isElement(node) &&
  (node.type === 'ol_list' || node.type === 'ul_list');

const handleEnter = (
  editor: Editor & ListEditor,
  command: Parameters<Editor['keyHandler']>[0],
  keyHandler: Editor['keyHandler']
): void => {
  // unwrap lowest level block from list_item and list if empty
  const listEntry = getListItem(editor);
  if (!listEntry || !editor.selection) {
    keyHandler(command);
    return;
  }
  const [, listItemPath] = listEntry;

  command.event.preventDefault();
  if (!Editor.string(editor, listItemPath)) {
    editor.decreaseListDepth();
    // If the selection is at the end of the current list item, insert a new
    // block at the location after the current one
  } else if (Editor.isEnd(editor, editor.selection.focus, listItemPath)) {
    const path = listItemPath;
    path[listItemPath.length - 1] += 1;
    Transforms.insertNodes(
      editor,
      { type: 'list_item', children: [{ type: DEFAULT_BLOCK, children: [] }] },
      { at: path }
    );
    Transforms.select(editor, path);
  } else {
    Transforms.splitNodes(editor, { match: Text.isText });
    Transforms.splitNodes(editor, { match: nodeType('list_item') });
  }
};

const handleBackspace = (
  editor: Editor & ListEditor,
  command: Parameters<Editor['keyHandler']>[0],
  keyHandler: Editor['keyHandler']
): void => {
  const listItemEntry = getListItem(editor);
  if (!listItemEntry) {
    keyHandler(command);
    return;
  }
  const [listItem, listItemPath] = listItemEntry;

  // unwrap and remove the current node if its empty and only has one child
  if (
    !Editor.string(editor, listItemPath) &&
    Element.isElement(listItem) &&
    listItem.type === 'list_item' &&
    listItem.children.length == 1
  ) {
    command.event.preventDefault();
    editor.decreaseListDepth();
  } else {
    keyHandler(command);
  }
};

const handleTab = (
  editor: Editor & ListEditor,
  command: Parameters<Editor['keyHandler']>[0],
  keyHandler: Editor['keyHandler']
): void => {
  const listItemEntry = getListItem(editor);
  if (!listItemEntry) {
    keyHandler(command);
    return;
  }
  const [, listItemPath] = listItemEntry;
  const prevEntry = Editor.previous(editor, { at: listItemPath });

  if (!prevEntry) {
    // if the list is the only one of its level, do nothing
    keyHandler(command);
    return;
  }
  if (!Editor.string(editor, listItemPath)) {
    command.event.preventDefault();
    // If the list has no text, increase the depth
    increaseListDepth(editor, listItemPath);
  } else {
    keyHandler(command);
  }
};

const handleShiftTab = (
  editor: Editor & ListEditor,
  command: Parameters<Editor['keyHandler']>[0],
  keyHandler: Editor['keyHandler']
): void => {
  const listItemEntry = getListItem(editor);
  if (!listItemEntry) {
    keyHandler(command);
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
const getListItem = (
  editor: Editor & ListEditor,
  at?: Location,
  mode?: 'highest' | 'lowest' | 'all'
): NodeEntry | undefined => {
  if (!!at || editor.selection !== null) {
    const [match] = Editor.nodes(editor, {
      at,
      match: nodeType('list_item'),
      reverse: true,
      mode,
    });
    return match;
  }
};

/**
 *  Get the first ul or ol node in the location specified, or in the current
 *  selection if omitted.
 */
const getParentList = (
  editor: Editor & ListEditor,
  at?: Location
): NodeEntry | undefined => {
  if (!!at || editor.selection !== null) {
    return Editor.above(editor, {
      match: isList,
      at: at || editor.selection?.anchor,
    });
  }
};

/**
 *  Get the depth of a list item. (Number of ol or ul items from the root node)
 *  Defaults to current selection.
 */
const getListDepth = (editor: Editor, at?: Location): number => {
  const listNodes = Editor.nodes(editor, {
    at,
    match: isList,
    reverse: true,
  });
  return Array.from(listNodes).length;
};

/**
 *  Increases the depth of the parent list of a node in a location.
 *  If the previous (sibling) node is a list (ol or ul), the current
 *  list item is moved into that node. If it's a list item, wraps the current
 *  list item in the appropriate list type.
 */
const increaseListDepth = (
  editor: Editor & ListEditor,
  at?: Location
): void => {
  // If the provided location is a range, we perform the operation on
  // every list item in the range
  if (Range.isRange(at || editor.selection)) {
    const listItemEntries = Editor.nodes(editor, {
      at: at,
      match: nodeType('list_item'),
    });
    const pathRefs = Array.from(listItemEntries, ([, path]) =>
      Editor.pathRef(editor, path)
    );
    for (const pathRef of pathRefs) {
      const path = pathRef.unref();
      path && increaseListDepth(editor, path);
    }
    return;
  }
  Editor.withoutNormalizing(editor, () => {
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
      if (
        isList(previousNode) &&
        Element.isElement(prevEntry[0]) &&
        (prevEntry[0].type === 'ol_list' || prevEntry[0].type === 'ul_list')
      ) {
        path = [...prevEntry[1], prevEntry[0].children.length];
      }
    } else if (nextEntry) {
      const [nextNode] = nextEntry;
      if (isList(nextNode)) {
        path = [...nextEntry[1], 0];
      }
    }
    if (path) {
      Transforms.moveNodes(editor, { at: listItemPath, to: path });
      return;
    }
    // Else, wrap the item in a new list
    if (
      Element.isElement(parentList) &&
      (parentList.type === 'ol_list' || parentList.type === 'ul_list')
    ) {
      Transforms.wrapNodes(
        editor,
        { type: parentList.type, children: [] },
        { at: listItemPath }
      );
    }
  });
};

/**
 *  Decreases the depth of the current list item in the selection:
 *  If the parent list is the top level list, unwrap the list item.
 *  Always unwraps the list
 */
const decreaseListDepth = (
  editor: Editor & ListEditor,
  at?: Location
): void => {
  // If the provided location is a range, we perform the operation on
  // every list item in the range
  if (Range.isRange(at || editor.selection)) {
    const listItemEntries = Editor.nodes(editor, {
      at: at,
      match: nodeType('list_item'),
    });
    const pathRefs = Array.from(listItemEntries, ([, path]) =>
      Editor.pathRef(editor, path)
    );
    for (const pathRef of pathRefs) {
      const path = pathRef.unref();
      path && decreaseListDepth(editor, path);
    }
    return;
  }
  const listEntry = getListItem(editor, at);
  const parentEntry = getParentList(editor, at);
  if (!parentEntry || !listEntry || !editor.selection) {
    return;
  }
  const [parentList] = parentEntry;
  const [, listItemPath] = listEntry;

  if (!Element.isElement(parentList)) {
    return;
  }

  const listItemPathRef = Editor.pathRef(editor, listItemPath);

  const depth = getListDepth(editor, listItemPath);
  Transforms.unwrapNodes(editor, {
    match: nodeType(parentList.type),
    at: listItemPath,
    split: true,
  });
  if (depth === 1) {
    const listItemPath = listItemPathRef.unref();
    if (listItemPath) {
      const [blockEntry] = Editor.nodes(editor, {
        at: listItemPath,
        match: (n: Node) => Editor.isBlock(editor, n),
        mode: 'lowest',
      });
      Transforms.unwrapNodes(editor, {
        match: (n: Node) =>
          Element.isElement(n) &&
          ['ol_list', 'ul_list', 'list_item'].includes(n.type),
        at: blockEntry[1],
      });
    }
  }
};

/**
 *  Sets the type of the list at the location specified. Defaults to current selection
 *  If there is no list, wraps the current block in a list of the specified type
 */
const setListType = (editor: Editor & ListEditor, listType: ListType): void => {
  Editor.withoutNormalizing(editor, () => {
    let parentList = getParentList(editor);

    // If there is no parentList, we check for a list in the current selection
    if (!parentList) {
      [parentList] = Editor.nodes(editor, {
        match: isList,
        mode: 'highest',
      });
    }

    if (parentList) {
      const [listNode] = parentList;
      // If the list is not the right type, we just change it
      if (Element.isElement(listNode) && listNode.type != listType) {
        Transforms.setNodes(
          editor,
          { type: listType },
          { match: isList, mode: 'lowest' }
        );
      } else {
        // We go through all the selected blocks that are not list blocks
        const selectedBlocks = Editor.nodes(editor, {
          match: (n: Node) =>
            Editor.isBlock(editor, n) && n.type !== 'list_item' && !isList(n),
        });
        const pathRefs = Array.from(selectedBlocks, ([, path]) =>
          Editor.pathRef(editor, path)
        );

        let change = false;

        for (const pathRef of pathRefs) {
          const path = pathRef.unref();
          if (path) {
            // If the parent element is not a list, we wrap it in a list
            const parent = Editor.parent(editor, path);
            if (
              parent &&
              Element.isElement(parent[0]) &&
              parent[0].type !== 'list_item'
            ) {
              change = true;
              Transforms.wrapNodes(
                editor,
                { type: 'list_item', children: [] },
                { at: path }
              );
              Transforms.wrapNodes(
                editor,
                { type: listType, children: [] },
                { at: path }
              );
              // And then we merge the list elements
              Transforms.mergeNodes(editor, { at: path });
            }
          }
        }

        // If there was not applied any changes (no new list items)
        // We toggle the listType off
        if (!change) {
          const selectedListItems = Editor.nodes(editor, {
            match: nodeType('list_item'),
          });

          const pathRefs = Array.from(selectedListItems, ([, path]) =>
            Editor.pathRef(editor, path)
          );
          for (const pathRef of pathRefs) {
            const path = pathRef.unref();
            if (path) {
              decreaseListDepth(editor, path);
            }
          }
        }
      }
    } else {
      // There is no list in the selection and we can wrap all blocks in a list
      const selectedNodes = Editor.nodes(editor, {
        match: (n: Node) => Element.isElement(n),
      });
      for (const [, nodePath] of selectedNodes) {
        if (!editor.isList({ at: nodePath })) {
          Editor.pathRef(editor, nodePath);
        }
      }
      // Wrap app nodes in a single list
      Transforms.wrapNodes(editor, {
        type: listType,
        children: [],
      });
      // Wrap all the selected blocks in its own list_item
      for (const pathRef of Editor.pathRefs(editor)) {
        const path = pathRef.unref();
        if (path) {
          Transforms.wrapNodes(
            editor,
            {
              type: 'list_item',
              children: [],
            },
            { at: path }
          );
        }
      }
    }
  });
};

export default editList;
