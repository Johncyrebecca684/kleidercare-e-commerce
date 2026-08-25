import React from 'react';

/**
 * Parses inline bold syntax (**text**) and returns React nodes
 */
export function formatInlineText(text) {
  if (!text) return text;
  
  // Split by bold pattern: **bold text**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

/**
 * Renders formatted description text supporting:
 * - Bullet points (lines starting with '• ', '- ', or '* ')
 * - Subheadings (lines starting with '### ' or '## ')
 * - Alignment tags ([center]...[/center], [right]...[/right], [left]...[/left])
 * - Bold text (**word**)
 * - Multi-paragraph separation
 */
export function FormattedDescription({ description, className = 'formatted-description' }) {
  if (!description) {
    return <p className="desc-empty">No detailed description provided for this product.</p>;
  }

  const lines = description.split('\n');
  const renderedElements = [];
  let currentBulletList = [];

  const flushBullets = () => {
    if (currentBulletList.length > 0) {
      renderedElements.push(
        <ul key={`ul-${renderedElements.length}`} className="desc-bullet-list">
          {currentBulletList.map((item, idx) => (
            <li key={idx}>{formatInlineText(item)}</li>
          ))}
        </ul>
      );
      currentBulletList = [];
    }
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushBullets();
      return;
    }

    // Alignment tags
    const centerMatch = line.match(/^\[center\](.*?)\[\/center\]$/i);
    if (centerMatch) {
      flushBullets();
      renderedElements.push(
        <p key={index} className="desc-aligned desc-center" style={{ textAlign: 'center' }}>
          {formatInlineText(centerMatch[1])}
        </p>
      );
      return;
    }

    const rightMatch = line.match(/^\[right\](.*?)\[\/right\]$/i);
    if (rightMatch) {
      flushBullets();
      renderedElements.push(
        <p key={index} className="desc-aligned desc-right" style={{ textAlign: 'right' }}>
          {formatInlineText(rightMatch[1])}
        </p>
      );
      return;
    }

    const leftMatch = line.match(/^\[left\](.*?)\[\/left\]$/i);
    if (leftMatch) {
      flushBullets();
      renderedElements.push(
        <p key={index} className="desc-aligned desc-left" style={{ textAlign: 'left' }}>
          {formatInlineText(leftMatch[1])}
        </p>
      );
      return;
    }

    // Headings (### or ##)
    if (line.startsWith('### ')) {
      flushBullets();
      renderedElements.push(
        <h4 key={index} className="desc-subheading">
          {formatInlineText(line.slice(4))}
        </h4>
      );
      return;
    }

    if (line.startsWith('## ')) {
      flushBullets();
      renderedElements.push(
        <h3 key={index} className="desc-heading">
          {formatInlineText(line.slice(3))}
        </h3>
      );
      return;
    }

    // Bullet points (•, -, *)
    if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
      currentBulletList.push(line.slice(2));
      return;
    }

    // Standard paragraph line
    flushBullets();
    renderedElements.push(
      <p key={index} className="desc-paragraph">
        {formatInlineText(line)}
      </p>
    );
  });

  flushBullets();

  return (
    <div className={className}>
      {renderedElements}
    </div>
  );
}

export default FormattedDescription;
