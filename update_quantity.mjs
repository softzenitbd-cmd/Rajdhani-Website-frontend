import fs from 'fs';
let content = fs.readFileSync('src/components/BarcodePrintModal.jsx', 'utf8');

const newCode = `
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      setQuantity(Number(product.stock || product.opening_stock || 1));
    }
  }, [product]);
`;

content = content.replace(
  'const { t } = useTranslation();\n  const [quantity, setQuantity] = useState(1);',
  newCode.trim()
);

fs.writeFileSync('src/components/BarcodePrintModal.jsx', content);
console.log('Updated quantity from stock');
