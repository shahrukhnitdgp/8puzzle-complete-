const express = require('express');
const app = express();
const download = require('image-downloader')
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const sharp=require("sharp");
const resolve = require('path').resolve
const serveStatic = require('serve-static')
const fs = require("fs")
var sizeOf = require('image-size');
// const { max } = require('moment');


app.use(fileUpload({
    createParentPath: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

crop_into_tiles=async (originalImage,foldername,smaller)=>{
    var cur_x=0
    var cur_y=0
    var flag=0

    try{
        let cropped_final="./puzzle-redux/uploads/"+foldername+"/croppedfinal.jpg";
        var crop=await sharp(originalImage).extract({ width: smaller, height: smaller, left: 0, top: 0 }).toFile(cropped_final)
        var small_tile_size=Math.floor(smaller/4)
      
        for(let i=1;i<17;i++){
    
            let outputImage = './puzzle-redux/uploads/'+foldername+"/" +i+".jpg";
            sharp.cache(false);
    
            var small_crop=await sharp(originalImage).extract({ width: small_tile_size, height: small_tile_size, left: cur_x, top: cur_y }).toFile(outputImage)
                
            console.log(JSON.stringify(small_crop)+"is "+i+"th iteration")
            if(i%4===0){
                cur_x=0
                cur_y=cur_y+small_tile_size
            }
            else{
                cur_x=cur_x+small_tile_size
            }
                //   console.log(flag+"is flag")
        }
      
      
      return true;
    }
    catch(err)
    {
        return false;
    }

}


const file_download= (link,res,foldername)=>{

    var finalpath="./puzzle-redux/uploads/"+foldername

    fs.mkdir(finalpath, function(err) {
        if (err) {
          console.log("folder not created")

        } else {
          console.log("New directory successfully created.")

          const options = {
            url: link,
            dest: finalpath+'/target.jpg'                // will be saved to /path/to/dest/image.jpg
            }
            
            download.image(options)
            .then((File) => {
                console.log('Saved to', File.filename)
                let originalImage = File.filename;
                
                // file name for cropped image

                sizeOf(originalImage, async function (err, dimensions) {
                    console.log(dimensions.width, dimensions.height);
                    const width=dimensions.width;
                    const height=dimensions.height;
                    var smaller=Math.min(width,height)
                    // if(width>399 && height>399){
                        flag=1;
                        console.log("right dimesnion")
                        var r=await crop_into_tiles(originalImage,foldername,smaller)
                        if(r===true)
                        res.status(200).json({
                            "status":"successful",
                            "foldername":foldername
                        })
                        else{
                            res.status(200).json({
                                "status":"unsuccessful",
                                "foldername":foldername
                            })
                        }
                        
                    // }
                    // else{
                    // res.status(200).json({
                    //     "status":"unsuccessful",
                    //     "foldername":foldername
                    // })}
                  });  

                
                // return File // saved to /path/to/dest/image.jpg
            }).catch(err=>{
                console.log(err)
                res.status(400).json({"status":"error"})
            })
        }
})
    
}

const  download_file_to_server=  (FileObject,res,foldername)=>{
    // let filename=FileObject.name
    var finalpath="./puzzle-redux/uploads/"+foldername
    console.log(finalpath+"requested")
    fs.mkdir(finalpath, function(err) {
        if (err) {
          console.log("folder not created")

        } else {
          console.log("New directory successfully created.")

          FileObject.mv("./puzzle-redux/uploads/"+foldername+"/target.jpg").then(()=>{
            const filename=resolve("./puzzle-redux/uploads/"+foldername+"/target.jpg")

            sizeOf(filename,async function (err, dimensions) {
                console.log(dimensions.width, dimensions.height);
                const width=dimensions.width;
                const height=dimensions.height;
                var small=Math.min(width,height)
                // if(width>399 && height>399){
                    flag=1;
                    console.log("right dimesnion")
                    var r=await crop_into_tiles(filename,foldername,small)
                    if(r===true)
                        res.status(200).json({
                            "status":"successful",
                            "foldername":foldername
                        })
                    else{
                        res.status(200).json({
                            "status":"unsuccessful",
                            "foldername":foldername
                        })
                    }
                // }
                // else{
                // res.status(200).json({
                //     "status":"unsuccessful",
                //     "foldername":foldername
                // })}
              }); 

            
            }).catch(err=>{
                console.log(err)
                res.status(400).json({"status":"error"})
            })
        }
})
}

app.post('/url', (req, res) => {
    var foldername=new Date().getTime()+""
    file_download(req.body.url,res,foldername)
   
    console.log("request received"+req.body.url)                
                
})

app.post('/upload',(req,res)=>{
    var foldername=new Date().getTime()+""
    download_file_to_server(req.files.File,res,foldername)
   
    console.log(req.files.File.name+"is the file received")


})

app.use('/uploads',express.static('puzzle-redux/uploads'))
// app.use('/target',serveStatic('puzzle-redux/uploads/croppedfinal.jpg',{cacheControl:false}))
app.use('/',express.static("puzzle-redux/build"))
app.listen(8080)