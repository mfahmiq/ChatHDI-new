const axios = require('axios');

async function testMediaUrl() {
  const url = 'https://www.instagram.com/p/DZ9KlZVyymo/media/?size=l';
  try {
    console.log(`Checking redirect for: ${url}`);
    const res = await axios.get(url, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400
    });
    console.log('Status Code:', res.status);
    console.log('Headers:', res.headers);
  } catch (e) {
    if (e.response) {
      console.log('Redirect Status:', e.response.status);
      console.log('Location:', e.response.headers.location);
    } else {
      console.error('Error:', e.message);
    }
  }
}

testMediaUrl();
