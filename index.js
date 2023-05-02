const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const HOST_NAME = "localhost";
const PORT_NUMBER = 5000;

const server = http.createServer((req, res) => {
  if (req.url === "/upload" && req.method.toLowerCase() === "post") {
    const compressionFormat = req.headers["accept-encoding"] || "gzip";
    if (compressionFormat !== "gzip") {
      res.writeHead(406, { "Content-Type": "text/plain" });
      res.end("Not Acceptable");
      return;
    }

    const tempFilePath = path.join(__dirname, "tempfile");
    const tempFile = fs.createWriteStream(tempFilePath);

    req.pipe(tempFile);

    req.on("finish", () => {
      const input = fs.createReadStream(tempFilePath);
      const output = input.pipe(zlib.createGzip());

      const outputFilename = "compressed." + compressionFormat;
      res.setHeader("Content-Encoding", "gzip");
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${outputFilename}`
      );
      output.pipe(res);

      fs.unlink(tempFilePath, (err) => {
        if (err) {
          console.error(`Can not delete the ${tempFilePath} file`, err);
        }
      });
    });
  } else if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream(path.join(__dirname, "index.html")).pipe(res);
  } else {
    res.writeHead(501, { "Content-Type": "text/plain" });
    res.end("Could not implemented the compression");
  }
});

server.listen(PORT_NUMBER, HOST_NAME, () => {
  console.log(`Server running at http://${HOST_NAME}:${PORT_NUMBER}/`);
});
