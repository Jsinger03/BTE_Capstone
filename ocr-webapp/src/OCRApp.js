import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';

const OCRApp = () => {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const performOCR = async () => {
    if (!image) return;

    setIsProcessing(true);
    setText('');

    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(image);
    setText(text);
    await worker.terminate();

    setIsProcessing(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">OCR Web Application</h1>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Image Upload</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="mb-4"
          />
          {image && (
            <div>
              <img src={image} alt="Uploaded" className="max-w-full h-auto mb-4" />
              <button 
                onClick={performOCR} 
                disabled={isProcessing}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Extract Text'}
              </button>
            </div>
          )}
        </div>
        <div className="w-full md:w-1/2 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Extracted Text</h2>
          {text ? (
            <pre className="whitespace-pre-wrap">{text}</pre>
          ) : (
            <p>No text extracted yet. Upload an image and click "Extract Text".</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OCRApp;