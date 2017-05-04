import Promise from 'bluebird';
import jsdom from 'jsdom';
import AmazonHelpers from 'amazon-helpers';
import AmazonDataExtractor from './amazon-data-extractor';
import { getRandomProxy } from './proxylist';
import { NotFound } from './errors';

const UserAgents = {
    'chrome': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
    'iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B137 Safari/601.1'
};

const loadPage = ({ url, ua }) => {

    ua = UserAgents[ua]
    || ua
    || 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36';

    return new Promise((resolve, reject) => {

        return jsdom.env({
            url: url,
            userAgent: ua,
            proxy: getRandomProxy(),
            features: {
                FetchExternalResources: false,
                ProcessExternalResources: false,
                SkipExternalResources: false,
            },
            done: (err, window) => {
                if (err) {
                    return reject(err);
                }

                return resolve(window.document, window);
            }

        });

    });

};

export const getAmazonProductDetails = ({ asin, tld='de' }={}) => {

    return loadPage({
        url: `https://www.amazon.${tld}/dp/${asin}/?psc=1`,
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B137 Safari/601.1'
    })
    .then((document) => {

        const details = (new AmazonDataExtractor(document)).getData();

        if (!details) {
            throw new NotFound();
        }

        return {
            asin, tld, datetime: new Date(), details
        };

    });

};

export const getAmazonProductImages = ({ asin, tld='de' }={}) => {

    return loadPage({
        url: `https://www.amazon.${tld}/dp/${asin}/?psc=1`,
        // ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B137 Safari/601.1'
        ua: 'iphone'
    })
    .then((document) => {

        const items = (new AmazonDataExtractor(document)).getImages();

        if (!items) {
            throw new NotFound();
        }

        return {
            asin, tld, datetime: new Date(), items
        };

    });

};

export const getAmazonCategoryList = ({ tld='de' }={}) => {

    return loadPage({
        url: `https://www.amazon.${tld}/gp/site-directory/`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
    })
    .then((document) => {

        const { location } = document;

        const categories = [];

        Array.from(document.querySelectorAll('.popover-grouping')).forEach((category) => {

            const title = category.querySelector('h2').textContent.trim();

            const items = Array.from(category.querySelectorAll('.nav_cat_links li')).map((item) => {
                return {
                    name: item.textContent.trim(),
                    url: `${location.protocol}//${location.host}/${item.querySelector('a').getAttribute('href').replace(/^\//,'')}`
                };
            });

            categories.push({
                title, items
            });

        });

        return {
            tld,
            datetime: new Date(),
            items: categories
        };

    });

};

export const getProductsFromAmazonBestsellersPage = (url) => {
    loadPage(url)
    .then((document) => {
        const { location } = document;
        return Array.from(document.querySelectorAll('.zg_itemWrapper > div > .a-link-normal'))
        .map((link) => {
            const productUrl = `${location.protocol}//${location.hostname}${link.getAttribute('href')}`;
            return AmazonHelpers.getIdentByUrl(productUrl);
        });
    });
};

export default {
    getAmazonProductDetails,
    getAmazonProductImages,
    getAmazonCategoryList,
};
