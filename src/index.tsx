import * as React from "react";
import { Editor as SlateEditor, RenderMarkProps, RenderNodeProps, RenderAttributes, Plugin } from "slate-react";
import * as Slate from "slate";
import isHotKey from "is-hotkey";
import Toolbar from "./components/Toolbar";
import { BoldMark, ItalicMark, UnderlineMark, CodeMark } from "./components/marks";
import editList from "./plugins/editList";
import pasteLink from "./plugins/pasteLink";
import images from "./plugins/images";
import markdownShortcuts from "./plugins/markdown";
import { html } from "./serializer";
import schema from "./schema";

interface Props {
  value: string;
  disabled?: boolean;
  simple?: boolean;
  onChange?: (arg0: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}

interface State {
  value: string;
  editorValue: Slate.Value | null;
}

const DEFAULT_BLOCK = "paragraph";
export type Next = () => any;

// Simply enables the user to insert tabs when editing
// TODO switch tabs for spaces in code blocks, make backspace remove two spaces
function insertTab(options?: object): Plugin {
  return {
    onKeyDown(e: Event, editor: Slate.Editor, next: Next): Editor | undefined {
      const event = e as KeyboardEvent;
      if (event.key == "Tab") {
        event.preventDefault();
        editor.insertText("\t");
      } else {
        return next();
      }
    },
  };
}

/*
 *  softEnter(Array<string>) => onKeyDown()
 *  A plugin that enables soft enter if selection has blocks
 *  of a type specified. Takes an array of types as its only argument
 *  TODO consider adding soft enter on shift for paragraphs and removing the need for shift+enter in
 *  lists
 */

function softEnter(types: string[]): Plugin {
  return {
    onKeyDown(e: Event, editor: Slate.Editor, next: () => void): void {
      const event = e as KeyboardEvent;
      if (!editor.value.blocks.some(block => block !== undefined && types.includes(block.type))) {
        return next();
      }
      if (event.key == "Enter") {
        // if user is holding shift, default behaviour, (new block)
        if (event.shiftKey) {
          return next();
        }
        event.preventDefault();
        editor.insertText("\n");
      } else {
        return next();
      }
    },
  };
}

// A set of commands and queries to edit links
const linkCommands = {
  commands: {
    // wrap current selection in a link
    wrapLink: (editor: Slate.Editor, url: string) => editor.wrapInline({ data: { url: url, text: url }, type: "link" }),
    // unwrap the link in the current selection
    unwrapLink: (editor: Slate.Editor) => editor.unwrapInline("link"),
  },
  queries: {
    // returns true if there is a link in the current selection
    isLinkActive: (editor: Slate.Editor): boolean =>
      editor.value.inlines.some(inline => inline != undefined && inline.type == "link"),
  },
};

const basePlugin = {
  commands: {
    // Toggles the block type of everything except lists
    toggleBlock: (editor: Slate.Editor, type: string) => {
      if (type !== "ul_list" && type !== "ol_list") {
        const isActive = editor.query("hasBlock", type);
        return isActive ? editor.setBlocks(DEFAULT_BLOCK) : editor.setBlocks(type);
      }
      return editor;
    },
  },
  queries: {
    // returns true if there exists a block of type 'type' in the current selection
    hasBlock: (editor: Slate.Editor, type: string): boolean => {
      const { value } = editor;
      return value.blocks.some((node: Slate.Block | undefined) => node !== undefined && node.type == type);
    },
    getCurrentBlock: (editor: Slate.Editor): Slate.Node => editor.value.startBlock,
  },
};

const plugins = [
  basePlugin,
  editList(),
  insertTab(),
  softEnter(["code-block"]),
  linkCommands,
  pasteLink(),
  images(),
  markdownShortcuts,
];

export default class Editor extends React.Component<Props, State> {
  state = {
    editorValue: this.props.value
      ? html.deserialize(this.props.value)
      : Slate.Value.fromJSON({
          document: {
            nodes: [
              {
                object: "block",
                type: "paragraph",
                nodes: [
                  {
                    object: "text",
                    leaves: [],
                  },
                ],
              },
            ],
          },
        }),
    value: this.props.value,
  };

  onChange = ({ value: value }: { value: Slate.Value }): void => {
    this.setState({ editorValue: value });
    this.props.onChange && this.props.onChange(html.serialize(value));
  };

  onKeyDown = (event: Event, editor: Slate.Editor, next: Next): Slate.Editor | void => {
    const e = event as KeyboardEvent;
    if (!isHotKey("mod")(e)) {
      return next();
    }

    switch (e.key) {
      case "b": {
        e.preventDefault();
        editor.toggleMark("bold");
        break;
      }
      case "i": {
        e.preventDefault();
        editor.toggleMark("italic");
        break;
      }
      case "l": {
        e.preventDefault();
        editor.command("setListType", "ul_list");
        break;
      }
      case "z": {
        e.preventDefault();
        editor.undo();
        break;
      }
      case "r": {
        e.preventDefault();
        editor.redo();
        break;
      }
      default: {
        return next();
      }
    }
  };

  // Components to be rendered for mark nodes
  private renderMark = (props: RenderMarkProps, editor: Slate.Editor, next: Next) => {
    switch (props.mark.type) {
      case "bold":
        return <BoldMark {...props} />;
      case "italic":
        return <ItalicMark {...props} />;
      case "underline":
        return <UnderlineMark {...props} />;
      case "code":
        return <CodeMark {...props} />;
      default:
        return next();
    }
  };

  // Components te be rendered for block nodes
  private renderBlock = (props: RenderNodeProps, editor: Slate.Editor, next: Next) => {
    const { attributes, node, children } = props;
    switch (node.type) {
      case "paragraph":
        return (
          <p className={"paragraph"} {...attributes}>
            {children}
          </p>
        );
      case "h1":
        return <h1 {...attributes}>{children}</h1>;
      case "h2":
        return <h2 {...attributes}>{children}</h2>;
      case "h3":
        return <h3 {...attributes}>{children}</h3>;
      case "h4":
        return <h4 {...attributes}>{children}</h4>;
      case "h5":
        return <h5 {...attributes}>{children}</h5>;
      case "ul_list":
        return (
          <ul className={"ul_list"} {...attributes}>
            {children}
          </ul>
        );
      case "ol_list":
        return (
          <ol className={"ol_list"} {...attributes}>
            {children}
          </ol>
        );
      case "list_item":
        return (
          <li className={"li"} {...attributes}>
            {children}
          </li>
        );
      case "code-block":
        return (
          <pre {...attributes}>
            <code>{children}</code>
          </pre>
        );
      default:
        return next();
    }
  };

  // Components to be rendered for inline nodes
  private renderInline = (props: RenderNodeProps, editor: Slate.Editor, next: Next) => {
    const { attributes, node, children } = props;
    switch (node.type) {
      case "link":
        return (
          <a {...attributes} href={node.data.get("url")}>
            {children}
          </a>
        );
      default:
        return next();
    }
  };

  // Render function for how the editor should render
  // practical for passing props and the 'editor' prop to other components
  private renderEditor = (props: RenderAttributes, editor: Slate.Editor, next: Next) => {
    const children = next();
    return (
      <>
        {!this.props.disabled && !this.props.simple && <Toolbar editor={editor} />}
        {children}
      </>
    );
  };

  // Calling onBlur and onFocus methods passed down (optional)
  // via props to make the editor work with redux-form, (or any other handlers)
  // These methods need to by async because slates event handlers need to be called
  // before redux-forms handlers.
  private async onFocus(event: Event, editor: Slate.Editor, next: Next) {
    event.preventDefault();
    await next();
    if (this.props.onFocus) {
      await this.props.onFocus();
    }
  }

  private async onBlur(event: Event, editor: Slate.Editor, next: Next) {
    event.preventDefault();
    await next();
    if (this.props.onBlur) {
      await this.props.onBlur();
    }
  }

  render() {
    return (
      <div className={this.props.disabled || this.props.simple ? "disabled" : "styles.root"}>
        <SlateEditor
          onFocus={this.onFocus.bind(this)}
          onBlur={this.onBlur.bind(this)}
          autoFocus={this.props.autoFocus}
          renderEditor={this.renderEditor}
          value={this.state.editorValue}
          plugins={plugins}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
          schema={schema}
          renderMark={this.renderMark}
          renderBlock={this.renderBlock}
          renderInline={this.renderInline}
          readOnly={this.props.disabled}
          placeholder={this.props.placeholder}
        />
      </div>
    );
  }
}
