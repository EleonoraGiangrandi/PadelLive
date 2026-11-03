const https = require('https');

function checkImage(url) {
  https.get(url, res => {
    console.log(url, 'Status:', res.statusCode, 'Content-Length:', res.headers['content-length']);
  });
}

// Low res
checkImage('https://www.padelfip.com/wp-content/uploads/2025/12/Premier-Padel-2026-Master-Visual-30-3-225x300.jpg');
// Full HD
checkImage('https://www.padelfip.com/wp-content/uploads/2025/12/Premier-Padel-2026-Master-Visual-30-3.jpg');

// Low res Riyadh
checkImage('https://www.padelfip.com/wp-content/uploads/2025/12/W_2481-x-H_3508-px.jpg-1-212x300.jpeg');
// Full HD Riyadh
checkImage('https://www.padelfip.com/wp-content/uploads/2025/12/W_2481-x-H_3508-px.jpg-1.jpeg');
