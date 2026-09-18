const http = require('http');

http.get('http://127.0.0.1:5000/api/centres', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log('Centres count:', json.count);
    json.centres.forEach(c => {
      console.log(`Centre ${c.name} (${c.code}) ID=${c._id}:`, c.ratePerKg);
    });
  });
}).on('error', (err) => {
  console.error('API Error details:', err);
});
