import React from "react";
import { RenderMarkProps } from "slate-react";

export const ItalicMark = (props: RenderMarkProps) => <em property="italic">{props.children}</em>;

export const BoldMark = (props: RenderMarkProps) => <strong>{props.children}</strong>;

export const UnderlineMark = (props: RenderMarkProps) => <u>{props.children}</u>;

export const CodeMark = (props: RenderMarkProps) => <code>{props.children}</code>;
