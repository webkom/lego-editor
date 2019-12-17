import * as React from 'react';
import { Element, Editor, NodeEntry } from 'slate';
import { LEditor, Marks, Elements, nodeType } from '../index';
import ImageUpload from './ImageUpload';
import cx from 'classnames';
import isUrl from 'is-url';

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

    const className = active ? '_legoEditor_Toolbar_active' : '';

    return (
      <button
        className={cx('_legoEditor_Toolbar_button', className)}
        onPointerDown={e => this.handleClick(e)}
        type="button"
      >
        {children}
      </button>
    );
  }
}

interface LinkInputProps {
  active: boolean;
  activeLink?: NodeEntry;
  toggleLinkInput: () => void;
  updateLink: ({ url }: { url: string }) => void;
}

interface LinkInputState {
  value: string;
}

class LinkInput extends React.Component<LinkInputProps, LinkInputState> {
  private input = React.createRef<HTMLInputElement>();

  state = {
    value: this.props.activeLink ? this.props.activeLink[0].url : ''
  };

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ value: e.currentTarget.value });
  };

  onKeyPress = (e: React.KeyboardEvent) => {
    if (e.key == 'Enter') {
      this.submit(e);
    }
  };

  submit = (e: React.FocusEvent | React.KeyboardEvent | React.MouseEvent) => {
    e.preventDefault();
    const { value } = this.state;
    this.props.toggleLinkInput();
    if (value == '') {
      return;
    }
    this.props.updateLink({ url: value });
  };

  render(): React.ReactNode {
    const validUrl = isUrl(this.state.value);
    return (
      <div className={'_legoEditor_Toolbar_linkInput'}>
        <input
          type="link"
          placeholder="Link"
          ref={this.input}
          onChange={this.onChange}
          onKeyDown={this.onKeyPress}
          value={this.state.value}
        />
        <button disabled={!validUrl} onClick={this.submit}>
          Lagre
        </button>
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

export default class Toolbar extends React.Component<
  ToolbarProps,
  ToolbarState
> {
  state = {
    insertingLink: false,
    insertingImage: false
  };

  checkActiveMark(type: Marks): boolean {
    const { editor } = this.props;
    return LEditor.isMarkActive(editor, type);
  }

  checkActiveElement(type: Elements): boolean {
    const { editor } = this.props;
    return LEditor.isElementActive(editor, type);
  }

  setListType(e: React.PointerEvent, type: string): void {
    const { editor } = this.props;
    e.preventDefault();
    editor.exec({ type: 'toggle_list', listType: type });
  }

  increaseIndent(e: React.PointerEvent): void {
    const { editor } = this.props;
    e.preventDefault();
    if (editor.query('isList')) {
      editor.command('increaseListDepth', editor.query('getCurrentBlock').key);
    } else {
      editor.insertText('\t');
    }
  }

  decreaseIndent(e: React.PointerEvent): void {
    const { editor } = this.props;
    e.preventDefault();
    if (editor.query('isList')) {
      editor.command('decreaseListDepth', editor.query('getCurrentBlock').key);
    }
  }

  toggleMark(e: React.PointerEvent, type: Marks): void {
    e.preventDefault();
    const { editor } = this.props;

    editor.exec({ type: 'toggle_mark', mark: type });
  }

  toggleBlock(e: React.PointerEvent, type: string): void {
    e.preventDefault();
    const { editor } = this.props;

    editor.exec({ type: 'toggle_block', block: type });
  }

  toggleLinkInput(): void {
    this.setState({ insertingLink: !this.state.insertingLink });
  }

  updateLink(data: { url: string }): void {
    const { editor } = this.props;
    const { selection } = editor.value;
    const { start, isCollapsed } = selection;
    const { url } = data;

    if (this.checkActiveElement('link')) {
      Editor.setNodes(editor, { url }, { match: nodeType('link') });
    } else {
      if (isCollapsed) {
        // TODO
        editor
          .insertText(data.url)
          .moveAnchorTo(start.offset)
          .moveFocusTo(start.offset + data.url.length);
      }
      editor.exec({ type: 'wrapLink', url: data.url });
    }
  }

  getCurrentLink(): NodeEntry | undefined {
    const { editor } = this.props;

    const [match] = Editor.nodes(editor, {
      match: nodeType('link'),
      mode: 'all'
    });
    return match;
  }

  openImageUploader(e: React.PointerEvent): void {
    e.preventDefault();
    this.setState({ insertingImage: true });
  }

  insertImage(image: Blob, data?: Record<string, any>): void {
    const { editor } = this.props;

    this.setState({ insertingImage: false });
    console.log(data);
    editor.exec({ type: 'insert_image', file: image, ...data });
  }

  onClose(): void {
    this.setState({ insertingImage: false });
  }

  onSubmit(image: Blob): void {
    const { editor } = this.props;
    editor.command('insertImage', image);
  }

  render(): React.ReactNode {
    const { insertingLink, insertingImage } = this.state;

    return (
      <div className="_legoEditor_Toolbar_root">
        <ToolbarButton
          active={this.checkActiveElement('h1')}
          handler={e => this.toggleBlock(e, 'h1')}
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          active={this.checkActiveElement('h4')}
          handler={e => this.toggleBlock(e, 'h4')}
        >
          H4
        </ToolbarButton>
        <ToolbarButton
          active={this.checkActiveMark('bold')}
          handler={e => this.toggleMark(e, 'bold')}
        >
          <i className="fa fa-bold" />
        </ToolbarButton>
        <ToolbarButton
          active={this.checkActiveMark('italic')}
          handler={e => this.toggleMark(e, 'italic')}
        >
          <i className="fa fa-italic" />
        </ToolbarButton>
        <ToolbarButton
          active={this.checkActiveMark('underline')}
          handler={e => this.toggleMark(e, 'underline')}
        >
          <i className="fa fa-underline" />
        </ToolbarButton>
        <ToolbarButton
          active={this.checkActiveMark('code')}
          handler={e => this.toggleMark(e, 'code')}
        >
          <i className="fa fa-code" />
        </ToolbarButton>
        <ToolbarButton
          active={this.checkActiveElement('code_block')}
          handler={e => this.toggleBlock(e, 'code_block')}
        >
          <i className="fa fa-file-code-o" />
        </ToolbarButton>
        <ToolbarButton
          active={this.checkActiveElement('ul_list')}
          handler={e => this.setListType(e, 'ul_list')}
        >
          <i className="fa fa-list-ul" />
        </ToolbarButton>
        <ToolbarButton
          active={this.checkActiveElement('ol_list')}
          handler={e => this.setListType(e, 'ol_list')}
        >
          <i className="fa fa-list-ol" />
        </ToolbarButton>
        <ToolbarButton handler={e => this.decreaseIndent(e)}>
          <i className="fa fa-outdent" />
        </ToolbarButton>
        <ToolbarButton handler={e => this.increaseIndent(e)}>
          <i className="fa fa-indent" />
        </ToolbarButton>
        <ToolbarButton
          active={this.checkActiveElement('link')}
          handler={() => this.toggleLinkInput()}
        >
          <i className="fa fa-link" />
        </ToolbarButton>
        {insertingLink && (
          <LinkInput
            active={this.checkActiveElement('link')}
            toggleLinkInput={() => this.toggleLinkInput()}
            updateLink={(...args) => this.updateLink(...args)}
            activeLink={this.getCurrentLink()}
          />
        )}
        <ToolbarButton
          handler={e => this.openImageUploader(e)}
          active={insertingImage}
        >
          <i className="fa fa-image" />
        </ToolbarButton>
        {insertingImage && (
          <ImageUpload
            uploadFunction={img => this.insertImage(img)}
            cancel={() => this.setState({ insertingImage: false })}
          />
        )}
      </div>
    );
  }
}
