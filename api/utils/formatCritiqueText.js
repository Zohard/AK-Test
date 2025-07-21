/**
 * Format critique text by converting BBCode and HTML tags to proper HTML
 * Common patterns found in animekunnet critiques:
 * - [url=https://example.com]Link Text[/url] → <a href="https://example.com">Link Text</a>
 * - <br /> or <br> → <br>
 * - \r\n → <br>
 */

function formatCritiqueText(text) {
  if (!text) return '';
  
  let formatted = text;
  
  // Convert BBCode URLs to HTML links
  // Pattern: [url=https://example.com]Link Text[/url]
  formatted = formatted.replace(
    /\[url=([^\]]+)\]([^[]+)\[\/url\]/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>'
  );
  
  // Convert simple BBCode URLs without custom text
  // Pattern: [url]https://example.com[/url]
  formatted = formatted.replace(
    /\[url\]([^[]+)\[\/url\]/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  
  // Convert BBCode bold
  // Pattern: [b]text[/b]
  formatted = formatted.replace(
    /\[b\]([^[]+)\[\/b\]/gi,
    '<strong>$1</strong>'
  );
  
  // Convert BBCode italic
  // Pattern: [i]text[/i]
  formatted = formatted.replace(
    /\[i\]([^[]+)\[\/i\]/gi,
    '<em>$1</em>'
  );
  
  // Convert BBCode underline
  // Pattern: [u]text[/u]
  formatted = formatted.replace(
    /\[u\]([^[]+)\[\/u\]/gi,
    '<u>$1</u>'
  );
  
  // Convert line breaks
  // \r\n or \n to <br>
  formatted = formatted.replace(/\r\n/g, '<br>');
  formatted = formatted.replace(/\n/g, '<br>');
  
  // Clean up existing <br /> tags (make them consistent)
  formatted = formatted.replace(/<br\s*\/?>/gi, '<br>');
  
  // Remove excessive consecutive <br> tags (more than 2)
  formatted = formatted.replace(/(<br>\s*){3,}/gi, '<br><br>');
  
  // Trim whitespace
  formatted = formatted.trim();
  
  return formatted;
}

// Test function to demonstrate the conversion
function testFormatting() {
  console.log('🧪 Testing BBCode/HTML Formatting');
  console.log('=================================');
  
  const testCases = [
    '[url=https://bleachweb.com]Bleach[/url] est un manga génial',
    'Un animé exceptionnel ! <br />Au risque de reprendre ce qui est dit plus bas.',
    'ENORME! <br />\r\nCe mange est tout simplement Hilarant. <br />',
    '[url]https://katana-deutschland.de/[/url] are crazy',
    '[b]Bold text[/b] and [i]italic text[/i]',
    'Line 1\r\nLine 2\nLine 3'
  ];
  
  testCases.forEach((text, i) => {
    console.log(`\nTest ${i + 1}:`);
    console.log(`Input:  ${text}`);
    console.log(`Output: ${formatCritiqueText(text)}`);
  });
}

module.exports = { formatCritiqueText, testFormatting };