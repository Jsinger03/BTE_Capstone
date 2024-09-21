import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const OCRApp = () => {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [fields, setFields] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setIsPdf(uploadedFile.type === 'application/pdf');
      if (uploadedFile.type !== 'application/pdf') {
        const reader = new FileReader();
        reader.onload = (event) => setFile(event.target.result);
        reader.readAsDataURL(uploadedFile);
      }
    }
  };

  const extractFields = (text) => {
    // ... (keep the existing extractFields function)
  };

  const performOCR = async () => {
    if (!file) return;

    setIsProcessing(true);
    setText('');
    setFields(null);

    let extractedText = '';

    if (isPdf) {
      // For PDF, we'll use pdf.js to render the page and then use Tesseract on the rendered image
      const pdf = await pdfjs.getDocument(file).promise;
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data } = await worker.recognize(canvas.toDataURL('image/png'));
      extractedText = data.text;
      await worker.terminate();
    } else {
      // For images, use Tesseract directly
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data: { text } } = await worker.recognize(file);
      extractedText = text;
      await worker.terminate();
    }

    setText(extractedText);
    const extractedFields = extractFields(extractedText);
    setFields(extractedFields);
    setIsProcessing(false);
  };

  const handleFieldChange = (field, value) => {
    setFields(prevFields => ({
      ...prevFields,
      [field]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFields(prevFields => ({
      ...prevFields,
      items: prevFields.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Receipt OCR Application</h1>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">File Upload</h2>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileUpload}
            className="mb-4"
          />
          {file && (
            <div>
              {isPdf ? (
                <Document
                  file={file}
                  onLoadSuccess={onDocumentLoadSuccess}
                >
                  <Page pageNumber={pageNumber} />
                </Document>
              ) : (
                <img src={file} alt="Uploaded" className="max-w-full h-auto mb-4" />
              )}
              <button 
                onClick={performOCR} 
                disabled={isProcessing}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Extract Information'}
              </button>
            </div>
          )}
        </div>
        <div className="w-full md:w-1/2 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Extracted Information</h2>
          {fields ? (
            <div>
              <div className="mb-2">
                <label className="font-semibold">Merchant:</label>
                <input 
                  type="text" 
                  value={fields.merchantName} 
                  onChange={(e) => handleFieldChange('merchantName', e.target.value)}
                  className="w-full p-1 border rounded"
                />
              </div>
              <div className="mb-2">
                <label className="font-semibold">Date:</label>
                <input 
                  type="text" 
                  value={fields.date} 
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                  className="w-full p-1 border rounded"
                />
              </div>
              <div className="mb-2">
                <label className="font-semibold">Total:</label>
                <input 
                  type="text" 
                  value={fields.total} 
                  onChange={(e) => handleFieldChange('total', e.target.value)}
                  className="w-full p-1 border rounded"
                />
              </div>
              <h3 className="font-semibold mt-2">Items:</h3>
              {fields.items.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    value={item.name} 
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    className="flex-grow p-1 border rounded"
                  />
                  <input 
                    type="text" 
                    value={item.price} 
                    onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                    className="w-24 p-1 border rounded"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p>No information extracted yet. Upload an image or PDF and click "Extract Information".</p>
          )}
        </div>
      </div>
      {text && (
        <div className="mt-4 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Raw Extracted Text</h2>
          <pre className="whitespace-pre-wrap">{text}</pre>
        </div>
      )}
    </div>
  );
};

export default OCRApp;