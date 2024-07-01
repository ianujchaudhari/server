const mongoose = require("mongoose");
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const dotenv = require('dotenv');

const User = require("./models/User.js");
const Product = require("./models/Product.js");
dotenv.config();

const port = 4000;  

app.use(express.json());
app.use(cors());

// database connection with mongoDb


mongoose.connect("mongodb+srv://choudharianuj:9765958765@cluster0.depaacn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

// api creation


app.use('/images', express.static('upload/images'));

app.get("/", (req, res)=>{
    res.send("ok")
});

//Image storage Engine

const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb)=>{
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({
    storage: storage
})


//Creating upload Endpoint for images
app.post('/upload', upload.single('product'), (req, res)=>{
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`,
        
    })
})

app.post('/addproduct', async (req,res)=>{
    let prodects = await Product.find({});
    let id;
    if(prodects.length>0){
        let last_product_array = prodects.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1 ;
    }
    else{
        id = 1;
    }
   const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
   });

   console.log(product);
   await product.save();
   console.log("saved");

   res.json({
    success: 1,
    name: req.body.name,
   })
})

//creating api for deleting product

app.post('/removeproduct', async (req, res)=>{
   await Product.findOneAndDelete({id : req.body.id});
   res.json({
        success: 1,
        name: req.body.name
   })
})



app.get('/newcollection', async (req, res)=>{
  let products = await Product.find({});
  let newcollection = products.slice(1).slice(-8);
  res.send(newcollection);
})

app.get('/popularinwomen', async (req, res)=>{
  let products = await Product.find({category : "women"});
  let popularInWomen = products.slice(0,4);
  res.send(popularInWomen);
})

//creating api for getting all products
app.get('/allproducts', async (req, res) =>{
    let products = await Product.find({});
    res.json(products);
})

//creating endpoint for registering user

app.post('/signup', async ( req, res ) => {

  try{

    let check = await User.findOne({email: req.body.email});

    if(check){
      res.status(400).json({
        success: false,
        error: "existing user found with same email address"
      })
    }

    let cart= {};
    for(let i = 0 ; i < 300; i++){
      cart[i] = 0;
    }

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      cartData: cart,
    })
  
    await user.save();

    const data = {
      user:{
        id: user._id
      }
    }

  
    const token = jwt.sign(data, 'secret_ecom')
    res.status(200).json({
      success: true,
      token
    })
  
  }
  catch(err){
    console.log(err.message)
  }
}
)

//creating endpoint for user login
app.post('/login', async (req,res) => {

  try{

     let user = await User.findOne({email: req.body.email});

    if(user){

      const passCompare = req.body.password === user.password;

      if(passCompare){

        const data = {
          user:{
            id: user._id
          }
        }

        const token = jwt.sign(data, 'secret_ecom');

        res.status(200).json({
        success: true,
        token
        })
       }
       else{
        res.status(401).json({
          success: false,
          error: "Incorrect Username or Password"
         })
       }
    }
    else{
      res.json({
        success: false,
        error: "no such user found"
      })
    }
    
  }
  catch(err){
    console.log(err.message)
  }
  
  }

)

const fetchUser = async (req,res,next) => {
  const token = req.header('auth-token');
  if(!token){
    res.status(401).send({
      success: false,
      error: "Please authenticate your self"
    })
  }else{
    try{
      const data = jwt.verify(token, 'secret_ecom' );
      req.user = data.user;
      next();
    }
    catch(err){
      res.status(401).send({
        success: false,
        error: "Please authenticate your self"

      })
    }
  }

}

app.post('/addtocart',fetchUser, async (req,res)=>{
  try{

    let userData = await User.findOne({ _id: req.user.id});

  userData.cartData[req.body.itemId] += 1;
  await User.findOneAndUpdate({_id: req.user.id},{cartData: userData.cartData});
  res.json({sucsess: true,
    message: "Added"});

  }catch(err){
    console.log(err.message)
  }
  
})

app.post('/removefromcart',fetchUser, async (req,res)=>{

  try{

    console.log(req.body)
    let userData = await User.findOne({ _id: req.user.id});
    if(userData.cartData[req.body.itemId] > 0){
      userData.cartData[req.body.itemId] -= 1;
      await User.findOneAndUpdate({_id: req.user.id},{cartData: userData.cartData});
      res.json({sucsess: true,
        message: "Removed"});
    }
  }catch(err){
    console.log(err.message)}

})

app.post('/getcart',fetchUser, async (req,res)=>{
  let userData = await User.findOne({ _id: req.user.id});
  res.json(userData.cartData);

})
app.listen(port,(err)=>{ 
    if(!err){
        console.log("server runnning on port " , port)
    }
    else{
        console.log("Error"+ err)
    }
})


