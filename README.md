# amazon-product-api

Setup a local API server for Amazon products which uses jsdom to scrape and extract product details.

(Attention: this might be against Amazon's ToS. Use it at your own risk!)

```
npm install
npm start
```

The webserver will listen on port 9190 by default.
```
http://localhost:9190
```

Routes:
```
/products/:asin
/products/:asin/images
```

Default tld for all requests is `.de`. Add `?tld=com`, `?tld=co.uk`, ... to request products from other shops than `.de`.
