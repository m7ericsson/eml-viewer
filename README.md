# @m7ericsson/eml-viewer

A React component for viewing EML (email) files with Japanese encoding support.

## Features

- 🎯 Drag & drop EML file upload
- 📧 Parse and display email content
- 🗾 Japanese encoding support (ISO-2022-JP, Shift-JIS, EUC-JP)
- 📎 Download attachments
- ✨ Beautiful UI with animations
- 🎨 Tailwind CSS styling
- 🔄 Custom uploader support
- 📁 External file handling

## Installation

```bash
npm install @m7ericsson/eml-viewer
```

## Usage

### Basic Usage

```tsx
import { EmlViewer } from '@m7ericsson/eml-viewer';

function App() {
  return (
    <EmlViewer 
      onError={(error) => console.error(error)}
      onEmailParsed={(email) => console.log(email)}
    />
  );
}
```

### Custom File Selection UI

```tsx
import { EmlViewer } from '@m7ericsson/eml-viewer';

function App() {
  return (
    <EmlViewer 
      renderUploader={({ onFileSelect }) => (
        <div>
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.eml';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) onFileSelect(file);
              };
              input.click();
            }}
          >
            Select EML File
          </button>
        </div>
      )}
    />
  );
}
```

### External File Handling

```tsx
import { EmlViewer } from '@stackblitz/eml-viewer';

function App() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div>
      <input
        type="file"
        accept=".eml"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <EmlViewer file={file} />
    </div>
  );
}
```

## Props

| Name | Type | Description |
|------|------|-------------|
| className | string | Additional CSS classes |
| file | File \| null | External EML file to display |
| onError | (error: Error) => void | Error callback |
| onEmailParsed | (email: ParsedEmail) => void | Success callback |
| renderUploader | (props: { onFileSelect: (file: File) => void }) => React.ReactNode | Custom uploader UI renderer |

## Types

```typescript
interface ParsedEmail {
  subject: string;
  from: string;
  to: string[];
  date: string;
  text: string;
  html?: string;
  attachments: Attachment[];
}

interface Attachment {
  filename: string;
  size: number;
  content: string;
  contentType: string;
}
```

## License

MIT