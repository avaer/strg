const path = require('path');
const http = require('http');

const express = require('express');

const app = express();
app.get('*', express.static(__dirname));

http.createServer(app)
  .listen(7778);
