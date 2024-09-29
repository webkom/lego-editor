import { describe, it, expect } from 'vitest';
import { deserializeHtmlString, serialize } from './serializer';
import { createEditor, Transforms, Element } from 'slate';
import { jsx } from 'slate-hyperscript';
import {
  Mark,
  MARKS,
  CustomText,
  TextElement,
  ImageElement,
  ImageCaptionElement,
  ListElement,
  LinkElement,
} from './custom-types';

const checkMarks = (
  element: CustomText,
  marks: {
    [key in Mark]?: boolean;
  },
): void => {
  for (const mark of MARKS) {
    expect(element[mark] ?? false).toBe(marks[mark] ?? false);
  }
};

describe('serializer', () => {
  it('serializes a paragraph', () => {
    const element = jsx(
      'element',
      { type: 'paragraph' },
      jsx('text', { text: 'Hello world' }),
    );

    const serialized = serialize(element);

    expect(serialized).toEqual('<p>Hello world</p>');
  });

  it('serializes editor with headers and paragraph', () => {
    const editor = createEditor();
    Transforms.insertNodes(editor, [
      jsx('element', { type: 'h1' }, jsx('text', { text: 'Header 1' })),
      jsx('element', { type: 'h2' }, jsx('text', { text: 'Header 2' })),
      jsx('element', { type: 'h3' }, jsx('text', { text: 'Header 3' })),
      jsx('element', { type: 'h4' }, jsx('text', { text: 'Header 4' })),
      jsx('element', { type: 'h5' }, jsx('text', { text: 'Header 5' })),
      jsx('element', { type: 'paragraph' }, jsx('text', { text: 'Paragraph' })),
    ]);

    const serialized = serialize(editor);

    expect(serialized).toEqual(
      '<h1>Header 1</h1><h2>Header 2</h2><h3>Header 3</h3><h4>Header 4</h4><h5>Header 5</h5><p>Paragraph</p>',
    );
  });

  it('serializes editor with lists', () => {
    const editor = createEditor();
    Transforms.insertNodes(editor, [
      jsx(
        'element',
        { type: 'ul_list' },
        jsx(
          'element',
          { type: 'list_item' },
          jsx('text', { text: 'List item' }),
        ),
        jsx(
          'element',
          { type: 'list_item' },
          jsx('text', { text: 'Another list item' }),
        ),
      ),
      jsx(
        'element',
        { type: 'ol_list' },
        jsx(
          'element',
          { type: 'list_item' },
          jsx('text', { text: 'First item' }),
        ),
        jsx(
          'element',
          { type: 'list_item' },
          jsx('text', { text: 'Second item' }),
        ),
      ),
    ]);

    const serialized = serialize(editor);

    expect(serialized).toEqual(
      '<ul><li>List item</li><li>Another list item</li></ul><ol><li>First item</li><li>Second item</li></ol>',
    );
  });

  it('serializes a marked paragraph', () => {
    const element = jsx(
      'element',
      { type: 'paragraph' },
      jsx('text', { text: 'Paragraph ' }),
      jsx('text', { text: 'with ', bold: true }),
      jsx('text', {
        text: 'marks',
        bold: true,
        italic: true,
        underline: true,
        code: true,
        strikethrough: true,
      }),
    );

    const serialized = serialize(element);

    expect(serialized).toEqual(
      '<p>Paragraph <strong>with </strong><s><code><u><em property="italic"><strong>marks</strong></em></u></code></s></p>',
    );
  });

  it('serializes a code block', () => {
    const element = jsx(
      'element',
      { type: 'code_block' },
      jsx('text', { text: 'NaN != NaN' }),
    );

    const serialized = serialize(element);

    expect(serialized).toBe('<pre>NaN != NaN</pre>');
  });

  it('serializes an image figure with caption', () => {
    const element = jsx(
      'element',
      { type: 'figure' },
      jsx('element', {
        type: 'image',
        src: 'figure.svg',
        fileKey: 'figure',
      }),
      jsx(
        'element',
        { type: 'image_caption' },
        jsx('text', { text: 'Cool figure' }),
      ),
    );

    const serialized = serialize(element);

    expect(serialized).toBe(
      '<figure><img src="figure.svg" data-file-key="figure" alt="Placeholder" /><figcaption>Cool figure</figcaption></figure>',
    );
  });

  it('serializes a link', () => {
    const element = jsx(
      'element',
      { type: 'link', url: 'https://abakus.no' },
      jsx('text', { text: 'Link' }),
    );

    const serialized = serialize(element);

    expect(serialized).toBe(
      '<a target="_blank" href="https://abakus.no">Link</a>',
    );
  });

  it('serializes a quote', () => {
    const element = jsx(
      'element',
      { type: 'quote' },
      jsx('text', { text: 'Quote' }),
    );

    const serialized = serialize(element);

    expect(serialized).toBe('<blockquote>Quote</blockquote>');
  });
});

describe('deserializeHtmlString', () => {
  it('deserializes a text node', () => {
    const deserialized = deserializeHtmlString(
      '<p>Hello World</p>',
    ) as TextElement[];

    expect(deserialized).toHaveLength(1);
    expect(deserialized[0].type).toBe('paragraph');

    const children = deserialized[0].children;
    expect(children).toHaveLength(1);
    expect(children[0].text).toBe('Hello World');
  });

  it('ignores non-body html and comments', () => {
    const htmlString = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <meta name="theme-color" content="#f2f2f1">
        <title>Abakus</title>

        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-title" content="Abakus"/>

        <link href="https://fonts.googleapis.com/css?family=Open+Sans:700|Raleway|Roboto" rel="stylesheet">
      </head>
      <body><p>Test</p><!--HTML comment--></body>
    </html>
  `;
    const deserialized = deserializeHtmlString(htmlString) as TextElement[];

    expect(deserialized[0].type).toBe('paragraph');

    const children = deserialized[0].children;
    expect(children).toHaveLength(1);
    expect(children[0].text).toBe('Test');
  });

  it('uses the supplied domParser', () => {
    const htmlDocument = new DOMParser().parseFromString(
      '<p>Hello World</p>',
      'text/html',
    );

    const deserialized = deserializeHtmlString('', {
      domParser: () => htmlDocument,
    }) as TextElement[];

    expect(deserialized).toHaveLength(1);
    expect(deserialized[0].type).toBe('paragraph');

    const children = deserialized[0].children;
    expect(children).toHaveLength(1);
    expect(children[0].text).toBe('Hello World');
  });

  it('deserializes an element with no children', () => {
    const deserialized = deserializeHtmlString('<p/>') as TextElement[];

    expect(deserialized).toHaveLength(1);
    expect(deserialized[0].type).toBe('paragraph');

    const children = deserialized[0].children;
    expect(children).toHaveLength(1);
    expect(children[0].text).toBe('');
  });

  it('deserializes document with various headers and text tags', () => {
    const deserialized = deserializeHtmlString(
      '<h1>Header 1</h1><h2>Header 2</h2><h3>Header 3</h3><h4>Header 4</h4><h5>Header 5</h5><p><strong>bold, </strong><u>underlined</u> and <i>italic</i> text<code> + some code</code></p>',
    ) as TextElement[];

    expect(deserialized).toHaveLength(6);
    expect(deserialized[0].type).toBe('h1');
    expect(deserialized[1].type).toBe('h2');
    expect(deserialized[2].type).toBe('h3');
    expect(deserialized[3].type).toBe('h4');
    expect(deserialized[4].type).toBe('h5');
    expect(deserialized[5].type).toBe('paragraph');

    expect(deserialized[0].children[0].text).toBe('Header 1');
    expect(deserialized[1].children[0].text).toBe('Header 2');
    expect(deserialized[2].children[0].text).toBe('Header 3');
    expect(deserialized[3].children[0].text).toBe('Header 4');
    expect(deserialized[4].children[0].text).toBe('Header 5');

    const paragraph = deserialized[5];

    expect(paragraph.children).toHaveLength(6);

    expect(paragraph.children[0].text).toBe('bold, ');
    checkMarks(paragraph.children[0], { bold: true });

    expect(paragraph.children[1].text).toBe('underlined');
    checkMarks(paragraph.children[1], { underline: true });

    expect(paragraph.children[2].text).toBe(' and ');
    checkMarks(paragraph.children[2], {});

    expect(paragraph.children[3].text).toBe('italic');
    checkMarks(paragraph.children[3], { italic: true });

    expect(paragraph.children[4].text).toBe(' text');
    checkMarks(paragraph.children[4], {});

    expect(paragraph.children[5].text).toBe(' + some code');
    checkMarks(paragraph.children[5], { code: true });
  });

  it('deserializes link tags', () => {
    const deserialized = deserializeHtmlString(
      '<p>paragraph </p><a href="https://abakus.no">with a link</a>',
    ) as Element[];

    expect(deserialized).toHaveLength(2);
    const paragraph = deserialized[0] as TextElement;
    expect(paragraph.type).toBe('paragraph');
    expect(paragraph.children).toHaveLength(1);
    expect(paragraph.children[0].text).toBe('paragraph ');
    const link = deserialized[1] as LinkElement;
    expect(link.type).toBe('link');
    expect(link.url).toBe('https://abakus.no');
    expect(link.children).toHaveLength(1);
    const text = link.children[0] as CustomText;
    expect(text.text).toBe('with a link');
  });

  it('deserializes document with <br> tag', () => {
    const deserialized = deserializeHtmlString(
      '<p>paragraph <br> with a line break</p>',
    ) as TextElement[];

    expect(deserialized).toHaveLength(1);
    expect(deserialized[0].type).toBe('paragraph');
    expect(deserialized[0].children).toHaveLength(1);
    expect(deserialized[0].children[0].text).toBe(
      'paragraph \n with a line break',
    );
  });

  it('deserializes text with multiple marks', () => {
    const deserialized = deserializeHtmlString(
      '<p>this <em>text <strong>is <s><u>marked <code>up!</code></u></s></strong></em></p>',
    ) as TextElement[];

    expect(deserialized).toHaveLength(1);
    const paragraph = deserialized[0];

    expect(paragraph.type).toBe('paragraph');
    expect(paragraph.children).toHaveLength(5);

    expect(paragraph.children[0].text).toBe('this ');
    checkMarks(paragraph.children[0], {});

    expect(paragraph.children[1].text).toBe('text ');
    checkMarks(paragraph.children[1], { italic: true });

    expect(paragraph.children[2].text).toBe('is ');
    checkMarks(paragraph.children[2], { italic: true, bold: true });

    expect(paragraph.children[3].text).toBe('marked ');
    checkMarks(paragraph.children[3], {
      italic: true,
      bold: true,
      underline: true,
      strikethrough: true,
    });

    expect(paragraph.children[4].text).toBe('up!');
    checkMarks(paragraph.children[4], {
      italic: true,
      bold: true,
      underline: true,
      strikethrough: true,
      code: true,
    });
  });

  it('handles mark tags around other elements', () => {
    const deserialized = deserializeHtmlString(
      '<strong><u><h1>Strong header</h1></u><p>and paragraph</p></strong>',
    ) as TextElement[];

    expect(deserialized).toHaveLength(2);

    expect(deserialized[0].type).toBe('h1');
    expect(deserialized[0].children).toHaveLength(1);
    expect(deserialized[0].children[0].text).toBe('Strong header');
    checkMarks(deserialized[0].children[0], { bold: true, underline: true });

    expect(deserialized[1].type).toBe('paragraph');
    expect(deserialized[1].children).toHaveLength(1);
    expect(deserialized[1].children[0].text).toBe('and paragraph');
    checkMarks(deserialized[1].children[0], { bold: true });
  });

  it('ignores unknown tag but finds children', () => {
    const deserialized = deserializeHtmlString(
      '<testing-tag><p>should be <taggy-mctagface>found</taggy-mctagface></p></testing-tag>',
    ) as TextElement[];

    expect(deserialized).toHaveLength(1);

    expect(deserialized[0].type).toBe('paragraph');
    expect(deserialized[0].children).toHaveLength(1);
    expect(deserialized[0].children[0].text).toBe('should be found');
  });

  it('deserializes an image figure', () => {
    const deserialized = deserializeHtmlString(
      '<figure><img src="image_src.jpg" alt="Cool figure 😎" /><figcaption>Fig.1 - Cool stuff.</figcaption></figure>',
    ) as Element[];

    expect(deserialized).toHaveLength(1);

    expect(deserialized[0].type).toBe('figure');
    expect(deserialized[0].children).toHaveLength(2);

    const image = deserialized[0].children[0] as ImageElement;
    const caption = deserialized[0].children[1] as ImageCaptionElement;

    expect(image.type).toBe('image');
    expect(image.src).toBe('image_src.jpg');
    expect(image.alt).toBe('Cool figure 😎');

    expect(caption.type).toBe('image_caption');
    expect(caption.children).toHaveLength(1);
    expect(caption.children[0].text).toBe('Fig.1 - Cool stuff.');
  });

  it('ignores <script /> and <style />', () => {
    const deserialized = deserializeHtmlString(
      '<script>alert("I am a script tag!");</script><style>body { background-color: #fff; }</style>',
    ) as CustomText[];

    expect(deserialized).toHaveLength(1);
    expect(deserialized[0].text).toBe('');
  });

  it('deserializes lists', () => {
    const deserialized = deserializeHtmlString(
      '<ul><li>an item</li><li>another item</li></ul><ol><li>first item</li><li>second item</li></ol>',
    ) as ListElement[];

    expect(deserialized).toHaveLength(2);
    expect(deserialized[0].type).toBe('ul_list');
    expect(deserialized[0].children).toHaveLength(2);
    expect(deserialized[0].children[0].type).toBe('list_item');
    expect(deserialized[0].children[1].type).toBe('list_item');
    const textEl = deserialized[0].children[0].children[0] as CustomText;
    expect(textEl.text).toBe('an item');
    const textEl2 = deserialized[0].children[1].children[0] as CustomText;
    expect(textEl2.text).toBe('another item');

    expect(deserialized[1].type).toBe('ol_list');
    expect(deserialized[1].children).toHaveLength(2);
    expect(deserialized[1].children[0].type).toBe('list_item');
    expect(deserialized[1].children[1].type).toBe('list_item');
    const textEl3 = deserialized[1].children[0].children[0] as CustomText;
    expect(textEl3.text).toBe('first item');
    const textEl4 = deserialized[1].children[1].children[0] as CustomText;
    expect(textEl4.text).toBe('second item');
  });

  it('deserializes a block quote', () => {
    const deserialized = deserializeHtmlString(
      '<blockquote>This is a block quote</blockquote>',
    ) as TextElement[];

    expect(deserialized).toHaveLength(1);
    expect(deserialized[0].type).toBe('quote');
    expect(deserialized[0].children).toHaveLength(1);
    expect(deserialized[0].children[0].text).toBe('This is a block quote');
  });
});

// Try to deserialize a html string, then serialize it back to a html string
// and compare the result to the original.
describe('reserialize deserialized html', () => {
  const deserializeAndReserialize = (html: string): string => {
    const deserialized = deserializeHtmlString(html);
    const editor = createEditor();
    Transforms.insertNodes(editor, deserialized);
    return serialize(editor);
  };

  const testHtml = (html: string, expectedHtml?: string): void => {
    const reserialized = deserializeAndReserialize(html);

    expect(reserialized).toBe(expectedHtml ?? html);
  };

  it('serializes lists correctly', () => {
    testHtml(
      '<ul><li>an item</li><li>another item</li></ul><ol><li>first item</li><li>second item</li></ol>',
    );
  });

  it('serializes images correctly', () => {
    testHtml('<img src="image.jpg" alt="alternative text" />');
    testHtml('<img src="123.png" alt="alt" data-file-key="fileKey" />');
    testHtml('<img src="123.png">', '<img src="123.png" alt="Placeholder" />');
  });

  it('serializes links correctly', () => {
    testHtml('<a href="/">link</a>', '<a target="_blank" href="/">link</a>');
    testHtml('<a target="_blank" href="/events"><strong>link</strong></a>');
    testHtml('<a target="_blank" href="https://abakus.no"><u>link</u></a>');
  });

  it('serializes code blocks correctly', () => {
    testHtml('<pre>this.block = code</pre>');
  });

  it('serializes blockquote correctly', () => {
    testHtml('<blockquote>test</blockquote>');
  });
});
