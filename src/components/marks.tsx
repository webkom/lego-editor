import * as React from 'react';
import { RenderMarkProps } from 'slate-react';

export const ItalicMark: React.FunctionComponent<RenderMarkProps> = (
  props: RenderMarkProps
) => <em property="italic">{props.children}</em>;

export const BoldMark: React.FunctionComponent<RenderMarkProps> = (
  props: RenderMarkProps
) => <strong>{props.children}</strong>;

export const UnderlineMark: React.FunctionComponent<RenderMarkProps> = (
  props: RenderMarkProps
) => <u>{props.children}</u>;

export const CodeMark: React.FunctionComponent<RenderMarkProps> = (
  props: RenderMarkProps
) => <code>{props.children}</code>;
