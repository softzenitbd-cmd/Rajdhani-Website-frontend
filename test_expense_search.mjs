import apiClient from './src/api/apiClient.js';
import accountingService from './src/services/accountingService.js';

async function test() {
  try {
    const res = await accountingService.getExpenses({ page_size: 50 });
    console.log("Normal fetch count:", res?.count || res?.results?.length);
    
    const res2 = await accountingService.getExpenses({ search: 'Musa' });
    console.log("Search fetch count for 'Musa':", res2?.count || res2?.results?.length);

    const res3 = await accountingService.getExpenses({ page_size: 1000 });
    console.log("Large fetch count:", res3?.count || res3?.results?.length);

  } catch (err) {
    console.error("Error:", err.message);
    if(err.response) console.error("Response:", err.response.data);
  }
}

test();
