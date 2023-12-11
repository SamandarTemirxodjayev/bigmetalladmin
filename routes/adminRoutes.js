const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Blog = require("../models/Blog");
const Product = require("../models/Product");

const authenticateUser = (username, password) => {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  return username === adminUsername && password === adminPassword;
};

const isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  return res.redirect("/login");
};

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (authenticateUser(username, password)) {
    req.session.isAuthenticated = true;
    return res.redirect("/dashboard");
  } else {
    return res.render("login", { error: "Invalid username or password" });
  }
});

router.get("/login", (req, res) => {
  return res.render("login", { error: null });
});

router.get("/logout", isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    return res.redirect("/login");
  });
});

router.get("/dashboard", (req, res) => {
  if (!req.session.isAuthenticated) {
    return res.redirect("/login");
  }
  return res.render("adminDashboard");
});

// blogs system routes
router.get("/blogs", isAuthenticated, async (req, res) => {
  try {
    const blogs = await Blog.find();
    return res.render("adminBlogs", { blogs });
  } catch (error) {
    return res.status(500).send("Internal Server Error");
  }
});

// Set up multer storage for updates
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post("/blogs/create", upload.single("newPhoto"), isAuthenticated,async (req, res) => {
  try {
    // Check if req.file is defined
    if (!req.file) {
      return res.status(400).send("No file attached to the request");
    }

    const photoPath = req.file.path;
    const { newTitle, newDescription } = req.body;

    // Validate if newTitle and newDescription are present
    if (!newTitle || !newDescription) {
      return res.status(400).send("Title and description are required");
    }

    const newBlog = new Blog({
      title: newTitle,
      description: newDescription,
      photo: photoPath,
    });

    await newBlog.save();
    return res.redirect("/blogs"); // Assuming adminBlogs.ejs exists
  } catch (error) {
    return res.status(500).render("error", { error: "Internal Server Error" });
  }
});

// Update route with file upload middleware
router.post(
  "/blogs/update/:blogId",
  isAuthenticated,
  upload.single("updatedPhoto"),
  async (req, res) => {
    try {
      const blogId = req.params.blogId;
      const { updatedTitle, updatedDescription } = req.body;
      const updatedPhoto = req.file ? req.file.path : ""; // Use the updated file path if provided

      const blog = await Blog.findById(blogId);

      if (!blog) {
        return res.status(404).send("Blog not found");
      }

      blog.title = updatedTitle;
      blog.description = updatedDescription;

      // Check if updatedPhoto is not an empty string before updating blog.photo
      if (updatedPhoto) {
        blog.photo = updatedPhoto;
      }

      await blog.save();
      return res.redirect("/blogs"); // Redirect to the blogs page after update
    } catch (error) {
      return res
        .status(500)
        .render("error", { error: "Internal Server Error" });
    }
  }
);

router.get("/blogs/delete/:blogId", isAuthenticated, async (req, res) => {
  try {
    const blogId = req.params.blogId;
    const deletedBlog = await Blog.findByIdAndDelete(blogId);
    if (!deletedBlog) {
      return res.status(404).send("Blog not found");
    }
    return res.redirect("/blogs");
  } catch (error) {
    return res.status(500).send("Internal Server Error: " + error.message);
  }
});

// Route to render the adminProducts view
router.get("/products",isAuthenticated, async (req, res) => {
  try {
    const products = await Product.find();
    return res.render("adminProducts", { products });
  } catch (error) {
    return res
      .status(500)
      .render("error", {
        error: "Internal Server Error",
        details: error.message,
      });
  }
});

router.get('/products/:productId',isAuthenticated, async (req, res) => {
  try {
      const productId = req.params.productId;
      const product = await Product.findById(productId);

      if (!product) {
          return res.status(404).send({ message: 'Product not found' });
      }

      return res.json(product);
  } catch (error) {
      return res.status(500).send({ message: 'Internal Server Error', error: error.message });
  }
});


router.post("/products/create",isAuthenticated, async (req, res) => {
  try {
    const { category, name, model, length, price } = req.body;

    // Validate if required fields are present
    if (!category || !name || !model || !length || !price) {
      return res.status(400).send("All fields are required");
    }

    const newProduct = new Product({
      category,
      name,
      model,
      length,
      price,
    });

    await newProduct.save();

    return res.redirect("/products"); // Assuming adminProducts.ejs exists
  } catch (error) {
    return res.status(500).render("error", { error: "Internal Server Error" });
  }
});

router.post(
  "/products/update/:productId",
  isAuthenticated,
  async (req, res) => {
    try {
      const productId = req.params.productId;
      const {
        updatedCategory,
        updatedName,
        updatedModel,
        updatedLength,
        updatedPrice,
      } = req.body;

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).send("Product not found");
      }

      product.category = updatedCategory;
      product.name = updatedName;
      product.model = updatedModel;
      product.length = updatedLength;
      product.price = updatedPrice;

      await product.save();
      return res.redirect("/products"); // Redirect to the products page after update
    } catch (error) {
      return res
        .status(500)
        .render("error", { error: "Internal Server Error" });
    }
  }
);

router.delete("/products/delete/:productId", isAuthenticated, async (req, res) => {
  try {
    const productId = req.params.productId;
    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res.status(404).send("Product not found");
    }
    return res.redirect("/products");
  } catch (error) {
    return res.status(500).send("Internal Server Error: " + error.message);
  }
});

module.exports = router;