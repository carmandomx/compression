import http from 'http'
import fs from 'fs'
import zlib from 'zlib'
import {URL} from 'url'
import {pipeline} from 'stream'
import { StringDecoder } from 'string_decoder'
const { createReadStream, createWriteStream } = fs;

// Hostname and port for the server
const hostname = 'localhost';
const port = 5000;

// Create the HTTP server
const server = http.createServer((req, res) => {
  // Serve the index.html file for the root path
  if (req.method === 'GET' && req.url === '/') {
    fs.readFile('./index.html', (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Internal Server Error');
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.end(data);
      }
    });
  } else if (req.method === 'POST' && req.url === '/upload') {
    // Function to compress the incoming stream based on the given encoding
    const compress = (encoding, stream) => {
      switch (encoding) {
        case 'gzip':
          return stream.pipe(zlib.createGzip());
        case 'deflate':
          return stream.pipe(zlib.createDeflate());
        default:
          return stream;
      }
    };

    // Check if the Accept-Encoding header is present
    if (!req.headers['accept-encoding']) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Bad Request: Accept-Encoding header is missing');
      return;
    }

    // Get the first encoding from the Accept-Encoding header
    const encoding = req.headers['accept-encoding'].split(',')[0];
    // Set the response headers for the compressed file download
    res.setHeader('Content-Encoding', encoding);
    res.setHeader('Content-Disposition', 'attachment; filename="compressed_file"');

    // Use the pipeline function to compress and send the response
    pipeline(req, compress(encoding, req), res, (err) => {
      if (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Internal Server Error');
      }
    });
  } else {
    // Return 501 Not Implemented for all other paths
    res.statusCode = 501;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not Implemented');
  }
});

// Start the server and listen on the defined hostname and port
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});