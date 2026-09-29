import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const shareAsPDF = async (elementSelector, fileName = 'document.pdf', title = 'Shared Document') => {
  const element = document.querySelector(elementSelector);
  if (!element) {
    console.error("Element not found for selector: " + elementSelector);
    return;
  }

  // Temporarily hide elements with .no-print class
  const noPrintElements = document.querySelectorAll(elementSelector + ' .no-print');
  const originalStyles = [];
  noPrintElements.forEach(el => {
    originalStyles.push(el.style.display);
    el.style.display = 'none';
  });

  try {
    const canvas = await html2canvas(element, { 
      scale: 2,
      useCORS: true,
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // If the content is longer than one page, jsPDF can cut it off, but for typical use it's fine
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    const pdfBlob = pdf.output('blob');
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: title,
        files: [file]
      });
    } else {
      // Fallback to downloading if sharing is not supported
      pdf.save(fileName);
      alert("Sharing PDF is not supported on this device. The file has been downloaded instead.");
    }
  } catch (err) {
    console.error("Error generating or sharing PDF", err);
    alert("An error occurred while generating the PDF.");
  } finally {
    // Restore .no-print elements
    noPrintElements.forEach((el, index) => {
      el.style.display = originalStyles[index];
    });
  }
};
