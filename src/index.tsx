import React, { useMemo, useState, useCallback } from 'react';
import {
  Slate,
  Editable,
  withReact,
  RenderElementProps,
  RenderLeafProps,
} from 'slate-react';
import {
  createEditor,
  Editor,
  BaseEditor,
  Node,
  Element,
  Location,
  Descendant,
} from 'slate';
import { withHistory } from 'slate-history';
import isHotKey from 'is-hotkey';
import Toolbar from './components/Toolbar';
import ImageBlock from './components/ImageBlock';
import isInternalLink from './utils/isInternalLink';
import {
  basePlugin,
  insertTab,
  softEnter,
  lists,
  links,
  images,
  markdownShortcuts,
} from './plugins';
import { serialize, deserializeHtmlString } from './serializer';
import { debounce } from 'lodash';
import { compose } from 'lodash/fp';

import { Elements, Mark } from './custom-types';

import './Editor.css';

interface Props {
  value?: string;
  disabled?: boolean;
  simple?: boolean;
  onChange?: (arg0: string) => void;
  onBlur?: (arg0: React.SyntheticEvent) => void;
  onFocus?: (arg0: React.SyntheticEvent) => void;
  autoFocus?: boolean;
  placeholder?: string;
  imageUpload: (file: Blob) => Promise<Record<string, unknown>>;
  plugins?: ((editor: BaseEditor) => BaseEditor)[];
  domParser?: (value: string) => HTMLDocument;
  darkMode?: boolean;
}

export const DEFAULT_BLOCK = 'paragraph';

/**
 *  Returns a function to be used for matching against node types
 */
export const nodeType = (type: Elements): ((node: Node) => boolean) => {
  return (node: Node) => Element.isElement(node) && node.type === type;
};

export const LEditor = {
  isMarkActive(editor: Editor, mark: Mark) {
    const marks = Editor.marks(editor);
    return marks ? marks[mark] === true : false;
  },
  isElementActive(editor: Editor, type: Elements, options?: { at?: Location }) {
    const [match] = Editor.nodes(editor, {
      match: nodeType(type),
      at: options?.at,
    });
    return !!match;
  },
  hasType(editor: Editor, type: Elements) {
    if (!editor.selection) {
      return false;
    }
    const match = Editor.above(editor, {
      match: nodeType(type),
      voids: true,
    });
    return !!match;
  },
  ...Editor,
};

const initialValue: Descendant[] = [
  { type: 'paragraph', children: [{ text: '' }] },
];

// Components to be rendered for leaf nodes
const renderLeaf = (props: RenderLeafProps): JSX.Element => {
  const { leaf } = props;
  let { children } = props;
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  if (leaf.code) {
    children = <code>{children}</code>;
  }
  if (leaf.strikethrough) {
    children = <s>{children}</s>;
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
        <figcaption className="_legoEditor_figcaption" {...attributes}>
          {children}
        </figcaption>
      );
    // Inlines
    case 'link':
      return (
        <a
          {...attributes}
          href={element.url}
          rel={isInternalLink(element.url) ? undefined : 'noopener noreferrer'}
          target={isInternalLink(element.url) ? undefined : '_blank'}
        >
          {children}
        </a>
      );
    case 'ins':
      return <ins className="_legoEditor_inserted">{children}</ins>;
    case 'del':
      return <del className="_legoEditor_deleted">{children}</del>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const LegoEditor = (props: Props): JSX.Element => {
  // Debounce onchange function to improve performance with expensive handlers
  // like redux-form
  const debouncedOnChange = useMemo(
    () => props.onChange && debounce(props.onChange, 250),
    [props.onChange],
  );

  const onChange = (value: Node[]): void => {
    setValue(value);
    debouncedOnChange && debouncedOnChange(serialize(editor));
  };

  const onKeyDown = (event: React.KeyboardEvent): void => {
    // Apparently there is a type mismatch between React.KeyboardEvent
    // and KeyboardEvent included in TS libraries
    const e = event as unknown as KeyboardEvent;
    if (isHotKey('mod+b')(e)) {
      e.preventDefault();
      editor.toggleMark('bold');
    } else if (isHotKey('mod+i')(e)) {
      e.preventDefault();
      editor.toggleMark('italic');
    } else if (isHotKey('mod+u')(e)) {
      e.preventDefault();
      editor.toggleMark('underline');
    } else if (isHotKey('shift+alt+5')(e)) {
      e.preventDefault();
      editor.toggleMark('strikethrough');
    } else {
      editor.keyHandler({ event: e });
    }
  };

  const onFocus = (event: React.SyntheticEvent): void =>
    props.onFocus && props.onFocus(event);

  const onBlur = (event: React.SyntheticEvent): void => {
    editor.savedSelection = editor.selection ?? undefined;
    props.onBlur && props.onBlur(event);
  };

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
    ...otherPlugins,
  ].reverse();

  const editor: Editor = useMemo(
    () => compose(...plugins, withHistory, withReact, createEditor)(),
    [],
  );

  const [value, setValue] = useState(
    props.value
      ? deserializeHtmlString(props.value, {
          domParser: props.domParser,
        })
      : initialValue,
  );

  return (
    <div
      data-theme={props.darkMode ? 'dark' : 'light'}
      className={
        props.disabled || props.simple
          ? '_legoEditor_disabled'
          : '_legoEditor_root'
      }
    >
      <Slate editor={editor} value={value as Descendant[]} onChange={onChange}>
        {!props.disabled && !props.simple && <Toolbar />}
        <Editable
          onKeyDown={onKeyDown}
          renderElement={useCallback(renderElement, [])}
          renderLeaf={useCallback(renderLeaf, [])}
          placeholder={props.placeholder}
          readOnly={props.disabled}
          autoFocus={props.autoFocus}
          onBlur={onBlur}
          onFocus={onFocus}
        />
      </Slate>
    </div>
  );
};

export default LegoEditor;
