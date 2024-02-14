import ts, { TemplateLiteralTypeNode } from "typescript";

/**
 * Transforms a `TemplateLiteralTypeNode` into a RegExp.
 *
 * @example `${string}_${number}_${string}` => /^\w_\d_\w$/
 */
export default function templateLiteralToRegex(
  node: TemplateLiteralTypeNode
): RegExp {
  let regex = `/^${escapeRegExp(node.head.text)}`;

  node.templateSpans.forEach((span) => {
    switch (span.type.kind) {
      case ts.SyntaxKind.StringKeyword:
        regex += "\\w";
        break;
      case ts.SyntaxKind.NumberKeyword:
        regex += "\\d";
        break;
      case ts.SyntaxKind.BooleanKeyword:
        regex += "true|false";
        break;
      case ts.SyntaxKind.AnyKeyword:
        regex += "[\\s\\S]*";
        break;
      default:
        throw new Error("Unsupported type in template literal: " + span.type);
    }

    regex += escapeRegExp(span.literal.text);
  });

  regex += escapeRegExp("$/");
  return new RegExp(regex);
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
