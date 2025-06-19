import Heading from "@tiptap/extension-heading";
import Paragraph from "@tiptap/extension-paragraph";

// The key is to set group: 'block' and marks: '' in the schema, and allow marks
export const CustomHeading = Heading.extend({
  name: "heading",
  addOptions() {
    return {
      ...this.parent?.(),
      levels: [1, 2, 3, 4, 5, 6],
    };
  },
  addAttributes() {
    return {
      ...this.parent?.(),
    };
  },
  addMarks() {
    return ["textStyle", "fontStyle", "bold", "italic", "strike"];
  },
  // This is the most important part: ensure marks are allowed
  addStorage() {
    return {
      ...this.parent?.(),
      allowedMarks: ["textStyle", "fontStyle", "bold", "italic", "strike"],
    };
  },
});

export const CustomParagraph = Paragraph.extend({
  name: "paragraph",
  addMarks() {
    return ["textStyle", "fontStyle", "bold", "italic", "strike"];
  },
  addStorage() {
    return {
      ...this.parent?.(),
      allowedMarks: ["textStyle", "fontStyle", "bold", "italic", "strike"],
    };
  },
});