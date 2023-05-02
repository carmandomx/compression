const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const HOST_NAME = "localhost";
const PORT_NUMBER = 5000;

const server = http.createServer((req, res) => {
  if (req.url === "/upload" && req.method.toLowerCase() === "post") {
    // Get the compression format from the Accept-Encoding header
    const compressionFormat = req.headers["accept-encoding"] || "gzip";
    if (compressionFormat !== "gzip") {
      res.writeHead(406, { "Content-Type": "text/plain" });
      res.end("Not Acceptable");
      return;
    }

    // Create a temporary file to store the uploaded file
    const tempFilePath = path.join(__dirname, "tempfile");
    const tempFile = fs.createWriteStream(tempFilePath);

    // Write the uploaded file to the temporary file
    req.pipe(tempFile);

    // Listen for the 'finish' event on the request object
    req.on("finish", () => {
      // Read the temporary file and compress it
      const input = fs.createReadStream(tempFilePath);
      const output = input.pipe(zlib.createGzip());

      // Set response headers and send the compressed file
      const outputFilename = "compressed." + compressionFormat;
      res.setHeader("Content-Encoding", "gzip");
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${outputFilename}`
      );
      output.pipe(res);

      // Delete the temporary file
      fs.unlink(tempFilePath, (err) => {
        if (err) {
          console.error(`Error deleting file: ${tempFilePath}`, err);
        }
      });
    });
  } else if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    //
    fs.createReadStream(path.join(__dirname, "index.html")).pipe(res);
  } else {
    res.writeHead(501, { "Content-Type": "text/plain" });
    res.end("Not implemented");
  }
});

server.listen(PORT_NUMBER, HOST_NAME, () => {
  console.log(`Server running at http://${HOST_NAME}:${PORT_NUMBER}/`);
});
