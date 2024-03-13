import multer from "multer";


//why use multer as a middleware??
//==> bcz whenever we need to check if the file is uploaded or not wherever needed so inject there as a middleware and check.(like wherever we need to upload the file like a registration form)

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ storage })



