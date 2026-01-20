import React from "react";

export function renderHighlightedText(text: string) {
  if (!text) return null;

  // Split by either ==text== OR `text`
  // The parenthesis () in the regex ensure the delimiters are kept in the resulting array
  const parts = text.split(/(==.*?==|`.*?`)/g);

  return parts.map((part, index) => {
    // Handle Double Equals: ==highlight==
    if (part.startsWith("==") && part.endsWith("==")) {
      return (
        <span key={index} className="ai-highlight">
          {part.replace(/==/g, "")}
        </span>
      );
    }

    // Handle Backticks: `code`
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="ai-code">
          {part.replace(/`/g, "")}
        </code>
      );
    }

    // Handle Plain Text
    return <span key={index}>{part}</span>;
  });
}