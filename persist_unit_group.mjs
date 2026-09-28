import fs from 'fs';

let content = fs.readFileSync('src/components/AddProductModal.jsx', 'utf8');

// Update handleChange
content = content.replace(
  'setFormData((prev) => ({ ...prev, [name]: value }));',
  'setFormData((prev) => ({ ...prev, [name]: value }));\n    if (name === \'unit\' || name === \'group\') {\n      localStorage.setItem(\'last_\' + name, value);\n    }'
);

// Update useEffect(isOpen)
content = content.replace(
  /setFormData\(\{\s*name: '',\s*buying_price: '',\s*selling_price: '',\s*opening_stock: '',\s*unit: '',\s*group: ''\s*\}\);/,
  "setFormData({\n        name: '',\n        buying_price: '',\n        selling_price: '',\n        opening_stock: '',\n        unit: localStorage.getItem('last_unit') || '',\n        group: localStorage.getItem('last_group') || ''\n      });"
);

// Update handleAddUnit
content = content.replace(
  'setFormData((prev) => ({ ...prev, unit: newUnit.id }));',
  'setFormData((prev) => ({ ...prev, unit: newUnit.id }));\n      localStorage.setItem(\'last_unit\', newUnit.id);'
);

// Update handleAddGroup
content = content.replace(
  'setFormData((prev) => ({ ...prev, group: newGroup.id }));',
  'setFormData((prev) => ({ ...prev, group: newGroup.id }));\n      localStorage.setItem(\'last_group\', newGroup.id);'
);

fs.writeFileSync('src/components/AddProductModal.jsx', content);
console.log('Added localStorage persistence for unit and group');
