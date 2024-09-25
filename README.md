# 👾 RosterExpress 

**Because hosting multiple HTTPS Express sites has never been easier!**

Welcome to **RosterExpress**, the ultimate domain host router for Express. Why juggle multiple servers when you can have one server to rule them all? 😉

## ✨ Features

- **Automatic HTTPS** with Let's Encrypt via Greenlock.
- **Dynamic Site Loading**: Just drop your Express apps in the `www` folder.
- **Virtual Hosting**: Serve multiple domains from a single server.
- **Automatic Redirects**: Redirect `www` subdomains to the root domain.
- **Zero Configuration**: Well, almost zero. Just a tiny bit of setup.

## 📦 Installation

```bash
npm install roster-express
```

## 🛠️ Usage

### Directory Structure

Your project should look something like this:

```
/srv/
├── roster/server.js
└── www/
    ├── example.com/
    │   └── index.js
    └── anotherdomain.com/
        └── index.js
```

### Setting Up Your Server

```javascript
// /srv/roster/server.js
const Roster = require('roster-express');

const options = {
    maintainerEmail: 'admin@example.com',
    wwwPath: '/srv/www', // Path to your 'www' directory (default: '../www')
    staging: false // Set to true for Let's Encrypt staging environment
};

const server = new Roster(options);
server.start();
```

### Your Express Apps

Each domain should have its own folder under `www`, containing an `index.js` that exports an Express app.

For example, `www/example.com/index.js`:

```javascript
// /srv/www/example.com/index.js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello from example.com!');
});

module.exports = app;
```

### Running the Server

```bash
# /srv/roster/server.js
node server.js
```

And that's it! Your server is now hosting multiple HTTPS-enabled sites. 🎉

## 🤯 But Wait, There's More!

### Automatic SSL Certificate Management

RosterExpress uses [greenlock-express](https://www.npmjs.com/package/greenlock-express) to automatically obtain and renew SSL certificates from Let's Encrypt. No need to manually manage certificates ever again. Unless you enjoy that sort of thing. 🧐

### Redirects from `www`

All requests to `www.yourdomain.com` are automatically redirected to `yourdomain.com`. Because who needs the extra three characters? 😏

### Dynamic Site Loading

Add a new site? Just drop it into the `www` folder with an `index.js` file, and RosterExpress will handle the rest. No need to restart the server. Well, you might need to restart the server. But that's what `nodemon` is for, right? 😅

## ⚙️ Configuration Options 

When creating a new `RosterExpress` instance, you can pass the following options:

- `maintainerEmail` (string): Your email for Let's Encrypt notifications.
- `wwwPath` (string): Path to your `www` directory containing your sites.
- `greenlockConfigDir` (string): Directory for Greenlock configuration.
- `staging` (boolean): Set to `true` to use Let's Encrypt's staging environment (for testing).

## 🧂 A Touch of Magic

You might be thinking, "But setting up HTTPS and virtual hosts is supposed to be complicated and time-consuming!" Well, not anymore. With RosterExpress, you can get back to writing code that matters, like defending Earth from alien invaders! 👾👾👾


## 🤝 Contributing

Feel free to submit issues or pull requests. Or don't. I'm not your boss. 😜

If you find any issues or have suggestions for improvement, please open an issue or submit a pull request on the [GitHub repository](https://github.com/clasen/RosterExpress).

## 🙏 Acknowledgments 

- [Express](https://expressjs.com/) - Fast, unopinionated, minimalist web framework for Node.js
- [Greenlock](https://git.coolaj86.com/coolaj86/greenlock.js) - Fully-featured ACME client and express.js middleware

## 📄 License

The MIT License (MIT)

Copyright (c) Martin Clasen

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

Happy hosting! 🎈