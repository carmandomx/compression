const http = require("http");
const fs = require("fs");
const zlib = require("zlib");

const hostname = "localhost";
const port = 5000;

const server = http.createServer((req, res) => {
  if (req.url === "/" && req.method === "GET") {
    fs.readFile("./index.html", (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/plain");
        res.end("Internal server error");
      } else {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        res.end(data);
      }
    });
  } else if (req.url === "/upload" && req.method === "POST") {
    const chunks = [];

    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      const data = Buffer.concat(chunks);
      const fileNameRegex = /filename="(.*)"/;
      const fileNameMatch = data.toString().match(fileNameRegex);
      if (!fileNameMatch) {
        res.writeHead(400);
        res.end("Name of the file not found");
        return;
      }
      const fileName = fileNameMatch[1];
      const fileStartIndex = data.indexOf("\r\n\r\n") + 4;
      const fileData = data.slice(fileStartIndex);
      const compressedData = zlib.gzipSync(fileData);
      res.setHeader(
        "Content-disposition",
        `attachment; filename=${fileName}.gz`
      );
      res.setHeader("Content-Type", "application/gzip");
      res.end(compressedData);
    });
  } else {
    res.statusCode = 501;
    res.setHeader("Content-Type", "text/plain");
    res.end("Not implemented");
  }
});

server.listen(port, hostname, () => {
  console.log(`Server is running on http://${hostname}:${port}`);
});
