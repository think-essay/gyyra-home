const https = require('https');
const fs = require('fs');

https.get('https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8', (response) => {
  const chunks = [];
  response.on('data', (chunk) => chunks.push(chunk));
  response.on('end', () => {
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const images = (data.images || []).map((image) => image.url);
    if (images.length === 0) throw new Error('Bing returned no images');
    fs.mkdirSync('./assets/json', { recursive: true });
    fs.writeFileSync('./assets/json/images.js', `window.BING_IMAGES = ${JSON.stringify(images)};\n`);
    console.log(`Updated ${images.length} Bing images.`);
  });
}).on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});
