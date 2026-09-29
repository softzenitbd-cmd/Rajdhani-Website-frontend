import fetch from 'node-fetch';

async function checkApi() {
  try {
    const res = await fetch('http://localhost:8000/api/crm/reports/client-due/', {
      headers: {
        'Authorization': 'Bearer 2|tY87eY8w65iP99L4J3Z2Qx7qG7sZ7gT8bQ9L5x8r' // I don't have the token, wait. Let's just read it from localStorage if we were in browser.
      }
    });
    console.log(await res.text());
  } catch(e) {
    console.error(e);
  }
}
checkApi();
