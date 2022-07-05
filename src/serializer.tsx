import { Node, Text, Element } from 'slate';
import escape from 'escape-html';
import { jsx } from 'slate-hyperscript';

interface TAGS {
  [key: string]: string;
}

const ELEMENT_TAGS: TAGS = {
  p: 'paragraph',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  ul: 'ul_list',
  ol: 'ol_list',
  li: 'list_item',
  pre: 'code_block',
  figure: 'figure',
  img: 'image',
  figcaption: 'image_caption',
  a: 'link',
  blockquote: 'quote',
};

const MARK_TAGS: TAGS = {
  em: 'italic',
  i: 'italic',
  strong: 'bold',
  u: 'underline',
  code: 'code',
};

const serializeData = (object: Record<string, unknown>): string =>
  Object.keys(object)
    .map((key) => `${key}="${object[key]}"`)
    .join(' ');

/**
 *  Serialize a slate fragment to html
 */
export const serialize = (node: Node): string => {
  /**
   *  Text nodes are serialized with the corresponding tags if needed
   */
  if (Text.isText(node)) {
    let text = escape(node.text);
    if (node.bold) {
      text = `<strong>${text}</strong>`;
    }
    if (node.italic) {
      text = `<em property="italic">${text}</em>`;
    }
    if (node.underline) {
      text = `<u>${text}</u>`;
    }
    if (node.code) {
      text = `<code>${text}</code>`;
    }
    return text;
  }

  const children = node.children.map((n: Node) => serialize(n)).join('');

  switch (node.type) {
    case 'paragraph':
      return `<p>${children}</p>`;
    case 'h1':
      return `<h1>${children}</h1>`;
    case 'h2':
      return `<h2>${children}</h2>`;
    case 'h3':
      return `<h3>${children}</h3>`;
    case 'h4':
      return `<h4>${children}</h4>`;
    case 'h5':
      return `<h5>${children}</h5>`;
    case 'ul_list':
      return `<ul>${children}</ul>`;

    case 'ol_list':
      return `<ol>${children}</ol>`;
    case 'list_item':
      return `<li>${children}</li>`;
    case 'code_block':
      return `<pre>
          <code>${children}</code>
        </pre>`;
    case 'figure':
      return `<figure>${children}</figure>`;
    case 'image': {
      // For compatibility with https://github.com/webkom/lego
      const { fileKey, src } = node;
      return `<img
          src=${src}
          data-file-key=${fileKey}
          ${serializeData({ ...node })}
          alt="Placeholder"
        />`;
    }
    case 'image_caption':
      return `<figcaption>${children}</figcaption>`;
    case 'link':
      return `<a target="blank" href=${node.url}>${children}</a>`;
    default:
      return children;
  }
};

/**
 * Normalize mark nodes.
 * We may see mark elements that contain other elements.
 * f.ex. <em><a>example.com</a></em>
 * In order to conform to slates structure, we need to create the
 * slate node such that we have: <a><em>example.com</em></a>
 */
const normalizeMark = (node: Node, mark: string): void => {
  for (const child of node.children) {
    Text.isText(child) ? (child[mark] = true) : normalizeMark(child, mark);
  }
};

/**
 *  Deserialize a html tree to a slate fragment.
 */
export const deserialize = (
  el: HTMLElement
): Node[] | Element | Text | string | null => {
  // See https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
  // for what the different nodeTypes are.
  if (el.nodeType === 3) {
    return el.textContent;
  } else if (el.nodeType !== 1) {
    return null;
  } else if (el.nodeName === 'BR') {
    return '\n';
  }

  // This is flatmapped to make sure we have a situation where a child is an array.
  let children = Array.from(el.childNodes).flatMap((n: ChildNode) =>
    deserialize(n as HTMLElement)
  ) as Node[];

  if (children.length === 0) {
    children = [jsx('text', {}, '')];
  }

  if (el.nodeName === 'BODY') {
    return jsx('fragment', {}, children);
  }

  const elementType = ELEMENT_TAGS[el.nodeName.toLowerCase()];
  if (elementType) {
    switch (elementType) {
      case 'figure': {
        return jsx('element', { type: 'figure' }, children);
      }
      case 'image': {
        const fileKey = el.getAttribute('data-file-key');
        const dataFromHtml = el.getAttributeNames().reduce(
          (data: Record<string, unknown>, attrName: string) => ({
            ...data,
            [attrName]: el.getAttribute(attrName),
          }),
          {}
        );
        return jsx(
          'element',
          { type: 'image', fileKey, ...dataFromHtml },
          children
        );
      }
      case 'link':
        return jsx(
          'element',
          { type: 'link', url: el.getAttribute('href') },
          children
        );
      default:
        return jsx('element', { type: elementType }, children);
    }
  }

  const markType = MARK_TAGS[el.nodeName.toLowerCase()];
  if (markType) {
    return children.map((child: Node) => {
      // If the child node is not a text node, we need
      // to apply the formatting to all text nodes in that node.
      if (child.type && child.type !== 'text') {
        normalizeMark(child, markType);
        return child;
      }
      return jsx(
        'text',
        {
          [markType]: true,
        },
        child
      );
    });
  }
  // If a tag is not recognized and cannot be serialized, traverse the children until
  // we reach a serializeable tag or text.
  if (children) {
    return children;
  }
  return el.textContent;
};

interface DeserializerOptions {
  domParser?: (value: string) => HTMLDocument;
}

/**
 * Deserialize a string of html to a html document in order to convert to the slate object model.
 *
 * Specify a `domParser` in `options` in order to use another parser than the one included in common
 * browsers. (Required when running in node.js).
 */
export const deserializeHtmlString = (
  html: string,
  options?: DeserializerOptions
): Node[] => {
  let document: HTMLDocument;
  if (options?.domParser) {
    document = options.domParser(html);
  } else {
    document = new DOMParser().parseFromString(html, 'text/html');
  }

  return deserialize(document.body) as Node[];
};
