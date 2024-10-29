import React, { useState } from 'react';
import { FileDropZone } from './components/FileDropZone';
import { EmailViewer } from './components/EmailViewer';
import { parseEML } from './utils/emlParser';
import type { ParsedEmail } from './types';

function App() {
  const [email, setEmail] = useState<ParsedEmail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFile = async (file: File) => {
    try {
      setError(null);
      setIsAnimating(true);
      const parsed = await parseEML(file);
      setEmail(parsed);
    } catch (err) {
      setError('メールファイルの解析中にエラーが発生しました。');
      console.error(err);
    } finally {
      setIsAnimating(false);
    }
  };

  const handleReset = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setEmail(null);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
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
                <FileDropZone onFile={handleFile} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;