// const ftp = require("basic-ftp");
// require("dotenv").config();

// async function uploadFile(localPath, remoteFileName) {
//   const client = new ftp.Client();
//   try {
//     await client.access({
//       host: process.env.FTP_HOST,
//       user: process.env.FTP_USER,
//       password: process.env.FTP_PASSWORD,
//       port: process.env.FTP_PORT || 21,
//       secure: false,
//     });
//     await client.uploadFrom(localPath, remoteFileName);
//     console.log("Uploaded:", remoteFileName);
//   } catch (err) {
//     console.error(err);
//   }
//   client.close();
// }

// module.exports = { uploadFile };
