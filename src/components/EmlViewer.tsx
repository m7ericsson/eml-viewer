import React, { useState, useEffect } from 'react';
import { FileDropZone } from './FileDropZone';
import { EmailViewer } from './EmailViewer';
import { parseEML } from '../utils/emlParser';
import type { ParsedEmail } from '../types';

interface EmlViewerProps {
  className?: string;
  file?: File | null;
  onError?: (error: Error) => void;
  onEmailParsed?: (email: ParsedEmail) => void;
  renderUploader?: (props: { onFileSelect: (file: File) => void }) => React.ReactNode;
}

export function EmlViewer({ 
  className = '', 
  file: externalFile = null,
  onError, 
  onEmailParsed,
  renderUploader 
}: EmlViewerProps) {
  const [email, setEmail] = useState<ParsedEmail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const processFile = async (file: File) => {
    try {
      setError(null);
      setIsAnimating(true);
      const parsed = await parseEML(file);
      setEmail(parsed);
      onEmailParsed?.(parsed);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError('メールファイルの解析中にエラーが発生しました。');
      onError?.(error);
      console.error(err);
    } finally {
      setIsAnimating(false);
    }
  };

  // Handle external file prop changes
  useEffect(() => {
    if (externalFile) {
      processFile(externalFile);
    }
  }, [externalFile]);

  const handleReset = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setEmail(null);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 ${className}`}>
      <div className="max-w-4xl mx-auto">
        <div className={`transform transition-all duration-300 ${
          isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                {error}
              </div>
            )}
            
            {email ? (
              <EmailViewer email={email} onReset={handleReset} />
            ) : (
              <div className="p-8">
                {renderUploader ? (
                  renderUploader({ onFileSelect: processFile })
                ) : (
                  <FileDropZone onFile={processFile} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}