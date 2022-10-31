# web_crawler

Web-Crawler based in Node JS and Mongo DB.

- It will take a URL as an input and fetch all the anchor tags, headings, and paragraphs.
- Whenever a new web page is crawled, it will display that in a table.

You can crawl as many pages as you want.

## Installation:

- express (framework is used for routing);
- http (is used to run HTTP requests);
- ejs (is a template engine used for rendering HTML files);
- socket.io (is used for realtime communication);
- request (is used to fetch content of web page);
- cheerio (is used for jQuery DOM manipulation);
- express-formidable (to get values from FormData object);
- mongodb (will be our database);
- htmlspecialchars (is used to convert HTML tags into entities);
- node-html-parser (to convert the HTML string into DOM nodes).

After all the modules are installed, run the server.

## Usage:

The crawler page contains with a simple form including an input field and a "Crawl" button. In that input field, you can enter the URL of the page you wanted to crawl.
The DataTable library is using for showing data.
Along with all the crawled data on the web page, it will also show 2 buttons to “Delete” and to “Re-index”. "Delete" simply means to delete the page from the database. “Reindex” means to re-crawl the web page to fetch updated content.

## ScreenShots:

![1](/public/images/1.png)
![2](/public/images/2.png)
![3](/public/images/3.png)
![4](/public/images/4.png)
![5](/public/images/5.png)
![6](/public/images/6.png)
![7](/public/images/7.png)
