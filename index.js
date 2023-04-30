const http = require("http");
const fs = require("fs");
const zlib = require("zlib");
const { pipeline } = require("stream");

const hostname = "localhost";
const port = 5000;

// Create the HTTP server
const server = http.createServer((req, res) => {
  // If the request is for the root path and the method is GET
  if (req.url === "/" && req.method === "GET") {
    // Set the response content type to HTML
    res.setHeader("Content-Type", "text/html");
    // Read the index.html file and send it as the response
    fs.createReadStream("index.html").pipe(res);
  } else if (req.url === "/upload" && req.method === "POST") {
    // If the request is for the /upload endpoint and the method is POST
    let contentType = req.headers["content-type"];
    let acceptEncoding = req.headers["accept-encoding"];
    let compressMethod;

    // Check if the request has the required content type and accept-encoding headers
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
    // Determine the compression method based on the accept-encoding header
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

    // Set the content-disposition header to trigger a download in the browser
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=compressed_file${fileExtension}`
    );

    // Use the pipeline function to stream the request, compress it, and send the response
    pipeline(req, compressMethod, res, (err) => {
      // Handle errors during the pipeline process
      if (err) {
        console.error(err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });
  } else {
    // If the request is for any other path, return a 501 Not Implemented status
    res.statusCode = 501;
    res.end("Not Implemented");
  }
});

// Start the server on the specified hostname and port
server.listen(port, hostname, () => {
  console.log(`Server running at ${hostname}:${port}/`);
});
