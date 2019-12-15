import React, { useMemo, useState, useCallback } from 'react';
import {
  Slate,
  Editable,
  withReact,
  RenderElementProps,
  RenderLeafProps
} from 'slate-react';
import { createEditor, Editor, Command, Element, Node } from 'slate';
import isHotKey from 'is-hotkey';
import Toolbar from './components/Toolbar';
import editList from './plugins/editList';
import links from './plugins/pasteLink';
import images from './plugins/images';
import markdownShortcuts from './plugins/markdown';
//import { html } from './serializer';
import schema from './schema';
import _ from 'lodash';
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
  | 'link';

export const LEditor = {
  isMarkActive(editor: Editor, mark: Marks) {
    const marks = Editor.marks(editor);
    return marks ? marks[mark] === true : false;
  },
  isElementActive(editor: Editor, type: Elements) {
    const [match] = Editor.nodes(editor, { match: { type }, mode: 'all' });
    return !!match;
  },
  hasType(editor: Editor, type: string) {
    if (!editor.selection) {
      return false;
    }
    const match = Editor.match(
      editor,
      editor.selection,
      { type },
      { voids: true }
    );
    return !!match;
  },
  ...Editor
};

/**
 *  A simple plugin that inserts a 'tab' character on pressing tab.
 */
/*
function insertTab(): Plugin {
  return {
    onKeyDown(e: Event, editor: Slate.Editor, next: Next): Editor | undefined {
      const event = e as KeyboardEvent;
      if (event.key == 'Tab') {
        event.preventDefault();
        editor.insertText('\t');
      } else {
        return next();
      }
    }
  };
}
 */

/**
 *  A plugin that enables soft enter if selection has blocks
 *  of a type specified. For all other blocks enables soft enter on
 *  Shift+Enter
 */
const softEnter = (editor: Editor): Editor => {
  const { exec } = editor;
  editor.exec = (command: Command) => {
    if (command.type === 'key_handler') {
      const { event } = command;
      if (
        isHotKey('Enter')(event) &&
        LEditor.isElementActive(editor, 'code_block') &&
        editor.selection !== null
      ) {
        event.preventDefault();
        editor.exec({ type: 'insert_text', text: '\n' });
        Editor.move(editor);
      } else if (isHotKey('Shift+Enter')(event)) {
        event.preventDefault();
        editor.exec({ type: 'insert_text', text: '\n' });
      } else {
        exec(command);
      }
    } else {
      exec(command);
    }
  };
  return editor;
};

const basePlugin = (editor: Editor): Editor => {
  const { exec } = editor;

  editor.exec = (command: Command) => {
    // Toggles the block type of everything except lists
    if (
      command.type === 'toggle_block' &&
      !(command.block === 'ul_list' || command.block === 'ol_list')
    ) {
      const isActive = LEditor.isElementActive(editor, command.block);
      Editor.setNodes(editor, {
        type: isActive ? DEFAULT_BLOCK : command.block
      });
    } else if (command.type === 'toggle_mark') {
      editor.exec({
        type: 'format_text',
        properties: { [command.mark]: true }
      });
    } else {
      exec(command);
    }
  };

  return editor;
};

const initialValue = { type: 'paragraph', children: [{ text: '' }] };

const LegoEditor = (props: Props): JSX.Element => {
  const onChange = (value: Node[]): void => {
    console.log(value);
    setEditorValue(value);
    // Debounce onchange function to improve performance
    //props.onChange && _.debounce(props.onChange, 250)(html.serialize(value));
  };

  const onKeyDown = (event: React.KeyboardEvent): any | void => {
    //@ts-ignore
    const e = event as KeyboardEvent;
    if (isHotKey('mod+b')(e)) {
      e.preventDefault();
      editor.exec({ type: 'toggle_mark', mark: 'bold' });
    } else if (isHotKey('mod+i')(e)) {
      e.preventDefault();
      editor.exec({ type: 'toggle_mark', mark: 'italic' });
    } else if (isHotKey('mod+u')(e)) {
      e.preventDefault();
      editor.exec({ type: 'toggle_mark', mark: 'underline' });
    } else if (isHotKey('mod+l')(e)) {
      e.preventDefault();
      editor.exec({ type: 'toggle_list', list_type: 'ul_list' });
    } else if (isHotKey('mod+z')(e)) {
      e.preventDefault();
      editor.undo();
    } else if (isHotKey('mod+r')(e)) {
      e.preventDefault();
      editor.redo();
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

  const plugins = [
    basePlugin,
    editList,
    //insertTab(),
    softEnter,
    links
    //images({ uploadFunction: props.imageUpload }),
    //markdownShortcuts,
    //...props.plugins
  ].reverse();

  const editor = useMemo(
    () => compose(...plugins, withReact, createEditor)(),
    []
  );
  const [value, setValue] = useState([props.value]);
  const [editorValue, setEditorValue] = useState([
    props.value ? html.deserialize(props.value) : initialValue
  ]);

  return (
    <div
      className={
        props.disabled || props.simple
          ? '_legoEditor_disabled'
          : '_legoEditor_root'
      }
    >
      <Slate editor={editor} value={editorValue} onChange={onChange}>
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

  //<SlateEditor
  //onFocus={this.onFocus.bind(this)}
  //onBlur={this.onBlur.bind(this)}
  //plugins={this.state.plugins}
  //schema={schema}
};

export default LegoEditor;
