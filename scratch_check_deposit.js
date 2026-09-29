import { accountingService } from './src/services/accountingService.js';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
  const res = await accountingService.getDepositReport({page_size: 1});
  console.log(JSON.stringify(res, null, 2));
}
// But wait, apiClient uses token from localStorage, this is a browser app. I can't just run it in Node.
