const fs = require('fs');
let c = fs.readFileSync('src/pages/settings/GeneralSettings.jsx', 'utf8');

// Also fix TypographySelect
c = c.replace('const TypographySelect = ({ label, value, onChange, options }) => (', 'const renderTypographySelect = (label, value, onChange, options) => (');
c = c.replace(/<TypographySelect\s+label=\{([^}]+)\}\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+options=\{([^}]+)\}\s+\/>/g, '{renderTypographySelect($1, $2, $3, $4)}');

// Fix ColorInput
c = c.replace('const ColorInput = ({ label, themeKey }) => (', 'const renderColorInput = (label, themeKey) => (');
c = c.replace(/<ColorInput label=\{([^}]+)\} themeKey="([^"]+)" \/>/g, '{renderColorInput($1, "$2")}');

fs.writeFileSync('src/pages/settings/GeneralSettings.jsx', c);
console.log('Fixed GeneralSettings inputs!');
