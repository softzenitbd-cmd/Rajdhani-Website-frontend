const fs = require('fs');
const productPath = 'c:\\Users\\SoftZen It\\rajdhane_garments\\src\\pages\\product\\ProductCreate.jsx';
let content = fs.readFileSync(productPath, 'utf8');

const target = `const ProductCreate = () => {
  const toast = useToast();
  const { settings } = useAppSettings();
  const companyInfo = companyStore.getCached();
  const autoCalculateSalePrice = companyInfo.sale_price_auto_generate === true || companyInfo.sale_price_auto_generate === 'true';
  const salePricePercentage = Number(companyInfo.sale_price_percentage) || 0;`;

const repl = `const ProductCreate = () => {
  const toast = useToast();
  const { settings } = useAppSettings();
  
  const [companyInfo, setCompanyInfo] = useState(() => companyStore.getCached());

  useEffect(() => {
    const handleUpdate = () => setCompanyInfo(companyStore.getCached());
    window.addEventListener(companyStore.EVENT, handleUpdate);
    companyStore.load();
    return () => window.removeEventListener(companyStore.EVENT, handleUpdate);
  }, []);

  const autoCalculateSalePrice = companyInfo.sale_price_auto_generate === true || companyInfo.sale_price_auto_generate === 'true';
  const salePricePercentage = Number(companyInfo.sale_price_percentage) || 0;`;

content = content.replace(target, repl);
fs.writeFileSync(productPath, content, 'utf8');
console.log("Patched ProductCreate");
