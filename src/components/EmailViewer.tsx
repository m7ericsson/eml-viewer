import React from 'react';
import { X, Paperclip, Calendar, User, AtSign, Download, ArrowLeft } from 'lucide-react';
import type { ParsedEmail, Attachment } from '../types';

interface EmailViewerProps {
  email: ParsedEmail;
  onReset: () => void;
}

function downloadAttachment(attachment: Attachment) {
  const blob = new Blob([Buffer.from(attachment.content, 'base64')], {
    type: attachment.contentType,
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = attachment.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function EmailViewer({ email, onReset }: EmailViewerProps) {
  return (
    <div className="divide-y divide-gray-200">
      <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-r from-indigo-500 to-blue-600 text-white">
        <button
          onClick={onReset}
          className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>戻る</span>
        </button>
        <h2 className="text-xl font-medium">メールプレビュー</h2>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      <div className="p-6 space-y-6 bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-1" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-500">差出人</p>
                <p className="text-sm text-gray-900 break-all">{email.from}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <AtSign className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-1" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-500">宛先</p>
                <p className="text-sm text-gray-900 break-all">{email.to.join(', ')}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">日付</p>
                <p className="text-sm text-gray-900">
                  {new Date(email.date).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-xl font-medium text-gray-900">
                {email.subject}
              </h3>
            </div>
            <div className="border-t border-gray-200 pt-6">
              <div
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ 
                  __html: email.html || email.text.split('\n').map(line => `<p>${line}</p>`).join('')
                }}
              />
            </div>
          </div>

          {email.attachments.length > 0 && (
            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Paperclip className="w-4 h-4 mr-2 text-indigo-400" />
                添付ファイル ({email.attachments.length})
              </h4>
              <ul className="space-y-2">
                {email.attachments.map((attachment, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <span className="font-medium">{attachment.filename}</span>
                      <span className="text-gray-400">
                        ({Math.round(attachment.size / 1024)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => downloadAttachment(attachment)}
                      className="p-2 rounded-full hover:bg-indigo-100 transition-colors group"
                      aria-label="ダウンロード"
                    >
                      <Download className="w-4 h-4 text-indigo-400 group-hover:text-indigo-500" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}