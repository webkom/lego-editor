import * as React from "react";
import { Editor, Inline, Block } from "slate";
import ImageUpload from "./ImageUpload";

interface ButtonProps {
  handler: (e: React.PointerEvent) => void;
  active?: boolean;
}

class ToolbarButton extends React.Component<ButtonProps, {}> {
  handleClick(e: React.PointerEvent): void {
    this.props.handler(e);
  }

  render(): React.ReactNode {
    const { children, active } = this.props;

    const className = active ? "_legoEditor.Toolbar.active" : "_legoEditor.Toolbar.inactive";

    return (
      <button className={className} onPointerDown={e => this.handleClick(e)} type="button">
        {children}
      </button>
    );
  }
}

interface LinkInputProps {
  active: boolean;
  activeLink?: Inline;
  toggleLinkInput: () => void;
  updateLink: ({ url }: { url: string }) => void;
}

interface LinkInputState {
  value: string;
}

class LinkInput extends React.Component<LinkInputProps, LinkInputState> {
  private input = React.createRef<HTMLInputElement>();

  state = {
    value: this.props.activeLink ? this.props.activeLink.data.get("url") : "",
  };

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO move this to onInput
    //if (e.key == "Enter") {
    //this.submit(e);
    //return;
    //}
    this.setState({ value: e.currentTarget.value });
  };

  submit = (e: React.FocusEvent | React.MouseEvent) => {
    e.preventDefault();
    const { value } = this.state;
    this.props.toggleLinkInput();
    if (value == "") {
      return;
    }
    this.props.updateLink({ url: value });
  };

  componentDidMount(): void {
    if (this.input.current) {
      this.input.current.focus();
    }
  }

  render(): React.ReactNode {
    return (
      <div className={"_legoEditor.Toolbar.linkInput"}>
        <input
          type="link"
          placeholder="Link"
          ref={this.input}
          onBlur={this.submit}
          onChange={this.onChange}
          value={this.state.value}
        />
        <button onClick={this.submit}>Lagre</button>
      </div>
    );
  }
}

interface ToolbarProps {
  editor: Editor;
}

interface ToolbarState {
  insertingLink: boolean;
  insertingImage: boolean;
}

export default class Toolbar extends React.Component<ToolbarProps, ToolbarState> {
  state = {
    insertingLink: false,
    insertingImage: false,
  };

  checkActiveMark(type: string): boolean {
    const { editor } = this.props;
    return editor.value.activeMarks.some(mark => mark != undefined && mark.type === type);
  }

  checkActiveBlock(type: string): boolean {
    const { editor } = this.props;
    const { document } = editor.value;

    if (type == "ol_list" || type == "ul_list") {
      if (!editor.value.startBlock) {
        return false;
      }
      const parentList = document.getClosest(
        editor.value.startBlock.key,
        a => a.object == "block" && (a.type == "ol_list" || a.type == "ul_list"),
      ) as Block;

      return parentList && parentList.type === type;
    }

    return editor.value.blocks.some(block => block != undefined && block.type === type);
  }

  checkActiveInline(type: string): boolean {
    const { editor } = this.props;
    return editor.value.inlines.some(inline => inline != undefined && inline.type === type);
  }

  setListType(e: React.PointerEvent, type: string): void {
    const { editor } = this.props;
    e.preventDefault();
    // TODO remove with updated types
    // @ts-ignore
    editor.command("setListType", editor.query("getCurrentBlock").key, type);
  }

  increaseIndent(e: React.PointerEvent): void {
    const { editor } = this.props;
    e.preventDefault();
    if (editor.query("isList")) {
      // TODO remove with updated types
      // @ts-ignore
      editor.command("increaseListDepth", editor.query("getCurrentBlock").key);
    } else {
      editor.insertText("\t");
    }
  }

  decreaseIndent(e: React.PointerEvent): void {
    const { editor } = this.props;
    e.preventDefault();
    if (editor.query("isList")) {
      // TODO remove with updated types
      // @ts-ignore
      editor.command("decreaseListDepth", editor.query("getCurrentBlock").key);
    }
  }

  toggleMark(e: React.PointerEvent, type: string): void {
    e.preventDefault();
    const { editor } = this.props;

    editor.toggleMark(type);
  }

  toggleBlock(e: React.PointerEvent, type: string): void {
    e.preventDefault();
    const { editor } = this.props;

    editor.command("toggleBlock", type);
  }

  toggleLinkInput(): void {
    this.setState({ insertingLink: !this.state.insertingLink });
  }

  updateLink(data: { url: string }): void {
    const { editor } = this.props;
    const { selection } = editor.value;
    const { start, isCollapsed } = selection;

    if (this.checkActiveInline("link")) {
      // @ts-ignore
      editor.setNodeByKey(this.getCurrentLink().key, { data, type: "link" });
    } else {
      if (isCollapsed) {
        editor
          .insertText(data.url)
          .moveAnchorTo(start.offset)
          .moveFocusTo(start.offset + data.url.length);
      }
      editor.command("wrapLink", data.url);
    }
  }

  getCurrentLink(): Inline | undefined {
    const { editor } = this.props;

    if (!this.checkActiveInline("link")) {
      return undefined;
    }

    // @ts-ignore - previous line already checks that inline is not undefined
    return editor.value.inlines.find(inline => inline.type == "link");
  }

  insertImage(e: React.PointerEvent): void {
    e.preventDefault();
    this.setState({ insertingImage: true });
  }

  onClose(): void {
    this.setState({ insertingImage: false });
  }

  onSubmit(image: Blob): void {
    const { editor } = this.props;
    editor.command("insertImage", image);
  }

  render(): React.ReactNode {
    const { insertingLink, insertingImage } = this.state;

    return (
      <div className={"_legoEditor.Toolbar.root"}>
        <ToolbarButton active={this.checkActiveBlock("h1")} handler={e => this.toggleBlock(e, "h1")}>
          H1
        </ToolbarButton>
        <ToolbarButton active={this.checkActiveBlock("h4")} handler={e => this.toggleBlock(e, "h4")}>
          H4
        </ToolbarButton>
        <ToolbarButton active={this.checkActiveMark("bold")} handler={e => this.toggleMark(e, "bold")}>
          <i className="fa fa-bold" />
        </ToolbarButton>{" "}
        <ToolbarButton active={this.checkActiveMark("italic")} handler={e => this.toggleMark(e, "italic")}>
          <i className="fa fa-italic" />
        </ToolbarButton>
        <ToolbarButton active={this.checkActiveMark("underline")} handler={e => this.toggleMark(e, "underline")}>
          <i className="fa fa-underline" />
        </ToolbarButton>
        <ToolbarButton active={this.checkActiveMark("code")} handler={e => this.toggleMark(e, "code")}>
          <i className="fa fa-code" />
        </ToolbarButton>
        <ToolbarButton active={this.checkActiveBlock("code-block")} handler={e => this.toggleBlock(e, "code-block")}>
          <i className="fa fa-file-code-o" />
        </ToolbarButton>
        <ToolbarButton active={this.checkActiveBlock("ul_list")} handler={e => this.setListType(e, "ul_list")}>
          <i className="fa fa-list-ul" />
        </ToolbarButton>
        <ToolbarButton active={this.checkActiveBlock("ol_list")} handler={e => this.setListType(e, "ol_list")}>
          <i className="fa fa-list-ol" />
        </ToolbarButton>
        <ToolbarButton handler={e => this.decreaseIndent(e)}>
          <i className="fa fa-outdent" />
        </ToolbarButton>
        <ToolbarButton handler={e => this.increaseIndent(e)}>
          <i className="fa fa-indent" />
        </ToolbarButton>
        <ToolbarButton active={this.checkActiveInline("link")} handler={this.toggleLinkInput}>
          <i className="fa fa-link" />
        </ToolbarButton>
        {insertingLink && (
          <LinkInput
            active={this.checkActiveMark("link")}
            toggleLinkInput={() => this.toggleLinkInput()}
            updateLink={(...args) => this.updateLink(...args)}
            activeLink={this.getCurrentLink()}
          />
        )}
        <ToolbarButton handler={e => this.insertImage(e)} active={insertingImage}>
          <i className="fa fa-image" />
        </ToolbarButton>
        {insertingImage && <ImageUpload />}
      </div>
    );
  }
}
