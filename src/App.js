import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import './App.css';

function App() {
  const [files, setFiles] = useState([]);
  const dropRef = useRef();

  const handleFiles = (selectedFiles) => {
    const imageFiles = Array.from(selectedFiles).filter(file =>
      file.type.startsWith('image/')
    );
    setFiles(prev => [...prev, ...imageFiles]);
  };

  const handleInputChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
    dropRef.current.classList.remove('drag-over');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dropRef.current.classList.add('drag-over');
  };

  const handleDragLeave = () => {
    dropRef.current.classList.remove('drag-over');
  };

  const removeFile = (index) => {
    const updated = [...files];
    updated.splice(index, 1);
    setFiles(updated);
  };

  const generatePDF = async () => {
    if (files.length === 0) {
      alert("Nenhuma imagem selecionada.");
      return;
    }

    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
      const imageBytes = await file.arrayBuffer();
      let image;
      let dims;

      if (file.type === 'image/png') {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        image = await pdfDoc.embedJpg(imageBytes);
      }

      dims = image.scale(1);

      const page = pdfDoc.addPage([dims.width, dims.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: dims.width,
        height: dims.height,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'scanunifier.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="App">
      <h1>ScanUnifier 🖨 </h1>

      <div
        className="drop-zone"
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <p>Arraste e solte imagens aqui ou clique abaixo</p>
        <input type="file" multiple accept="image/*" onChange={handleInputChange} />
      </div>

      <ul>
        {files.map((file, i) => (
          <li key={i}>
            {file.name}
            <button onClick={() => removeFile(i)}>Remover</button>
          </li>
        ))}
      </ul>

      <button onClick={generatePDF}>Unificar em PDF</button>
    </div>
  );
}

export default App;
