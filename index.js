import http from "http";
import fs from "fs";
import zlib from "zlib";

const requestListener = function (req, res) {
  // Check if the request is for the root URL
  if (req.url === "/") {
    // If it is, read the index.html file and send it as the response
    fs.readFile("./index.html", (err, data) => {
      // If there's an error reading the file, send a 500 error with a text/plain content type
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
    let data = [];
    let fileName = `Compressed file ${new Date().getSeconds()}.gz`;
    let acceptEncoding = "";
    req.on("data", (chunk) => {
      data.push(chunk);
    });
    req.on("end", () => {
      // When the request has finished, set the fileName and acceptEncoding variables
      acceptEncoding = req.headers["accept-encoding"];
      const file = Buffer.concat(data);
      const oldPath = `./${fileName}`;
      const newPath = `./files/${fileName}`;
      fs.writeFile(oldPath, file, (err) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Internal Server Error");
        } else {
          res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + fileName
          );
          res.setHeader("Content-Type", "application/octet-stream");
          if (acceptEncoding && acceptEncoding.includes("gzip")) {
            // If the client accepts gzip encoding, compress the file using gzip
            const gzip = zlib.createGzip();
            const input = fs.createReadStream(oldPath);
            const output = fs.createWriteStream(`${newPath}`);
            input.pipe(gzip).pipe(output);
            output.on("close", () => {
              // When the compression is complete, send the compressed file as a response
              res.setHeader("Content-Type", "application/gzip");
              res.setHeader(
                "Content-Disposition",
                `attachment; filename=./files/${fileName}`
              );
              const compressedFileStream = fs.createReadStream(`${newPath}`);
              compressedFileStream.pipe(res);
              compressedFileStream.on("close", () => {
                // Delete the original and compressed files from the server

                fs.unlink(oldPath, () => {});
                fs.unlink(`${newPath}`, () => {});
              });
            });
          } else {
            const fileStream = fs.createReadStream(oldPath);
            fileStream.pipe(res);
            fileStream.on("close", () => {
              // When the response is finished, delete the file from the server
              fs.unlink(oldPath, () => {});
            });
          }
        }
      });
    });
  } else {
    res.statusCode = 501;
    res.setHeader("Content-Type", "text/plain");
    res.end("Not implemented");
  }
};

const server = http.createServer(requestListener);

const PORT = 5000;
server.listen(PORT, "localhost", () => {
  console.log(`Server is running on port ${PORT}`);
});
