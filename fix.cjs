const fs = require('fs');
let c = fs.readFileSync('src/pages/settings/GeneralSettings.jsx', 'utf8');

// 1. We have this IIFE start:
// {(() => {
//   const TypographySelect = ...
//   const ColorInput = ...
//   return (
//     <>
//       <div>...

// 2. We can just move TypographySelect and ColorInput to the top of the file, outside of the default export.
const typoRegex = /const TypographySelect = \(\{ label, value, onChange, options \}\) => \([\s\S]*?<\/[a-z]+>\s*\);\s*/m;
const colorRegex = /const ColorInput = \(\{ label, themeKey \}\) => \([\s\S]*?<\/[a-z]+>\s*\);\s*/m;

const typoMatch = c.match(typoRegex);
const colorMatch = c.match(colorRegex);

if (typoMatch && colorMatch) {
  // Remove them from the IIFE
  c = c.replace(typoMatch[0], '');
  
  // Modify ColorInput to accept value and onChange instead of themeKey implicitly from parent scope
  let newColorInputStr = colorMatch[0].replace('({ label, themeKey })', '({ label, value, onChange })');
  newColorInputStr = newColorInputStr.replace(/localTheme\[themeKey\] \|\| '#ffffff'/g, "value || '#ffffff'");
  newColorInputStr = newColorInputStr.replace(/localTheme\[themeKey\] \|\| ''/g, "value || ''");
  newColorInputStr = newColorInputStr.replace(/\(e\) => handleColorChange\(themeKey, e\.target\.value\)/g, "onChange");
  
  // Put them at the top of the file
  const importsEnd = c.lastIndexOf("import");
  const nextLineIdx = c.indexOf("\n", importsEnd) + 1;
  
  c = c.slice(0, nextLineIdx) + "\n" + typoMatch[0] + "\n" + newColorInputStr + "\n" + c.slice(nextLineIdx);
  
  // Now we must replace all `<ColorInput label={...} themeKey="..." />` 
  // with `<ColorInput label={...} value={localTheme["..."]} onChange={(e) => handleColorChange("...", e.target.value)} />`
  c = c.replace(/<ColorInput label=\{([^}]+)\} themeKey="([^"]+)" \/>/g, function(match, label, themeKey) {
    return `<ColorInput label={${label}} value={localTheme["${themeKey}"]} onChange={(e) => handleColorChange("${themeKey}", e.target.value)} />`;
  });
  
  fs.writeFileSync('src/pages/settings/GeneralSettings.jsx', c);
  console.log("Successfully extracted components!");
} else {
  console.log("Could not match the components");
}
