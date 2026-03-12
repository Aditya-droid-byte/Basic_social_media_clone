// const fs = require('fs');
// const path = require('path');
// const { validationResult } = require('express-validator');
// const Post = require('../models/post');
// const User = require('../models/user');
// const io = require('../socket');

// exports.getPosts = (req, res, next) => {
//   const currentPage = req.query.page || 1;
//   const perPage = 2;
//   let totalItems;
//   Post.find().countDocuments().then(count => {
//     totalItems = count;
//     return Post.find().populate('creator').skip((currentPage - 1) * perPage).limit(perPage);
//   }).then(posts => {
//     res.status(200).json({
//       message: 'Fetched posts successfully.',
//       posts: posts,
//       totalItems: totalItems
//     });
//   }).catch(err => {
//     console.log(err);
//     if (!err.statusCode) {
//       err.statusCode = 500;
//     }
//     next(err);
//   })
// };

// exports.createPost = (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {

//     const error = new Error('Validation failed, entered data is incorrect.');
//     error.statusCode = 422;
//     throw error;
//   }
//   if (!req.file) {
//     const error = new Error('No image provided.');
//     error.statusCode = 422;
//     throw error;
//   }
//   const imageUrl = req.file.path;
//   const title = req.body.title;
//   const content = req.body.content;
//   let creator;
//   // Create post in db
//   const post = new Post({
//     title: title,
//     content: content,
//     imageUrl: imageUrl,
//     creator: req.userId
//   });
//   post.save().then(result => {
//     return User.findById(req.userId);
//   }).then(user => {
//     creator = user;
//     user.posts.push(post);
//     return user.save();
//   }).then(result => {
//     io.getIO().emit('posts', { action: 'create', post: { ...post._doc, creator: { _id: creator._id, name: creator.name } } });
//     res.status(201).json({
//       message: 'Post created successfully!',
//       post: post,
//       creator: { _id: creator._id, name: creator.name }
//     });
//   }).catch(err => {
//     console.log(err);
//     if (!err.statusCode) {
//       err.statusCode = 500;
//     }
//     next(err);
//   });
// };

// exports.getPost = (req, res, next) => {
//   const postId = req.params.postId;
//   Post.findById(postId).then(post => {
//     if (!post) {
//       const error = new Error('Could not find post.');
//       error.statusCode = 404;
//       throw error;
//     }
//     res.status(200).json({ post: post });
//   }).catch(err => {
//     console.log(err);
//     if (!err.statusCode) {
//       err.statusCode = 500;
//     }
//     next(err);
//   })
// }

// exports.updatePost = async (req, res, next) => {
//   try {
//     //validation errors
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       console.log(errors.array());
//       const error = new Error('Validation failed.');
//       error.statusCode = 422;
//       error.details = errors.array();
//       return next(error);
//     }

//     //inputs
//     const { title, content } = req.body;
//     let postId = req.params.postId;

//     //fetch post
//     let post = await Post.findById(postId).populate('creator');
//     if (post.creator._id.toString() !== req.userId) {
//       const error = new Error('Not authorized to edit this post.');
//       error.statusCode = 403;
//       return next(error);
//     }
//     if (!post) {
//       let err = new Error('Could not find requested post');
//       err.statusCode = 404;
//       return next(err);
//     }

//     //check if there is a file being uploaded, to change imageUrl
//     let imageUrl;
//     if (req.file) {
//       imageUrl = req.file.path;
//     } else {
//       imageUrl = post.imageUrl;
//     }
//     //delete only if post.imageUrl is different from what we are sending (req.file.path)
//     if (post.imageUrl !== imageUrl) {
//       clearImage(post.imageUrl);
//     }

//     //update post object
//     post.title = title;
//     post.content = content;
//     post.imageUrl = imageUrl;

//     //answer
//     let updatedPost = await post.save();
//     io.getIO().emit('posts', { action: 'update', post: updatedPost });
//     res.status(200).json({ message: 'Post updated!', post: updatedPost });
//   } catch (error) {
//     if (!error.statusCode) {
//       error.statusCode = 500;
//     }
//     next(error);
//   }
// };

// exports.deletePost = async (req, res, next) => {
//   try {
//     const postId = req.params.postId;

//     const post = await Post.findById(postId);

//     if (!post) {
//       const error = new Error('Could not find post.');
//       error.statusCode = 404;
//       throw error;
//     }

//     if (post.creator.toString() !== req.userId) {
//       const error = new Error('Not authorized to delete this post.');
//       error.statusCode = 403;
//       throw error;
//     }

//     clearImage(post.imageUrl);

//     io.getIO().emit('posts', { action: 'delete', post: postId });

//     await Post.findByIdAndDelete(postId);

//     let user = await User.findById(req.userId);
//     user.posts.pull(postId);
//     await user.save();

//     res.status(200).json({ message: 'Post deleted!' });

//   } catch (err) {
//     if (!err.statusCode) {
//       err.statusCode = 500;
//     }
//     next(err);
//   }
// };

// const clearImage = filePath => {
//   filePath = path.join(__dirname, '..', filePath);
//   fs.unlink(filePath, err => console.log(err));
// }