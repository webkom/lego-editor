import React, { useState } from 'react';
import { Editor, NodeEntry, Range, Node } from 'slate';
import { useSlate } from 'slate-react';
import { LEditor, Marks, Elements, nodeType } from '../index';
import ImageUpload from './ImageUpload';
import cx from 'classnames';
import isUrl from 'is-url';

interface ButtonProps
  extends React.ComponentPropsWithoutRef<React.FunctionComponent> {
  handler: (e: React.PointerEvent) => void;
  active?: boolean;
}

const ToolbarButton = (props: ButtonProps): JSX.Element => {
  const handleClick = (e: React.PointerEvent): void => {
    props.handler(e);
  };

  // https://github.com/yannickcr/eslint-plugin-react/issues/2654
  // eslint-disable-next-line react/prop-types
  const { children, active } = props;

  const className = active ? '_legoEditor_Toolbar_active' : '';
  return (
    <button
      className={cx('_legoEditor_Toolbar_button', className)}
      onPointerDown={(e) => handleClick(e)}
      type="button"
    >
      {children}
    </button>
  );
};

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
    value: this.props.activeLink ? this.props.activeLink[0].url : '',
  };

  onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const prependProtocol = (url: string): string => {
      if (!/^(?:f|ht)tps?:\/\//.test(url)) {
        url = 'http://' + url;
      }
      return url;
    };
    this.setState({ value: prependProtocol(e.currentTarget.value) });
  };

  componentDidMount(): void {
    // Why is this in a setTimeout?
    // - Because why not? (I couldn't make it work without)
    setTimeout(() => this.input.current?.focus(), 10);
  }

  onKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key == 'Enter') {
      this.submit(e);
    }
  };

  submit = (
    e?: React.FocusEvent | React.KeyboardEvent | React.MouseEvent
  ): void => {
    e?.preventDefault();
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
          onBlur={() => validUrl && this.submit}
        />
        <button disabled={!validUrl} onClick={this.submit}>
          Lagre
        </button>
      </div>
    );
  }
}

const Toolbar = (): JSX.Element => {
  const [insertingLink, setInsertingLink] = useState(false);
  const [insertingImage, setInsertingImage] = useState(false);

  const editor = useSlate();

  const [lastSelection, setLastSelection] = useState(editor.selection);

  const checkActiveMark = (type: Marks): boolean =>
    LEditor.isMarkActive(editor, type);

  const checkActiveElement = (type: Elements): boolean =>
    LEditor.isElementActive(editor, type);

  const checkActiveList = (type: 'ol_list' | 'ul_list'): boolean => {
    const [list] = Editor.nodes(editor, {
      match: (n: Node) => n.type === 'ol_list' || n.type === 'ul_list',
      mode: 'lowest',
    });
    return list && list[0].type === type;
  };

  const setListType = (e: React.PointerEvent, type: string): void => {
    e.preventDefault();
    editor.exec({ type: 'toggle_list', listType: type });
  };

  const increaseIndent = (e: React.PointerEvent): void => {
    e.preventDefault();
    if (editor.isList()) {
      editor.exec({ type: 'increase_list_depth' });
    } else {
      editor.exec({ type: 'insert_text', text: '\n' });
    }
  };

  const decreaseIndent = (e: React.PointerEvent): void => {
    e.preventDefault();
    if (editor.isList()) {
      editor.exec({ type: 'decrease_list_depth' });
    }
  };

  const toggleMark = (e: React.PointerEvent, type: Marks): void => {
    e.preventDefault();
    editor.exec({ type: 'toggle_mark', mark: type });
  };

  const toggleBlock = (e: React.PointerEvent, type: string): void => {
    e.preventDefault();
    editor.exec({ type: 'toggle_block', block: type });
  };

  const toggleLinkInput = (): void => {
    setLastSelection(editor.selection);
    setInsertingLink(!insertingLink);
  };

  const updateLink = (data: { url: string }): void => {
    const { url } = data;

    const isCollapsed = lastSelection && Range.isCollapsed(lastSelection);

    if (checkActiveElement('link')) {
      Editor.setNodes(editor, { url }, { match: nodeType('link') });
    } else {
      if (isCollapsed) {
        Editor.insertNodes(editor, {
          type: 'link',
          url,
          children: [{ text: url }],
          at: lastSelection,
        });
      } else {
        editor.exec({ type: 'wrap_link', url: data.url, at: lastSelection });
      }
    }
  };

  const getCurrentLink = (): NodeEntry | undefined => {
    const [match] = Editor.nodes(editor, {
      match: nodeType('link'),
      mode: 'all',
    });
    return match;
  };

  const openImageUploader = (e: React.PointerEvent): void => {
    e.preventDefault();
    setLastSelection(editor.selection);
    setInsertingImage(true);
  };

  const insertImage = (image: Blob, data?: Record<string, unknown>): void => {
    editor.exec({
      type: 'insert_image',
      file: image,
      at: lastSelection,
      ...data,
    });
    setInsertingImage(false);
  };

  return (
    <div className="_legoEditor_Toolbar_root">
      <ToolbarButton
        active={checkActiveElement('h1')}
        handler={(e) => toggleBlock(e, 'h1')}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveElement('h3')}
        handler={(e) => toggleBlock(e, 'h3')}
      >
        H3
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveMark('bold')}
        handler={(e) => toggleMark(e, 'bold')}
      >
        <i className="fa fa-bold" />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveMark('italic')}
        handler={(e) => toggleMark(e, 'italic')}
      >
        <i className="fa fa-italic" />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveMark('underline')}
        handler={(e) => toggleMark(e, 'underline')}
      >
        <i className="fa fa-underline" />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveMark('code')}
        handler={(e) => toggleMark(e, 'code')}
      >
        <i className="fa fa-code" />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveElement('code_block')}
        handler={(e) => toggleBlock(e, 'code_block')}
      >
        <i className="fa fa-file-code-o" />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveList('ul_list')}
        handler={(e) => setListType(e, 'ul_list')}
      >
        <i className="fa fa-list-ul" />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveList('ol_list')}
        handler={(e) => setListType(e, 'ol_list')}
      >
        <i className="fa fa-list-ol" />
      </ToolbarButton>
      <ToolbarButton handler={(e) => decreaseIndent(e)}>
        <i className="fa fa-outdent" />
      </ToolbarButton>
      <ToolbarButton handler={(e) => increaseIndent(e)}>
        <i className="fa fa-indent" />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveElement('link')}
        handler={() => toggleLinkInput()}
      >
        <i className="fa fa-link" />
      </ToolbarButton>
      {insertingLink && (
        <LinkInput
          active={checkActiveElement('link')}
          toggleLinkInput={() => toggleLinkInput()}
          updateLink={(...args) => updateLink(...args)}
          activeLink={getCurrentLink()}
        />
      )}
      <ToolbarButton
        handler={(e) => openImageUploader(e)}
        active={insertingImage}
      >
        <i className="fa fa-image" />
      </ToolbarButton>
      {insertingImage && (
        <ImageUpload
          uploadFunction={(img) => insertImage(img)}
          cancel={() => setInsertingImage(false)}
        />
      )}
    </div>
  );
};

export default Toolbar;
