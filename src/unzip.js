const fs = require('fs-extra');
const StreamZip = require('node-stream-zip');

function unzip(zipPath) {
  return {
    to: extract,
  };

  function extract(outputDirectory) {
    fs.removeSync(outputDirectory);
    const zip = new StreamZip({file: zipPath});

    return new Promise((resolve, reject) => {
      zip.on('error', reject);
      zip.on('ready', () => {
        fs.ensureDirSync(outputDirectory);
        zip.extract(null, outputDirectory, (error) => {
          zip.close();
          if (error) {
            return reject(error);
          }
          resolve();
        });
      });
    });
  }
}

module.exports = unzip;
