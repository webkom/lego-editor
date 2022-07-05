import { deserializeHtmlString } from './serializer';
import { Node } from 'slate';

const MARK_TYPES = ['bold', 'italic', 'underline', 'code'] as const;
type MARK_TYPE = typeof MARK_TYPES[number];

const checkMarks = (
  element: Node,
  marks: {
    [key in MARK_TYPE]?: boolean;
  }
): void => {
  for (const mark of MARK_TYPES) {
    expect(element[mark] ?? false).toBe(marks[mark] ?? false);
  }
};

describe('deserializeHtmlString', () => {
  it('deserializes a text node', () => {
    const deserialized = deserializeHtmlString('<p>Hello World</p>');

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

        <link href="https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css" rel="stylesheet">
        <link href="https://unpkg.com/ionicons@3.0.0/dist/css/ionicons.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css?family=Open+Sans:700|Raleway|Roboto" rel="stylesheet">
      </head>
      <body><p>Test</p><!--HTML comment--></body>
    </html>
  `;
    const deserialized = deserializeHtmlString(htmlString);

    expect(deserialized[0].type).toBe('paragraph');

    const children = deserialized[0].children;
    expect(children).toHaveLength(1);
    expect(children[0].text).toBe('Test');
  });

  it('uses the supplied domParser', () => {
    const htmlDocument = new DOMParser().parseFromString(
      '<p>Hello World</p>',
      'text/html'
    );

    const deserialized = deserializeHtmlString('', {
      domParser: () => htmlDocument,
    });

    expect(deserialized).toHaveLength(1);
    expect(deserialized[0].type).toBe('paragraph');

    const children = deserialized[0].children;
    expect(children).toHaveLength(1);
    expect(children[0].text).toBe('Hello World');
  });

  it('deserializes an element with no children', () => {
    const deserialized = deserializeHtmlString('<p/>');

    expect(deserialized).toHaveLength(1);
    expect(deserialized[0].type).toBe('paragraph');

    const children = deserialized[0].children;
    expect(children).toHaveLength(1);
    expect(children[0].text).toBe('');
  });

  it('deserializes document with various headers and text tags', () => {
    const deserialized = deserializeHtmlString(
      '<h1>Header 1</h1><h2>Header 2</h2><h3>Header 3</h3><h4>Header 4</h4><h5>Header 5</h5><p><strong>bold, </strong><u>underlined</u> and <i>italic</i> text<code> + some code</code></p>'
    );

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
      '<p>paragraph <a href="https://abakus.no">with a link</a></p>'
    );

    expect(deserialized).toHaveLength(1);
    const paragraph = deserialized[0];
    expect(paragraph.type).toBe('paragraph');
    expect(paragraph.children).toHaveLength(2);
    expect(paragraph.children[0].text).toBe('paragraph ');
    const link = paragraph.children[1];
    expect(link.type).toBe('link');
    expect(link.url).toBe('https://abakus.no');
    expect(link.children).toHaveLength(1);
    expect(link.children[0].text).toBe('with a link');
  });

  it('deserializes document with <br> tag', () => {
    const deserialized = deserializeHtmlString(
      '<p>paragraph <br> with a line break</p>'
    );

    expect(deserialized).toHaveLength(1);
    expect(deserialized[0].type).toBe('paragraph');
    expect(deserialized[0].children).toHaveLength(1);
    expect(deserialized[0].children[0].text).toBe(
      'paragraph \n with a line break'
    );
  });

  it('deserializes text with multiple marks', () => {
    const deserialized = deserializeHtmlString(
      '<p>this <em>text <strong>is <u>marked <code>up!</code></u></strong></em></p>'
    );

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
    });

    expect(paragraph.children[4].text).toBe('up!');
    checkMarks(paragraph.children[4], {
      italic: true,
      bold: true,
      underline: true,
      code: true,
    });
  });

  it('handles mark tags around other elements', () => {
    const deserialized = deserializeHtmlString(
      '<strong><u><h1>Strong header</h1></u><p>and paragraph</p></strong>'
    );

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
      '<testing-tag><p>should be <taggy-mctagface>found</taggy-mctagface></p></testing-tag>'
    );

    expect(deserialized).toHaveLength(1);

    expect(deserialized[0].type).toBe('paragraph');
    expect(deserialized[0].children).toHaveLength(1);
    expect(deserialized[0].children[0].text).toBe('should be found');
  });

  it('deserializes an image figure', () => {
    const deserialized = deserializeHtmlString(
      '<figure><img src="image_src.jpg" alt="Cool figure 😎"><figcaption>Fig.1 - Cool stuff.</figcaption></figure>'
    );

    expect(deserialized).toHaveLength(1);

    expect(deserialized[0].type).toBe('figure');
    expect(deserialized[0].children).toHaveLength(2);

    const image = deserialized[0].children[0];
    const caption = deserialized[0].children[1];

    expect(image.type).toBe('image');
    expect(image.src).toBe('image_src.jpg');
    expect(image.alt).toBe('Cool figure 😎');

    expect(caption.type).toBe('image_caption');
    expect(caption.children).toHaveLength(1);
    expect(caption.children[0].text).toBe('Fig.1 - Cool stuff.');
  });

  it('ignores <script /> and <style />', () => {
    const deserialized = deserializeHtmlString(
      '<script>alert("I am a script tag!");</script><style>body { background-color: #fff; }</style>'
    );

    expect(deserialized).toHaveLength(1);
    expect(deserialized[0].text).toBe('');
  });

  it('deserializes lists', () => {
    const deserialized = deserializeHtmlString(
      '<ul><li>an item</li><li>another item</li></ul><ol><li>first item</li><li>second item</li></ol>'
    );

    expect(deserialized).toHaveLength(2);
    expect(deserialized[0].type).toBe('ul_list');
    expect(deserialized[0].children).toHaveLength(2);
    expect(deserialized[0].children[0].type).toBe('list_item');
    expect(deserialized[0].children[1].type).toBe('list_item');
    expect(deserialized[0].children[0].children[0].text).toBe('an item');
    expect(deserialized[0].children[1].children[0].text).toBe('another item');

    expect(deserialized[1].type).toBe('ol_list');
    expect(deserialized[1].children).toHaveLength(2);
    expect(deserialized[1].children[0].type).toBe('list_item');
    expect(deserialized[1].children[1].type).toBe('list_item');
    expect(deserialized[1].children[0].children[0].text).toBe('first item');
    expect(deserialized[1].children[1].children[0].text).toBe('second item');
  });
});
