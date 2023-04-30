//CODE HERE
const http = require("http");
const fs = require("fs");
const zlib = require("zlib");
const { pipeline } = require("stream");

const hostname = "localhost";
const port = 5000;

// Function to parse multipart/form-data from the request
function parseMultipart(req, callback) {
  let data = "";
  let fileData = Buffer.from("");
  let boundary;

  // Read the data from the request
  req.on("data", (chunk) => {
    data += chunk;
    // Find the boundary string
    if (!boundary) {
      boundary = data.slice(0, data.indexOf("\r\n"));
    }

    // Split the data by the boundary and filter out empty parts
    let parts = data.split(boundary).filter((part) => part.trim() !== "");

    // Process each part
    parts.forEach((part) => {
      // Check if the part contains a file
      if (part.includes("Content-Disposition: form-data")) {
        // Find the start and end positions of the file data
        let fileStart = part.indexOf("\r\n\r\n") + 4;
        let fileEnd = part.lastIndexOf("\r\n");

        // Extract the file data and concatenate it to the fileData buffer
        fileData = Buffer.concat([
          fileData,
          Buffer.from(part.slice(fileStart, fileEnd)),
        ]);
      }
    });

    // Clear the data string
    data = "";
  });

  // When the request has been completely read, call the callback function with the fileData buffer
  req.on("end", () => {
    callback(fileData);
  });
}

const server = http.createServer((req, res) => {
  // Serve the index.html file for the root path and GET method
  if (req.url === "/" && req.method === "GET") {
    res.setHeader("Content-Type", "text/html");
    fs.createReadStream("index.html").pipe(res);
  } else if (req.url === "/upload" && req.method === "POST") {
    // Process the file upload for the /upload path and POST method
    let contentType = req.headers["content-type"];
    let acceptEncoding = req.headers["accept-encoding"];
    let compressMethod;

    // Check the content type and accept encoding headers
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

    // Choose the compression method based on the accept encoding header
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

    // Set the content disposition header to trigger a download in the browser
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=compressed_file${fileExtension}`
    );

    // Parse the multipart request and process the file data
    parseMultipart(req, (fileData) => {
      // Create a readable stream from the fileData buffer
      const fileStream = require("stream").Readable.from(fileData);
      // Use the pipeline to compress the file stream and send it as the response
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
