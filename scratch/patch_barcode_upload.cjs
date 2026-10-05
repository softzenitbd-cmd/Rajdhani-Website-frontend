const fs = require('fs');

const filePath = 'c:\\Users\\SoftZen It\\rajdhane_garments\\src\\pages\\settings\\CompanyInformation.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Define barcodeBannerHistory
const historyPattern = /const bannerHistory = Array\.isArray\(settings\.banner_history\) \? settings\.banner_history : \[\];/;
if (content.match(historyPattern)) {
    content = content.replace(historyPattern, `const bannerHistory = Array.isArray(settings.banner_history) ? settings.banner_history : [];
  const barcodeBannerHistory = Array.isArray(settings.barcode_banner_history) ? settings.barcode_banner_history : [];`);
}

// 2. Rewrite uploadBarcodeHeaderImage
const oldUploadFunctionRegex = /const uploadBarcodeHeaderImage = async \(file\) => \{[\s\S]*?const handleBarcodeBannerChange = async \(e\)/;
const newUploadFunction = `const uploadBarcodeHeaderImage = async (file) => {
    const currentBanner = settings.barcode_header_custom_url || null;
    let newHistory = [...barcodeBannerHistory];
    if (currentBanner && !newHistory.includes(currentBanner)) {
      newHistory = [currentBanner, ...newHistory].slice(0, 3);
    }
    
    const base64Url = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

    await updateSettings({ 
      barcode_header_mode: 'image',
      barcode_header_card: 'custom_upload',
      barcode_header_custom_url: base64Url,
      barcode_banner_history: newHistory
    });
  };

  const handleBarcodeBannerChange = async (e)`;
content = content.replace(oldUploadFunctionRegex, newUploadFunction);

// 3. Update the UI to use barcodeBannerHistory instead of bannerHistory for the Barcode section cards
// Find the div with "Barcode Header Banner Selection" and replace all bannerHistory inside it with barcodeBannerHistory
const barcodeSectionStart = content.indexOf('{/* Barcode Header Banner Selection */}');
if (barcodeSectionStart !== -1) {
    const beforeSection = content.substring(0, barcodeSectionStart);
    let sectionContent = content.substring(barcodeSectionStart);
    
    // Within sectionContent, replace bannerHistory with barcodeBannerHistory
    sectionContent = sectionContent.replace(/bannerHistory/g, 'barcodeBannerHistory');
    
    content = beforeSection + sectionContent;
}

// 4. Update saveBarcodeHeaderSettings to use barcodeBannerHistory
// Since we already replaced bannerHistory with barcodeBannerHistory in the whole section below, 
// wait, saveBarcodeHeaderSettings is defined BEFORE the barcode section, so it might not be covered by step 3.
const saveBarcodePattern = /const customUrl = bannerHistory\[idx\];/;
if (content.match(saveBarcodePattern)) {
    content = content.replace(saveBarcodePattern, 'const customUrl = barcodeBannerHistory[idx];');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Fixed barcode upload and history isolation");
