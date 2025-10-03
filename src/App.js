import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import './App.css';

function App() {
  const [files, setFiles] = useState([]);
  const dropRef = useRef();

  // Aceita arquivos de imagem ou PDF
  const handleFiles = (selectedFiles) => {
    const validFiles = Array.from(selectedFiles).filter(file =>
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    setFiles(prev => [...prev, ...validFiles]);
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
    const supportedFiles = files.filter(file =>
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );

    if (supportedFiles.length === 0) {
      alert("Nenhum arquivo suportado selecionado.");
      return;
    }

    const pdfDoc = await PDFDocument.create();

    for (const file of supportedFiles) {
      const fileBytes = await file.arrayBuffer();

      if (file.type === 'application/pdf') {
        // Importar páginas do PDF existente
        const donorPdf = await PDFDocument.load(fileBytes);
        const copiedPages = await pdfDoc.copyPages(donorPdf, donorPdf.getPageIndices());
        copiedPages.forEach((page) => {
          pdfDoc.addPage(page);
        });
      } else if (file.type.startsWith('image/')) {
        // Adicionar imagem como nova página
        let image;
        if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(fileBytes);
        } else {
          image = await pdfDoc.embedJpg(fileBytes);
        }

        const dims = image.scale(1);
        const page = pdfDoc.addPage([dims.width, dims.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: dims.width,
          height: dims.height,
        });
      } else {
        console.warn(`Tipo de arquivo ignorado: ${file.name}`);
      }
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
      <h1>ScanUnifier 🖨</h1>

      <div
        className="drop-zone"
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <p>Arraste e solte imagens ou PDFs aqui ou clique abaixo</p>
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={handleInputChange}
        />
      </div>

      <ul>
        {files.map((file, i) => (
          <li key={i}>
            {file.name} ({file.type})
            <button onClick={() => removeFile(i)}>Remover</button>
          </li>
        ))}
      </ul>

      <button onClick={generatePDF}>Unificar em PDF</button>
    </div>
  );
}

export default App;
