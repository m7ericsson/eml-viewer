export interface ParsedEmail {
  subject: string;
  from: string;
  to: string[];
  date: string;
  text: string;
  html?: string;
  attachments: Attachment[];
}

export interface Attachment {
  filename: string;
  size: number;
  content: string;
  contentType: string;
}