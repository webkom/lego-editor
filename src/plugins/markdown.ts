import { Editor } from "slate";

/**
 * On key down, check for our specific key shortcuts.
 */
const MarkdownShortcuts = {
  onKeyDown: (e: Event, editor: Editor, next: () => void) => {
    const event = e as KeyboardEvent;
    switch (event.key) {
      case " ":
        return onSpace(event, editor, next);
      case "Backspace":
        return onBackspace(event, editor, next);
      default:
        return next();
    }
  },
};

const getType = (chars: string): string | null => {
  switch (chars) {
    case "*":
    case "-":
    case "+":
      return "ul_list";
    case "#":
      return "h1";
    case "##":
      return "h2";
    case "###":
      return "h3";
    case "####":
      return "h4";
    case "#####":
      return "h5";
    case "######":
      return "h6";
    default:
      return null;
  }
};
/**
 * On space, if it was after an auto-markdown shortcut, convert the current
 * node into the shortcut's corresponding type.
 */

const onSpace = (event: KeyboardEvent, editor: Editor, next: () => void): any => {
  const { value } = editor;
  const { selection } = value;
  if (selection.isExpanded) {
    return next();
  }

  const { startBlock } = value;
  const { start } = selection;
  const chars = startBlock.text.slice(0, start.offset).replace(/\s*/g, "");
  const type = getType(chars);
  if (!type) {
    return next();
  }
  if (type === "ul_list" && editor.query("isList")) {
    return next();
  }
  event.preventDefault();

  editor.setBlocks(type);

  if (type === "ul_list") {
    editor.command("setListType", type);
  }

  editor.moveFocusToStartOfNode(startBlock).delete();
};

/**
 * On backspace, if at the start of a non-paragraph, convert it back into a
 * paragraph node.
 */

const onBackspace = (event: KeyboardEvent, editor: Editor, next: () => void): any => {
  const { value } = editor;
  const { selection } = value;
  if (selection.isExpanded) {
    return next();
  }
  if (selection.start.offset !== 0) {
    return next();
  }

  const { startBlock } = value;
  if (startBlock.type === "paragraph") {
    return next();
  }

  event.preventDefault();
  editor.setBlocks("paragraph");
};

export default MarkdownShortcuts;
