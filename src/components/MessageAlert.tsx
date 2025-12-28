import React from 'react';

interface MessageAlertProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  title?: string;
  buttonText?: string;
}

export default function MessageAlert({
  isOpen,
  message,
  onClose,
  title,
  buttonText = 'OK'
}: MessageAlertProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border-2 border-gray-600" onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="text-white text-lg font-semibold mb-4">{title}</h3>}
        <p className="text-gray-300 mb-4 whitespace-pre-line">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
