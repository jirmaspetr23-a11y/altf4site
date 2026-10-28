const http = require('http');
const speakeasy = require('speakeasy');
const token = speakeasy.totp({ secret: 'GJ4XS6CLGBATCZDDIRWWWZDFPBHDAPDS', encoding: 'base32' });

const postData = JSON.stringify({ username: 'OPskank', totp_code: token });

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const r = JSON.parse(data);
      process.stdout.write(r.token || '');
    } catch(e) {
      process.stdout.write('');
    }
  });
});
req.write(postData);
req.end();
