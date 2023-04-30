const http = require("http");
const fs = require("fs");
const zlib = require("zlib");
const { pipeline } = require("stream");

const hostname = 'localhost';
const PORT = 5000;

// Parse multipart/form-data
let parsePartFile = (req) => {
  return new Promise((resolve, reject) => {
    let typeContentFile = req.headers['content-type'];
    let receiveEncoding = req.headers['accept-encoding'];
    let methodOfCompression;
    let fileExt;

    // Content type is checked
    if (!typeContentFile || !typeContentFile.startsWith('multipart/form-data') || !receiveEncoding) {
      reject({ statusCode: 400, message: 'Bad Request' });
      return;
    }

    // Compression method
    if (receiveEncoding.includes('gzip')) {
      methodOfCompression = zlib.createGzip();
      fileExt = '.gz';
    } 
    else {
      // Path not valid
      reject({ statusCode: 406, message: 'Not Valid' });
      return;
    }

    // Trigger a download in the browser
    res.setHeader('Content-Disposition', `attachment; filename=compressed_file${fileExt}`);

    // Create a writable stream to collect the file data
    const fileArr = [];
    const collectStream = new stream.Writable({
      write(chunk, encoding, callback) {
        fileArr.push(chunk);
        callback();
      },
    });

    collectStream.on('finish', () => {
      resolve(Buffer.concat(fileArr));
    });

    // Send error message
    req.pipe(collectStream).on('error', (err) => {
      reject({ statusCode: 500, message: 'Server Error' });
    });
  });
}

let handleRequest = (req, res) => {
  // html root path
  if (req.url === '/' && req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html');
    fs.createReadStream('index.html').pipe(res);
  }
  // Once the file is upload it will be process
  else if (req.url === '/upload' && req.method === 'POST') {
    parsePartFile(req).then((fileArr) => {

        let methodOfCompression = zlib.createGzip();
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Disposition', 'attachment; filename=compressed_file.gz');
        const fileStream = stream.Readable.from(fileArr);
        pipeline(fileStream, methodOfCompression, res, (err) => {
          if (err) {
            handleError(res, 500, "Server Error");
          }
        });
      })
      .catch((error) => {
        handleError(res, error.statusCode, error.message);
      });
  } 
  else {
    // In case user use path non valid
    handleError(res, 501, 'Not Implemented');
  }
}

function handleError(res, statusCode, message) {
  res.statusCode = statusCode;
  res.end(message);
}

const server = http.createServer(handleRequest);

// Server is listening
server.listen(PORT, hostname, () => {
  console.log(`Server is listening at ${hostname}:${PORT}/`);
});
