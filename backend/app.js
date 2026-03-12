const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const isAuth = require('./middleware/is-auth');

const mongoose = require('mongoose');
const app = express();
const {graphqlHTTP} = require('express-graphql');
const graphqlResolver = require('./graphql/resolver');
const graphqlSchema = require('./graphql/schema');

const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.use(bodyParser.json());
app.use(multer({ storage: diskStorage, fileFilter: fileFilter }).single('image'));

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if(req.method === 'OPTIONS'){
        return res.sendStatus(200);
    }
    next();
});

app.use(isAuth);


app.put('/post-image', isAuth, (req, res, next) => {
    if (!req.isAuth) {
        const error = new Error('Not authenticated!');
        error.code = 401;
        throw error;
    }
    if (!req.file) {
        return res.status(200).json({ message: 'No file provided!' });
    }
    if(req.body.oldPath){
        clearImage(req.body.oldPath);
    }
    return res.status(201).json({ message: 'File stored.', filePath: req.file.path });
});

app.use(isAuth);

app.use('/graphql', graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    formatError(err){
        if(!err.originalError){
            return err;
        }
        const status = err.originalError.code || 500;
        const message = err.message || 'An error occurred.';
        const data = err.originalError.data;
        return { message: message, status: status, data: data };
    }
}))



app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
});


mongoose.connect('mongodb+srv://srivastavaadi247:DiBmVvAYVL5k8aYx@cluster0.vj62rgt.mongodb.net/messages?retryWrites=true&w=majority&appName=Cluster0').
    then(result => {
        console.log('Connected to MongoDB');
        app.listen(8080);
    }).catch(err => {
        console.log('Failed to connect to MongoDB', err);
    });


const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
}
