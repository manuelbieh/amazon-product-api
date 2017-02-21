import Promise from 'bluebird';
import jsdom from 'jsdom';
import AmazonHelpers from 'amazon-helpers';
import AmazonDataExtractor from './amazon-data-extractor';

const UserAgents = {
    'chrome': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
    'iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B137 Safari/601.1'
};

const loadPage = ({ url, ua }) => {

    ua = ua
    || UserAgents[ua]
    || 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36';

    return new Promise((resolve, reject) => {

        return jsdom.env({
            url: url,
            userAgent: ua,
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

    return new Promise((resolve, reject) => {

        return jsdom.env({
            url: `https://www.amazon.${tld}/dp/${asin}/?psc=1`,
            features: {
                FetchExternalResources: false,
                ProcessExternalResources: false,
                SkipExternalResources: false,
            },
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B137 Safari/601.1',
            done: (err, window) => {

                if (err) {
                    return reject({
                        message: 'Error'
                    });
                }

                const { document } = window;

                const details = (new AmazonDataExtractor(document)).getData();

                if (!details) {
                    return reject({
                        message: 'Not found',
                        status: 404
                    });
                }

                return resolve({
                    asin, tld, details
                });

            }

        });

    });

};

export const getAmazonProductImages = ({ asin, tld='de' }={}) => {

    return new Promise((resolve, reject) => {

        return jsdom.env({
            url: `https://www.amazon.${tld}/dp/${asin}/?psc=1`,
            features: {
                FetchExternalResources: false,
                ProcessExternalResources: false,
                SkipExternalResources: false,
            },
            userAgent: '"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36"',
            done: (err, window) => {

                if (err) {
                    return reject({
                        message: 'Error'
                    });
                }

                const { document } = window;

                const items = (new AmazonDataExtractor(document)).getImages();

                if (!items) {
                    return reject({
                        status: 404
                    });
                }

                return resolve({
                    asin, tld, items
                });

            }

        });

    });

};

export const getAmazonCategoryList = ({ tld='de' }={}) => {

    return new Promise((resolve, reject) => {

        return jsdom.env({
            url: `https://www.amazon.${tld}/gp/site-directory/ref=nav_shopall_btn`,
            features: {
                FetchExternalResources: false,
                ProcessExternalResources: false,
                SkipExternalResources: false,
            },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
            done: (err, window) => {

                if (err) {
                    return reject({
                        message: 'Error'
                    });
                }

                const { document } = window;
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

                return resolve({
                    tld,
                    items: categories
                });

            }

        });

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

// getProductsFromAmazonBestsellersPage('https://www.amazon.de/gp/bestsellers/computers/5076258031/')
// .then((products) => {
//
// })

export default {
    getAmazonProductDetails,
    getAmazonProductImages,
    getAmazonCategoryList,
};
