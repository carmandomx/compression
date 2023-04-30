import http from "http";
import fs from "fs";
import path from "path";
import zlib from "zlib";

const requestListener = function (req, res) {
  if (req.url === "/") {
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
    let data = [];
    let fileName = ``;
    let acceptEncoding = "";
    req.on("data", (chunk) => {
      data.push(chunk);
    });
    req.on("end", () => {
      fileName = `Compressed file ${new Date().getMilliseconds()}`;
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
            const gzip = zlib.createGzip();
            const input = fs.createReadStream(oldPath);
            const output = fs.createWriteStream(`${newPath}.gz`);
            input.pipe(gzip).pipe(output);
            output.on("close", () => {
              res.setHeader("Content-Type", "application/gzip");
              res.setHeader(
                "Content-Disposition",
                `attachment; filename=./files/${fileName}.gz`
              );
              const compressedFileStream = fs.createReadStream(`${newPath}.gz`);
              compressedFileStream.pipe(res);
              fs.unlink(oldPath, () => {});
              fs.unlink(`${newPath}.gz`, () => {});
            });
          } else {
            const fileStream = fs.createReadStream(oldPath);
            fileStream.pipe(res);
            fileStream.on("close", () => {
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
