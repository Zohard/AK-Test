import React from 'react';
// Remove PropTypes for JS version - can be added back if needed

/**
 * Component to safely render HTML-formatted text from critiques
 * Supports BBCode converted to HTML links, line breaks, and basic formatting
 */
const FormattedText = ({ 
  text, 
  className = '', 
  maxLength = null,
  showReadMore = false 
}) => {
  if (!text) return null;
  
  // Truncate text if maxLength is specified
  let displayText = text;
  let isTruncated = false;
  
  if (maxLength && text.length > maxLength) {
    // Find a good break point near maxLength
    const truncateAt = text.lastIndexOf(' ', maxLength);
    displayText = text.substring(0, truncateAt > 0 ? truncateAt : maxLength) + '...';
    isTruncated = true;
  }
  
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const finalText = (showReadMore && isTruncated && !isExpanded) ? displayText : text;
  
  return (
    <div className={`formatted-text ${className}`}>
      <div 
        dangerouslySetInnerHTML={{ __html: finalText }}
        className="critique-content"
      />
      
      {showReadMore && isTruncated && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="read-more-btn text-blue-600 hover:text-blue-800 text-sm mt-2 underline"
          type="button"
        >
          {isExpanded ? 'Lire moins' : 'Lire plus'}
        </button>
      )}
      
      <style jsx>{`
        .formatted-text {
          line-height: 1.6;
        }
        
        .critique-content :global(a) {
          color: #2563eb;
          text-decoration: underline;
        }
        
        .critique-content :global(a:hover) {
          color: #1d4ed8;
        }
        
        .critique-content :global(strong) {
          font-weight: 600;
        }
        
        .critique-content :global(em) {
          font-style: italic;
        }
        
        .critique-content :global(u) {
          text-decoration: underline;
        }
        
        .critique-content :global(br) {
          margin-bottom: 0.5em;
        }
        
        .read-more-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
};

// PropTypes removed for JS version

export default FormattedText;