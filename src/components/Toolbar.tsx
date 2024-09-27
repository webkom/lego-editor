import { Icon } from '@webkom/lego-bricks';
import React, { useState } from 'react';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Image,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link,
  List,
  ListOrdered,
  SquareCode,
  Strikethrough,
  Underline,
} from 'lucide-react';
import { Editor, NodeEntry, Range, Node, Element, Transforms } from 'slate';
import { useSlate } from 'slate-react';
import { LEditor, nodeType } from '../index';
import type { Mark, Elements } from '../custom-types';
import ImageUpload from './ImageUpload';
import LinkInput from './LinkInput';
import cx from 'classnames';

import './Toolbar.css';

interface ButtonProps extends React.PropsWithChildren {
  handler: (e: React.PointerEvent) => void;
  active?: boolean;
}

const ToolbarButton = (props: ButtonProps): JSX.Element => {
  const handleClick = (e: React.PointerEvent): void => {
    props.handler(e);
  };

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

const Toolbar = (): JSX.Element => {
  const [insertingLink, setInsertingLink] = useState(false);
  const [insertingImage, setInsertingImage] = useState(false);

  const editor = useSlate();

  const [lastSelection, setLastSelection] = useState(editor.selection);

  const checkActiveMark = (type: Mark): boolean =>
    LEditor.isMarkActive(editor, type);

  const checkActiveElement = (type: Elements): boolean =>
    LEditor.isElementActive(editor, type);

  const checkActiveList = (type: 'ol_list' | 'ul_list'): boolean => {
    const [list] = Editor.nodes(editor, {
      match: (n: Node) =>
        Element.isElement(n) && (n.type === 'ol_list' || n.type === 'ul_list'),
      mode: 'lowest',
    });
    return list && Element.isElement(list[0]) && list[0].type === type;
  };

  const setListType = (
    e: React.PointerEvent,
    type: 'ul_list' | 'ol_list',
  ): void => {
    e.preventDefault();
    editor.toggleList(type);
  };

  const increaseIndent = (e: React.PointerEvent): void => {
    e.preventDefault();
    if (editor.isList()) {
      editor.increaseListDepth();
    } else {
      editor.insertText('\n');
    }
  };

  const decreaseIndent = (e: React.PointerEvent): void => {
    e.preventDefault();
    if (editor.isList()) {
      editor.decreaseListDepth();
    }
  };

  const toggleMark = (e: React.PointerEvent, type: Mark): void => {
    e.preventDefault();
    editor.toggleMark(type);
  };

  const toggleBlock = (e: React.PointerEvent, type: Elements): void => {
    e.preventDefault();
    editor.toggleBlock(type);
  };

  const toggleLinkInput = (): void => {
    setLastSelection(editor.selection);
    setInsertingLink(!insertingLink);
  };

  const updateLink = (data: { url: string; text?: string }): void => {
    const { url, text } = data;

    const isCollapsed = lastSelection && Range.isCollapsed(lastSelection);

    if (checkActiveElement('link')) {
      Transforms.setNodes(
        editor,
        { url, text: text || url },
        { match: nodeType('link') },
      );
    } else {
      if (isCollapsed) {
        Transforms.insertNodes(
          editor,
          {
            type: 'link',
            url,
            children: [{ text: text || url }],
          },
          {
            at: lastSelection || undefined,
          },
        );
      } else {
        editor.wrapLink(data.url, lastSelection || undefined);
      }
    }
  };

  const getCurrentLink = (): NodeEntry | undefined => {
    const [match] = Editor.nodes(editor, {
      match: nodeType('link'),
      mode: 'all',
      at: lastSelection?.anchor,
    });
    return match;
  };

  const openImageUploader = (e: React.PointerEvent): void => {
    e.preventDefault();
    setLastSelection(editor.selection);
    setInsertingImage(true);
  };

  const insertImage = (image: Blob, data?: Record<string, unknown>): void => {
    editor.insertImage({
      file: image,
      at: lastSelection || undefined,
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
        <Icon iconNode={<Heading1 />} />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveElement('h2')}
        handler={(e) => toggleBlock(e, 'h2')}
      >
        <Icon iconNode={<Heading2 />} />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveElement('h3')}
        handler={(e) => toggleBlock(e, 'h3')}
      >
        <Icon iconNode={<Heading3 />} />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveElement('h4')}
        handler={(e) => toggleBlock(e, 'h4')}
      >
        <Icon iconNode={<Heading4 />} />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveMark('bold')}
        handler={(e) => toggleMark(e, 'bold')}
      >
        <Icon iconNode={<Bold />} />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveMark('italic')}
        handler={(e) => toggleMark(e, 'italic')}
      >
        <Icon iconNode={<Italic />} />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveMark('underline')}
        handler={(e) => toggleMark(e, 'underline')}
      >
        <Icon iconNode={<Underline />} />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveMark('strikethrough')}
        handler={(e) => toggleMark(e, 'strikethrough')}
      >
        <Icon iconNode={<Strikethrough />} />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveMark('code')}
        handler={(e) => toggleMark(e, 'code')}
      >
        <Icon iconNode={<Code />} />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveElement('code_block')}
        handler={(e) => toggleBlock(e, 'code_block')}
      >
        <Icon iconNode={<SquareCode />} />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveList('ul_list')}
        handler={(e) => setListType(e, 'ul_list')}
      >
        <Icon iconNode={<List />} />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveList('ol_list')}
        handler={(e) => setListType(e, 'ol_list')}
      >
        <Icon iconNode={<ListOrdered />} />
      </ToolbarButton>
      <ToolbarButton handler={(e) => decreaseIndent(e)}>
        <Icon iconNode={<IndentDecrease />} />
      </ToolbarButton>
      <ToolbarButton handler={(e) => increaseIndent(e)}>
        <Icon iconNode={<IndentIncrease />} />
      </ToolbarButton>
      <ToolbarButton
        active={checkActiveElement('link')}
        handler={() => toggleLinkInput()}
      >
        <Icon iconNode={<Link />} />
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
        <Icon iconNode={<Image />} />
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
