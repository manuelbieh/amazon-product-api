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

    return scraper.getAmazonProductDetails({
        asin: req.params.asin,
        tld: req.query.tld
    })
    .then((data) => {
        return res.json(data);
    })
    .catch(next);

});

router.get('/products/:asin/images', (req, res, next) => {

    return scraper.getAmazonProductImages({
        asin: req.params.asin,
        tld: req.query.tld
    })
    .then((data) => {
        return res.json(data);
    })
    .catch(next);

});

router.get('/bestsellers/list', (req, res, next) => {

    return scraper.getAmazonBestsellersCategories({
        tld: req.query.tld
    })
    .then((data) => {
        return res.json(data);
    })
    .catch(next);

});

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
