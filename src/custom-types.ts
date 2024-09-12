import { ReactEditor } from 'slate-react';
import { BaseEditor, BaseRange } from 'slate';
import { HistoryEditor } from 'slate-history';

import { PluginsEditor, ListEditor, LinkEditor, ImageEditor } from './plugins';

export type Next = () => unknown;

export const MARKS = [
  'bold',
  'italic',
  'code',
  'underline',
  'strikethrough',
] as const;
export type Mark = (typeof MARKS)[number];
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
  | 'image_caption'
  | 'quote'
  | 'ins'
  | 'del';

export type CustomText = { text: string } & {
  [key in Mark]?: boolean;
};

export type ImageElement = {
  type: 'image';
  src?: string;
  objectUrl: string;
  fileKey?: string;
  children: [];
} & { [key: string]: unknown };
export type ImageCaptionElement = {
  type: 'image_caption';
  children: CustomText[];
};
export type FigureElement = {
  type: 'figure';
  children: (ImageElement | ImageCaptionElement)[];
};
export type TextElement = {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'paragraph';
  children: CustomText[];
};
type CodeBlockElement = {
  type: 'code_block';
  children: TextElement[];
};
export type LinkElement = {
  type: 'link';
  children: CustomText[];
  url: string;
};
type QuoteElement = {
  type: 'quote';
  children: CustomText[];
};
export type ListItemElement = {
  type: 'list_item';
  children: (TextElement | CustomText | LinkElement)[];
};
export type ListElement = {
  type: 'ol_list' | 'ul_list';
  children: (ListElement | ListItemElement)[];
};
export type InsertedElement = {
  type: 'ins';
  children: CustomText[];
};
export type DeletedElement = {
  type: 'del';
  children: CustomText[];
};

type CustomElement =
  | ListElement
  | ListItemElement
  | TextElement
  | ImageElement
  | ImageCaptionElement
  | FigureElement
  | QuoteElement
  | CodeBlockElement
  | LinkElement
  | InsertedElement
  | DeletedElement;

export interface ExtendedEditor extends BaseEditor {
  savedSelection?: BaseRange;
}

declare module 'slate' {
  interface CustomTypes {
    Editor: ExtendedEditor &
      BaseEditor &
      ReactEditor &
      HistoryEditor &
      ListEditor &
      LinkEditor &
      ImageEditor &
      PluginsEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}
