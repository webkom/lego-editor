import { Node as SlateNode, Text, Element } from 'slate';
import escape from 'escape-html';
import { jsx } from 'slate-hyperscript';
import { Mark } from './custom-types';

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

const MARK_TAGS = {
  em: 'italic',
  i: 'italic',
  strong: 'bold',
  u: 'underline',
  code: 'code',
} as const;

type MarkNode = 'em' | 'i' | 'strong' | 'u' | 'code';

const serializeData = (object: Record<string, unknown>): string =>
  Object.keys(object)
    .map((key) => `${key}="${object[key]}"`)
    .join(' ');

const isMarkNode = (name: string): name is MarkNode => {
  return Object.keys(MARK_TAGS).includes(name);
};

/**
 *  Serialize a slate fragment to html
 */
export const serialize = (node: SlateNode): string => {
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

  const children = node.children.map((n: SlateNode) => serialize(n)).join('');
  if (!Element.isElement(node)) {
    return children;
  }

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
      return `<pre>${children}</pre>`;
    case 'figure':
      return `<figure>${children}</figure>`;
    case 'image': {
      // For compatibility with https://github.com/webkom/lego
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { fileKey, type, children, ...imageData } = node;
      const imgData: { [k: string]: unknown } = { ...imageData };
      if (fileKey) {
        imgData['data-file-key'] = fileKey;
      }
      imgData.alt ??= 'Placeholder';
      return `<img ${serializeData(imgData)} />`;
    }
    case 'image_caption':
      return `<figcaption>${children}</figcaption>`;
    case 'link':
      return `<a target="_blank" href="${node.url}">${children}</a>`;
    case 'quote':
      return `<blockquote>${children}</blockquote>`;
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
const normalizeMark = (node: SlateNode, mark: Mark): void => {
  for (const child of node.children) {
    Text.isText(child) ? (child[mark] = true) : normalizeMark(child, mark);
  }
};

/**
 *  Deserialize a html tree to a slate fragment.
 */
export const deserialize = (
  element: Node
): SlateNode | string | (SlateNode | string)[] => {
  // See https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
  // for what the different nodeTypes are.
  if (element.nodeType === Node.TEXT_NODE) {
    return element.textContent || '';
  } else if (element.nodeType !== Node.ELEMENT_NODE) {
    return '';
  } else if (element.nodeName === 'BR') {
    return '\n';
  }

  // Type check is done above. TS cannot infer, hence the cast
  const el = element as HTMLElement;

  // This is flatmapped to make sure we have a situation where a child is an array.
  let children = Array.from(el.childNodes)
    .map((n) => deserialize(n))
    .flat();

  if (children.length === 0) {
    children = [jsx('text', {}, '')];
  }

  if (el.nodeName === 'BODY') {
    return jsx('fragment', {}, children);
  }

  const elementType = ELEMENT_TAGS[el.nodeName.toLowerCase()];
  if (elementType) {
    switch (elementType) {
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

  const nodeName = el.nodeName.toLowerCase();
  if (isMarkNode(nodeName)) {
    const markType = MARK_TAGS[nodeName];
    return children.map((child) => {
      // If the child node is not a text node, we need
      // to apply the formatting to all text nodes in that node.
      if (!Text.isText(child) && SlateNode.isNode(child)) {
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
  return el.textContent || '';
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
): SlateNode[] => {
  let document: HTMLDocument;
  if (options?.domParser) {
    document = options.domParser(html);
  } else {
    document = new DOMParser().parseFromString(html, 'text/html');
  }

  return deserialize(document.body) as SlateNode[];
};
