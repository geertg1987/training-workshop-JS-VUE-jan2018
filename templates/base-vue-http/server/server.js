const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const sortOn = require('sort-on');

const seed = require('./seed');
let products = require('./products');

// app setup
const app = express();
app.use(morgan('dev'));
app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

//
// setup sample data
//
let users = [
  { id: 1, firstName: 'john', latName: 'bar', email: 'john.bar@noreply.com' },
  { id: 2, firstName: 'jane', latName: 'zoe', email: 'jane.zoer@noreply.com' },
];
let tasks = [
  { id: 1, desc: 'Drink coffee', completed: true },
  { id: 2, desc: 'Write code', completed: false },
  { id: 3, desc: 'Document work', completed: false },
];
const numberOfUsersToCreate = 10;
users = seed.generateUsers(numberOfUsersToCreate);
let basket = [{ id: 46, quantity: 1 }, { id: 44, quantity: 4 }];

// ===============================================================
// tasks
// ===============================================================

app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});
app.get('/api/tasks/:id', (req, res) => {
  // find user
  const task = tasks.find(item => item.id === +req.params.id);
  if (!task) {
    return res.status(404).json({ code: 'NotFound', message: 'Task not found' });
  }

  // return resource
  return res.json(task);
});

/* POST /api/tasks
   {
     "completed": true
   }
  */
app.post('/api/tasks', (req, res) => {
  // Get resource
  const resource = req.body;
  resource.id = new Date().valueOf();
  resource.completed = false;
  tasks.push(resource);
  res.status(200).json(resource);
});

/* PATCH /api/tasks/12
   {
     "completed": true
   }
  */
app.patch('/api/tasks/:id', (req, res) => {
  // Get resource
  const resource = req.body;
  const task = tasks.find(item => item.id === +req.params.id);
  if (!task) {
    return res.status(404).json({ code: 'NotFound', message: 'Task not found' });
  }

  task.completed = resource.completed;
  return res.status(200).json(task);
});

// DELETE /api/tasks/12
app.delete('/api/tasks/:id', (req, res) => {
  const task = tasks.find(item => item.id === +req.params.id);
  if (!task) {
    return res.status(204);
  }

  tasks = tasks.filter(item => item.id !== task.id);
  return res.status(200).json(task);
});

// ===============================================================
// users
// ===============================================================

// GET /api/users
// GET /api/users?page=0&pageSize=10
app.get('/api/users', (req, res) => {
  console.log('GET ALL', req.query.page, req.query.pageSize);
  const page = +req.query.page || 0;
  const pageSize = +req.query.pageSize || 10;
  const begin = page * pageSize;
  const end = page * pageSize + pageSize;

  const userSet = users.slice(begin, end);
  // return all resource
  res.json({
    total: userSet.length,
    users: userSet,
  });
});

// GET /api/users/12
app.get('/api/users/:id', (req, res) => {
  // find user
  const id = +req.params.id;
  console.log('GET SINGLE', id);

  const user = users.find(item => item.id === id);
  if (!user) {
    return res.status(404).json('not found');
  }

  // return resource
  return res.json(user);
});

/* POST /api/users
{
  "firstName": "peter",
  "lastName": "cosemans",
  "age": 52,
  "email": "peter.cosemans@gmail.com",
  "role": "admin"
}
*/
app.post('/api/users', (req, res) => {
  // Get resource
  const resource = req.body;
  console.log('post', req.body);

  // Assign number
  resource.id = new Date().valueOf();

  // Add to users's
  users.push(resource);

  // return resource
  res.status(200).send(resource);
});

/* PUT /api/users/12
{
  "firstName": "peter",
  "lastName": "cosemans",
  "age": 52,
  "email": "peter.cosemans@gmail.com",
  "role": "admin"
}
*/
app.put('/api/users/:id', (req, res) => {
  // Get resource
  const resource = req.body;
  console.log('put', req.body);

  // Find and update
  const id = +req.params.id;
  const user = users.find(item => item.id === id);
  if (!user) return res.send(404, 'not found');

  user.firstName = resource.firstName;
  user.lastName = resource.lastName;
  user.email = resource.email;
  user.age = Number(resource.age);
  user.company = resource.company;

  return res.status(200).send(user);
});

// DELETE /api/users/12
app.delete('/api/users/:id', (req, res) => {
  const id = +req.params.id;
  const user = users.find(item => item.id === id);
  if (!user) {
    return res.status(204).json();
  }

  users = users.filter(item => item.id !== id);
  return res.status(200).send(user);
});

// ===============================================================
// Products
// ===============================================================

// returning products
// GET /api/products
// GET /api/products?page=0&pageSize=10
// GET /api/products?sort=price
// GET /api/products?sort=-price
app.get('/api/products', (req, res) => {
  const page = Number(req.query.page) || 0;
  const pageSize = Number(req.query.pageSize) || 20;
  const sortExpression = req.query.sort;

  // sort
  console.log(sortExpression);
  let selectedProducts = products;
  if (sortExpression) {
    selectedProducts = sortOn(selectedProducts, sortExpression);
  }

  // skip and take
  console.log(selectedProducts);
  selectedProducts = selectedProducts.slice(page * pageSize, page * pageSize + pageSize);

  res.json({ total: products.length, page, pageSize, selectedProducts });
});

// get single product by id
// GET /api/products/1
app.get('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = products.find(item => item.id === id);
  if (!product) return res.status(404).json({ code: 'NotFound', message: 'Product not found' });
  return res.json(product);
});

/* POST /api/products
   {
      "title": "my new product",
      "price": 9.99,
      "stocked": true,
      "desc": "just some text",
      "image": "https://dummyimage.com/300x300.jpg"
   }
*/
app.post('/api/products', (req, res) => {
  // Get resource
  const resource = req.body;
  if (!resource.title || !resource.price) {
    res.status(400).json({ code: 'BadRequest', message: 'Missing title and/or price' });
    return;
  }
  // Assign number
  resource.id = new Date().valueOf();

  // Add dummy image when not provided
  if (!resource.image) {
    resource.image = 'https://dummyimage.com/300x300.jpg';
  }

  // Add to users's
  products.push(resource);

  // return resource
  res.status(200).json(resource);
});

/* PUT /api/products/12
  {
    "title": "my new product",
    "price": 9.99,
    "stocked": true,
    "desc": "just some text",
    "image": "https://dummyimage.com/300x300.jpg"
  }
*/
app.put('/api/products/:id', (req, res) => {
  // Get resource
  const resource = req.body;
  console.log('put', req.body);

  // Find and update
  const product = products.find(item => item.id === Number(req.params.id));
  if (!product) {
    return res.json(404, { code: 'NotFound', message: 'Product not found' });
  }

  product.sku = resource.sku;
  product.title = resource.title;
  product.price = resource.price;
  product.basePrice = resource.basePrice;
  product.stocked = resource.stocked;
  product.desc = resource.desc;
  product.image = resource.image;

  return res.status(200).json(product);
});

// DELETE /api/products/1
app.delete('/api/products/:id', (req, res) => {
  const product = products.find(item => item.id === Number(req.params.id));
  if (!product) {
    return res.status(204);
  }

  products = products.filter(item => item.id !== product.id);
  return res.status(200).json(product);
});

// ===============================================================
// basket
// ===============================================================

// get basket for session
// GET /api/basket
app.get('/api/basket', (req, res) => {
  if (basket.length > 4)
    return res.status(500).json({
      code: 'InteralServerError',
      message: 'Oops, something went wrong',
    });
  res.json(basket);
});

// add product to basket
// POST /api/basket/product/1
// {
//    quantity: 10
// }
app.post('/api/basket/product/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = products.find(item => item.id === id);
  if (!product) return res.status(404).json({ code: 'NotFound', message: 'Product not found' });
  if (!product.stocked) return res.status(409).json({ code: 'Conflict', message: 'Product not in stock' });
  let quantity = Math.floor(Number(req.body.quantity) || 1);
  const index = basket.findIndex(item => item.id === id);
  if (index < 0) basket.push({ id, quantity });
  if (index >= 0) {
    quantity = (basket[index].quantity || 0) + quantity;
    basket[index].quantity = quantity;
  }
  res.status(201).json(basket);
});

// remove product from basket
// DELETE /api/basket/product/46
app.delete('/api/basket/product/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = basket.findIndex(item => item.id === id);
  const product = products.find(item => item.id === id);
  if (!product || index === -1) return res.status(404).json({ code: 'NotFound', message: 'Product not found' });
  basket.splice(index, 1);
  res.json(basket);
});

// patch quantity of products in basket
// PATH /api/basket/product/46
// {
//    quantity: 10
// }
app.patch('/api/basket/product/:id', (req, res) => {
  const id = Number(req.params.id);
  const quantity = Math.floor(Number(req.body.quantity)) || 0;
  const index = basket.findIndex(item => item.id === id);
  const product = products.find(item => item.id === id);
  if (!product) return res.status(404).json({ code: 'NotFound', message: 'Product not found' });
  if (!product.stocked) return res.status(409).json({ code: 'Conflict', message: 'Product not in stock' });

  if (index >= 0 && quantity) basket[index].quantity = quantity;
  if (index === -1 && quantity) basket.push({ id, quantity });
  if (quantity === 0) basket.splice(index, 1);

  return res.json(basket);
});

// delete basket
// DELETE /api/basket
app.delete('/api/basket', (req, res) => {
  const previosBasket = basket;
  basket = [];
  res.json(previosBasket);
});

app.all('/api/*', (req, res) =>
  res.status(404).json({
    code: 'NotFound',
    message: 'Resource not found or method not supprted',
  })
);

//
// listen for requests
//
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Express server listening on port: http://localhost:${server.address().port}`);
});
