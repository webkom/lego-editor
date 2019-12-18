import React, { useMemo, useState, useCallback } from 'react';
import {
  Slate,
  Editable,
  withReact,
  RenderElementProps,
  RenderLeafProps
} from 'slate-react';
import { createEditor, Editor, Element, Node, Location } from 'slate';
import { withHistory } from 'slate-history';
import isHotKey from 'is-hotkey';
import Toolbar from './components/Toolbar';
import ImageBlock from './components/ImageBlock';
import {
  basePlugin,
  insertTab,
  softEnter,
  lists,
  links,
  images,
  markdownShortcuts
} from './plugins';
import { serialize, deserializeHtmlString } from './serializer';
import { debounce } from 'lodash';
import { compose } from 'lodash/fp';

interface Props {
  value: string;
  disabled?: boolean;
  simple?: boolean;
  onChange?: (arg0: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  imageUpload: (file: Blob) => Promise<Record<string, any>>;
  plugins: ((editor: Editor) => Editor)[];
}

export const DEFAULT_BLOCK = 'paragraph';
export type Next = () => any;

export type Marks = 'bold' | 'italic' | 'code' | 'underline';
export type Elements =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'paragraph'
  | 'ul_list'
  | 'ol_list'
  | 'list_item'
  | 'code_block'
  | 'link'
  | 'figure'
  | 'image'
  | 'image_caption';

/**
 *  Returns a function to be used for matching against node types
 */
export const nodeType = (type: Elements): ((node: Node) => boolean) => {
  return (node: Node) => node.type === type;
};

export const LEditor = {
  isMarkActive(editor: Editor, mark: Marks) {
    const marks = Editor.marks(editor);
    return marks ? marks[mark] === true : false;
  },
  isElementActive(editor: Editor, type: Elements, options?: { at?: Location }) {
    const [match] = Editor.nodes(editor, {
      match: nodeType(type),
      at: options?.at
    });
    return !!match;
  },
  hasType(editor: Editor, type: Elements) {
    if (!editor.selection) {
      return false;
    }
    const match = Editor.above(editor, {
      match: nodeType(type),
      voids: true
    });
    return !!match;
  },
  ...Editor
};

const initialValue: Node[] = [{ type: 'paragraph', children: [{ text: '' }] }];

const LegoEditor = (props: Props): JSX.Element => {
  const onChange = (value: Node[]): void => {
    setValue(value);
    // Debounce onchange function to improve performance
    props.onChange && debounce(props.onChange, 250)(serialize(editor));
  };

  const onKeyDown = (event: React.KeyboardEvent): void => {
    // Apparently there is a type mismatch between React.KeyboardEvent
    // and KeyboardEvent included in TS libraries
    const e = (event as unknown) as KeyboardEvent;
    if (isHotKey('mod+b')(e)) {
      e.preventDefault();
      editor.exec({ type: 'toggle_mark', mark: 'bold' });
    } else if (isHotKey('mod+i')(e)) {
      e.preventDefault();
      editor.exec({ type: 'toggle_mark', mark: 'italic' });
    } else if (isHotKey('mod+u')(e)) {
      e.preventDefault();
      editor.exec({ type: 'toggle_mark', mark: 'underline' });
    } else {
      editor.exec({ type: 'key_handler', event: e });
    }
  };

  // Components to be rendered for leaf nodes
  const renderLeaf = (props: RenderLeafProps): JSX.Element => {
    const { leaf } = props;
    let { children } = props;
    if (leaf.bold) {
      children = <strong>{children}</strong>;
    }
    if (leaf.italic) {
      children = <em property="italic">{children}</em>;
    }
    if (leaf.underline) {
      children = <u>{children}</u>;
    }
    if (leaf.code) {
      children = <code>{children}</code>;
    }
    return <span {...props.attributes}>{children}</span>;
  };

  // Components te be rendered for nodes
  const renderElement = (props: RenderElementProps): JSX.Element => {
    const { attributes, children, element } = props;
    switch (element.type) {
      case 'paragraph':
        return (
          <p className={'_legoEditor_paragraph'} {...attributes}>
            {children}
          </p>
        );
      case 'h1':
        return <h1 {...attributes}>{children}</h1>;
      case 'h2':
        return <h2 {...attributes}>{children}</h2>;
      case 'h3':
        return <h3 {...attributes}>{children}</h3>;
      case 'h4':
        return <h4 {...attributes}>{children}</h4>;
      case 'h5':
        return <h5 {...attributes}>{children}</h5>;
      case 'ul_list':
        return (
          <ul className={'_legoEditor_ul_list'} {...attributes}>
            {children}
          </ul>
        );
      case 'ol_list':
        return (
          <ol className={'_legoEditor_ol_list'} {...attributes}>
            {children}
          </ol>
        );
      case 'list_item':
        return (
          <li className={'_legoEditor_li'} {...attributes}>
            {children}
          </li>
        );
      case 'code_block':
        return (
          <pre {...attributes}>
            <code>{children}</code>
          </pre>
        );
      case 'quote':
        return <blockquote {...attributes}>{children}</blockquote>;
      case 'figure':
        return (
          <figure className="_legoEditor_figure" {...attributes}>
            {children}
          </figure>
        );
      case 'image': {
        const src = element.src || element.objectUrl;
        return <ImageBlock src={src} {...props} />;
      }
      case 'image_caption':
        return (
          <figcaption
            className="_legoEditor_figcaption"
            {...attributes}
            placeholder={'Figure caption'}
          >
            {children}
          </figcaption>
        );
      // Inlines
      case 'link':
        return (
          <a {...attributes} href={element.url}>
            {children}
          </a>
        );
      default:
        return <p {...attributes}>{children}</p>;
    }
  };

  // Calling onBlur and onFocus methods passed down (optional)
  // via props to make the editor work with redux-form, (or any other handlers)
  // These methods need to by async because slates event handlers need to be called
  // before redux-forms handlers.
  //const onFocus = (
  //event: Event,
  //editor: Slate.Editor,
  //next: Next
  //): Promise<any> => {
  //await next();
  //if (this.props.onFocus) {
  //await this.props.onFocus();
  //}
  //};

  //const onBlur = (
  //event: Event,
  //editor: Slate.Editor,
  //next: Next
  //): Promise<any> => {
  //await next();
  //if (this.props.onBlur) {
  //await this.props.onBlur();
  //}
  //};

  // Dont remove this or the app won't build!
  const otherPlugins = props.plugins || [];

  const plugins = [
    basePlugin,
    insertTab,
    softEnter,
    lists,
    links,
    images({ uploadFunction: props.imageUpload }),
    markdownShortcuts,
    ...otherPlugins
  ].reverse();

  const editor = useMemo(
    () => compose(...plugins, withHistory, withReact, createEditor)(),
    []
  );

  const [value, setValue] = useState(
    props.value ? deserializeHtmlString(props.value) : initialValue
  );

  return (
    <div
      className={
        props.disabled || props.simple
          ? '_legoEditor_disabled'
          : '_legoEditor_root'
      }
    >
      <Slate editor={editor} value={value} onChange={onChange}>
        {!props.disabled && !props.simple && <Toolbar editor={editor} />}
        <Editable
          onKeyDown={onKeyDown}
          renderElement={useCallback(renderElement, [])}
          renderLeaf={useCallback(renderLeaf, [])}
          placeholder={props.placeholder}
          readOnly={props.disabled}
          autoFocus={props.autoFocus}
        />
      </Slate>
    </div>
  );
};

export default LegoEditor;
