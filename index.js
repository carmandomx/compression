const http = require("http");
const fs = require("fs");
const zlib = require("zlib");
const { pipeline } = require("stream");

const hostname = "localhost";
const port = 5000;

function parseMultipart(req, callback) {
  let data = "";
  let fileData = Buffer.from("");
  let boundary;

  req.on("data", (chunk) => {
    data += chunk;
    if (!boundary) {
      boundary = data.slice(0, data.indexOf("\r\n"));
    }

    let parts = data.split(boundary).filter((part) => part.trim() !== "");

    parts.forEach((part) => {
      if (part.includes("Content-Disposition: form-data")) {
        let fileStart = part.indexOf("\r\n\r\n") + 4;
        let fileEnd = part.lastIndexOf("\r\n");

        fileData = Buffer.concat([
          fileData,
          Buffer.from(part.slice(fileStart, fileEnd)),
        ]);
      }
    });

    data = "";
  });

  req.on("end", () => {
    callback(fileData);
  });
}

const server = http.createServer((req, res) => {
  if (req.url === "/" && req.method === "GET") {
    res.setHeader("Content-Type", "text/html");
    fs.createReadStream("index.html").pipe(res);
  } else if (req.url === "/upload" && req.method === "POST") {
    let contentType = req.headers["content-type"];
    let acceptEncoding = req.headers["accept-encoding"];
    let compressMethod;

    if (
      !contentType ||
      !contentType.startsWith("multipart/form-data") ||
      !acceptEncoding
    ) {
      res.statusCode = 400;
      res.end("Bad Request");
      return;
    }
    let fileExtension;

    if (acceptEncoding.includes("gzip")) {
      res.setHeader("Content-Encoding", "gzip");
      compressMethod = zlib.createGzip();
      fileExtension = ".gz";
    } else if (acceptEncoding.includes("deflate")) {
      res.setHeader("Content-Encoding", "deflate");
      compressMethod = zlib.createDeflate();
      fileExtension = ".deflate";
    } else {
      res.statusCode = 406;
      res.end("Not Acceptable");
      return;
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=compressed_file${fileExtension}`
    );

    parseMultipart(req, (fileData) => {
      const fileStream = require("stream").Readable.from(fileData);
      pipeline(fileStream, compressMethod, res, (err) => {
        if (err) {
          console.error(err);
          res.statusCode = 500;
          res.end("Internal Server Error");
        }
      });
    });
  } else {
    res.statusCode = 501;
    res.end("Not Implemented");
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at ${hostname}:${port}/`);
});
