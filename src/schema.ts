import * as Slate from "slate";
import isUrl from "is-url";
import { SchemaProperties } from "slate";

// Schema for the editor value
// This can handle normalizing and rules for the value
// If there are any rules for how the value should be, add them here
// TODO add normalizing for link with empty or invalid url
// TODO consider normalizing code blocks, (no marks, not inside lists?)
const schema: SchemaProperties = {
  document: {
    last: { type: "paragraph" },
    normalize: (editor: Slate.Editor, error: Slate.SlateError) => {
      const { code, node, child } = error;
      switch (code) {
        case "last_child_type_invalid": {
          const paragraph = Slate.Block.create("paragraph");
          editor.insertNodeByKey(node.key, node.nodes.size, paragraph);
          return;
        }
      }
    },
  },
  blocks: {
    image: {
      isVoid: true,
      parent: { type: "figure" },
      next: { type: "image_caption" },
      normalize: (editor: Slate.Editor, error: Slate.SlateError) => {
        const { code, node } = error;
        switch (code) {
          case "parent_type_invalid": {
            editor.wrapBlockByKey(node.key, "figure");
            return;
          }
          case "next_sibling_type_invalid": {
          }
        }
      },
    },
    figure: {
      first: { type: "image" },
      last: { type: "image_caption" },
      normalize: (editor: Slate.Editor, error: Slate.SlateError) => {
        const { code, node, child } = error;
        switch (code) {
          case "first_child_type_invalid": {
            return editor.removeNodeByKey(node.key);
          }
          case "last_child_type_invalid": {
            const { document } = editor.value;
            const caption = Slate.Block.create("image_caption");
            return editor.insertNodeByKey(node.key, 1, caption);
          }
        }
      },
    },
    image_caption: {},
    list_item: {
      nodes: [
        {
          match: [{ type: "paragraph" }, { type: "h2" }, { type: "h4" }, { type: "link" }],
        },
      ],
      // Normalize lists to have blocks inside
      normalize: (editor: Slate.Editor, error: Slate.SlateError) => {
        const { code, node, child } = error;
        switch (code) {
          case "child_type_invalid": {
            if (Slate.Text.isText(child)) {
              return editor.setNodeByKey(node.key, "paragraph").wrapBlockByKey(node.key, "list_item");
            } else {
              return editor.setNodeByKey(child.key, "paragraph");
            }
          }
        }
      },
    },
  },
  inlines: {
    link: {
      data: {
        url: (url: string) => isUrl(url),
      },
    },
  },
};

export default schema;
