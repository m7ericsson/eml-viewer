import { ParsedEmail, Attachment } from '../types';

// Japanese encoding detection patterns
const JP_ENCODING_PATTERNS = {
  ISO2022JP: /iso-2022-jp|iso2022jp/i,
  SHIFTJIS: /shift[-_]?jis|sjis|ms932/i,
  EUCJP: /euc[-]?jp/i
};

function detectJapaneseEncoding(charset?: string): string {
  if (!charset) return 'utf-8';
  
  const normalized = charset.toLowerCase().trim();
  if (JP_ENCODING_PATTERNS.ISO2022JP.test(normalized)) return 'iso-2022-jp';
  if (JP_ENCODING_PATTERNS.SHIFTJIS.test(normalized)) return 'shift-jis';
  if (JP_ENCODING_PATTERNS.EUCJP.test(normalized)) return 'euc-jp';
  
  return normalized;
}

function decodeBytes(bytes: Uint8Array, charset?: string): string {
  try {
    const encoding = detectJapaneseEncoding(charset);
    return new TextDecoder(encoding).decode(bytes);
  } catch (error) {
    console.error(`Failed to decode with charset ${charset}:`, error);
    // Fallback to UTF-8
    return new TextDecoder('utf-8').decode(bytes);
  }
}

function decodeBase64(str: string, charset?: string): string {
  try {
    // Remove whitespace and line breaks from base64 string
    const cleanStr = str.replace(/[\s\r\n]/g, '');
    const decoded = atob(cleanStr);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return decodeBytes(bytes, charset);
  } catch (error) {
    console.error('Base64 decode error:', error);
    return str;
  }
}

function decodeQuotedPrintable(str: string, charset?: string): string {
  try {
    // Remove soft line breaks first
    const withoutSoftBreaks = str.replace(/=\r?\n/g, '');
    
    // Convert quoted-printable bytes to binary
    const bytes: number[] = [];
    let i = 0;
    while (i < withoutSoftBreaks.length) {
      if (withoutSoftBreaks[i] === '=') {
        if (i + 2 < withoutSoftBreaks.length) {
          const hex = withoutSoftBreaks.slice(i + 1, i + 3);
          bytes.push(parseInt(hex, 16));
          i += 3;
        } else {
          i++;
        }
      } else {
        bytes.push(withoutSoftBreaks.charCodeAt(i));
        i++;
      }
    }

    return decodeBytes(new Uint8Array(bytes), charset);
  } catch (error) {
    console.error('QuotedPrintable decode error:', error);
    return str;
  }
}

function decodeContent(content: string, encoding?: string, charset?: string): string {
  if (!encoding) return content;
  
  const normalizedEncoding = encoding.toLowerCase().trim();
  try {
    switch (normalizedEncoding) {
      case 'base64':
        return decodeBase64(content, charset);
      case 'quoted-printable':
        return decodeQuotedPrintable(content, charset);
      case '7bit':
      case '8bit':
        return decodeBytes(new TextEncoder().encode(content), charset);
      default:
        return content;
    }
  } catch (error) {
    console.error('Content decode error:', error);
    return content;
  }
}

function decodeHeader(header: string): string {
  if (!header) return '';
  
  try {
    // RFC 2047 header decoding with support for multiple encoded words
    return header.replace(/=\?([^?]+)\?([BQbq])\?([^?]*)\?=/g, (_, charset, encoding, text) => {
      if (encoding.toUpperCase() === 'B') {
        return decodeBase64(text, charset);
      } else if (encoding.toUpperCase() === 'Q') {
        return decodeQuotedPrintable(text.replace(/_/g, ' '), charset);
      }
      return text;
    });
  } catch (error) {
    console.error('Header decode error:', error);
    return header;
  }
}

function parseHeaders(headerText: string): Record<string, string[]> {
  const headers: Record<string, string[]> = {};
  let currentHeader = '';
  let currentValue: string[] = [];

  headerText.split(/\r?\n/).forEach(line => {
    if (/^\s/.test(line)) {
      // Continuation of previous header
      if (currentValue.length > 0) {
        currentValue[currentValue.length - 1] += line.trim();
      }
    } else {
      // New header
      const match = line.match(/^([\w-]+):\s*(.*)$/i);
      if (match) {
        if (currentHeader) {
          headers[currentHeader.toLowerCase()] = currentValue.map(v => decodeHeader(v.trim()));
        }
        currentHeader = match[1];
        currentValue = [match[2]];
      }
    }
  });

  if (currentHeader) {
    headers[currentHeader.toLowerCase()] = currentValue.map(v => decodeHeader(v.trim()));
  }

  return headers;
}

function parseBoundary(contentType: string): string | null {
  const match = contentType.match(/boundary="?([^";\s]+)"?/i);
  return match ? match[1] : null;
}

function parseContentType(contentType: string): { type: string; boundary?: string; charset?: string } {
  const type = contentType.split(';')[0].trim().toLowerCase();
  const boundary = parseBoundary(contentType);
  const charsetMatch = contentType.match(/charset="?([^";\s]+)"?/i);
  const charset = charsetMatch ? charsetMatch[1].toLowerCase() : undefined;
  return { type, boundary, charset };
}

function parsePart(part: string): {
  headers: Record<string, string[]>;
  content: string;
} {
  const [headersPart, ...contentParts] = part.split(/\r?\n\r?\n/);
  const headers = parseHeaders(headersPart);
  const content = contentParts.join('\n\n');
  return { headers, content };
}

function extractParts(content: string, boundary: string): string[] {
  const boundaryRegex = new RegExp(`--${boundary}(?:--)?\\s*`, 'g');
  const parts = content.split(boundaryRegex);
  return parts.slice(1, -1).map(part => part.trim());
}

export async function parseEML(file: File): Promise<ParsedEmail> {
  try {
    const text = await file.text();
    const [headersPart, ...contentParts] = text.split(/\r?\n\r?\n/);
    const headers = parseHeaders(headersPart);
    const content = contentParts.join('\n\n');

    const contentType = headers['content-type']?.[0] || '';
    const { type, boundary, charset: defaultCharset } = parseContentType(contentType);

    let textContent = '';
    let htmlContent = '';
    const attachments: Attachment[] = [];

    if (boundary) {
      const parts = extractParts(content, boundary);
      for (const part of parts) {
        const { headers, content } = parsePart(part);
        const partContentType = headers['content-type']?.[0] || '';
        const { type, charset = defaultCharset } = parseContentType(partContentType);
        const encoding = headers['content-transfer-encoding']?.[0];
        const decodedContent = decodeContent(content, encoding, charset);

        if (type === 'text/plain') {
          textContent = decodedContent;
        } else if (type === 'text/html') {
          htmlContent = decodedContent;
        } else if (headers['content-disposition']?.[0]?.includes('attachment')) {
          const filename = decodeHeader(headers['content-disposition'][0].match(/filename="?([^"]+)"?/i)?.[1] || 'unnamed');
          attachments.push({
            filename,
            size: content.length,
            content: btoa(content),
            contentType: type
          });
        }
      }
    } else {
      const encoding = headers['content-transfer-encoding']?.[0];
      textContent = decodeContent(content, encoding, defaultCharset);
    }

    return {
      subject: decodeHeader(headers.subject?.[0] || 'No Subject'),
      from: decodeHeader(headers.from?.[0] || 'Unknown Sender'),
      to: (headers.to?.[0] || '').split(',').map(e => decodeHeader(e.trim())),
      date: headers.date?.[0] || new Date().toISOString(),
      text: textContent.trim(),
      html: htmlContent.trim() || undefined,
      attachments
    };
  } catch (error) {
    console.error('EML parse error:', error);
    throw error;
  }
}