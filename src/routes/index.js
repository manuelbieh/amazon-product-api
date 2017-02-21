import fs from 'fs-promise';
import { Router } from 'express';
import scraper from '../lib/scraper';

const router = new Router();

router.get('/', (req, res) => {
    return res.json({
        message: 'all your base are belong to us',
        status: 200,
    });
});

router.get('/products/:asin', (req, res, next) => {

    const maxCacheAgeInSeconds = 60;
    const cacheFilePath = `${__dirname}/../cache/${req.params.asin}.json`;

    return fs.stat(cacheFilePath)
    .catch(() => {})
    .then((cacheFile) => {

        // if cachefile exists and is not outdated, use data from there
        if (cacheFile && ((new Date() - cacheFile.mtime)/1000) < maxCacheAgeInSeconds) {
            return fs.readFile(cacheFilePath, {
                encoding: 'utf-8'
            })
            .then((data) => {
                return JSON.parse(data);
            });
        }

        // cachefile does not exist or is invalidated
        return scraper.getAmazonProductDetails({
            asin: req.params.asin,
            tld: req.query.tld
        })
        .then((data) => {
            // write new data to cachefile
            return fs.writeFile(cacheFilePath, JSON.stringify(data))
            .catch(() => {})
            .then(() => {
                return data;
            });

        });

    })
    // something was wrong here. send error down to the next error handler
    .catch(next)
    .then((data) => {
        return res.json(data);
    });

});

router.get('/products/:asin/images', (req, res, next) => {

    const maxCacheAgeInSeconds = 600;
    const cacheFilePath = `${__dirname}/../cache/${req.params.asin}-images.json`;

    return fs.stat(cacheFilePath)
    .catch(() => {})
    .then((cacheFile) => {

        // if cachefile exists and is not outdated, use data from there
        if (cacheFile && ((new Date() - cacheFile.mtime)/1000) < maxCacheAgeInSeconds) {
            return fs.readFile(cacheFilePath, {
                encoding: 'utf-8'
            })
            .then((data) => {
                return JSON.parse(data);
            });
        }

        // cachefile does not exist or is invalidated
        return scraper.getAmazonProductImages({
            asin: req.params.asin,
            tld: req.query.tld
        })
        .then((data) => {
            // write new data to cachefile
            return fs.writeFile(cacheFilePath, JSON.stringify(data))
            .catch(() => {})
            .then(() => {
                return data;
            });

        });

    })
    // something was wrong here. send error down to the next error handler
    .catch(next)
    .then((data) => {
        return res.json(data);
    });

});

//router.get('/bestsellers/list', (req, res, next) => {

//    return scraper.getAmazonBestsellersCategories({
//        tld: req.query.tld
//    })
//    .then((data) => {
//        return res.json(data);
//    })
//    .catch(next);

//});

router.get('/categories', (req, res, next) => {

    return scraper.getAmazonCategoryList({
        tld: req.query.tld
    })
    .then((data) => {
        return res.json(data);
    })
    .catch(next);

});

export default router;
