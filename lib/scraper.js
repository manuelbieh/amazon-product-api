import jsdom from 'jsdom';
import AmazonDataExtractor from './amazon-data-extractor';

const UserAgents = {
    'chrome': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
    'iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B137 Safari/601.1'
};

const loadPage = ({ url, ua }) => {

    console.log('LOADING', url);

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

export const getAmazonBestsellersCategories = ({ tld='de' }={}) => {

    const categories = [];

    return loadPage({ url: `https://www.amazon.${tld}/gp/bestsellers`})
    .then((document) => {

        Array.from(document.querySelector('#zg_browseRoot').querySelectorAll('ul li a')).forEach((link) => {

            const url = link.getAttribute('href').replace(/\/ref=([\d\w]*)/,'');
            const name = url.replace(/\/ref=([\d\w]*)/,'').match(/bestsellers\/([\d\w-]*)/)[1];
            const title = link.textContent.trim();

            categories.push({
                url, name, title
            });

        });

        return categories;

    });

};

export const getAmazonBestsellersSubcategories = ({ parent, tld='de' }={}) => {

    const categories = [];

    return loadPage({ url: `https://www.amazon.${tld}/gp/bestsellers/${parent}`})
    .then((document) => {

        // Array.from(document.querySelector('#zg_browseRoot').querySelectorAll('ul li:not(.zg_browseUp) a')).forEach((link) => {
        Array.from(document.querySelector('#zg_browseRoot').querySelectorAll('ul li:not(:only-of-type) a')).forEach((link) => {

            const url = link.getAttribute('href').replace(/\/ref=([\d\w]*)/,'');
            const id = url.replace(/\/ref=([\d\w]*)/,'').match(/bestsellers\/([\d\w-]*)\/([0-9]*)/)[2];
            const title = link.textContent.trim();
            const checkForChildren = !!document.querySelector('#zg_browseRoot').querySelector('.zg_selected').parentNode.parentNode.querySelector('ul');

            categories.push({
                url, id, title, parent, checkForChildren
            });

        });

        return categories;

    });

};

export const getAmazonBestsellersSubcategoriesBySubcategory = ({ parent, id, tld='de' }={}) => {

    const categories = [];

    return loadPage({
        url: `https://www.amazon.${tld}/gp/bestsellers/${parent}/${id}`
    })
    .then((document) => {

        const queryRoot = document.querySelector('#zg_browseRoot');

        if (!queryRoot) {
            return [];
        }

        // Array.from(queryRoot.querySelectorAll('ul li:not(.zg_browseUp) a')).forEach((link) => {
        Array.from(queryRoot.querySelectorAll('ul li:not(:only-of-type) a')).forEach((link) => {

            const url = link.getAttribute('href').replace(/\/ref=([\d\w]*)/,'');
            // const name = url.replace(/\/ref=([\d\w]*)/,'').match(/bestsellers\/([\d\w-]*)/)[1];
            const id = url.replace(/\/ref=([\d\w]*)/,'').match(/bestsellers\/([\d\w-]*)\/([0-9]*)/)[2];
            const title = link.textContent.trim();
            const checkForChildren = !!document.querySelector('#zg_browseRoot').querySelector('.zg_selected').parentNode.parentNode.querySelector('ul');

            categories.push({
                url, id, parent, title, checkForChildren
            });

        });

        return categories;

    });

};


export const getAmazonBestsellerUrls = () => {

    const urls = [];

    return new Promise((resolve) => {

        return getAmazonBestsellersCategories()
        .then((categories) => {

            return Promise.all(categories.map((category) => {

                urls.push(category.url);
                return getAmazonBestsellersSubcategories({
                    parent: category.name
                });

            }));

        })
        .then((subCategoriesOfMain) => {

            return Promise.all(subCategoriesOfMain.map((subCategoryArrayOfMain) => {

                return Promise.all(subCategoryArrayOfMain.map((subCategory) => {

                    urls.push(subCategory.url);

                    if (!subCategory.checkForChildren) {
                        return;
                    }

                    return getAmazonBestsellersSubcategoriesBySubcategory({
                        parent: subCategory.parent,
                        id: subCategory.id
                    });

                }).filter((item) => typeof item !== 'undefined'));

            }).filter((item) => typeof item !== 'undefined'));

        })
        .then((subCategoriesOfSubCategories) => {

            return Promise.all(subCategoriesOfSubCategories.map((subCategoryArraySubCategories) => {

                return Promise.all(subCategoryArraySubCategories.map((subSubCategoryItems) => {

                    return Promise.all(subSubCategoryItems.map((subSubCategory) => {

                        urls.push(subSubCategory.url);

                        if (!subSubCategory.checkForChildren) {
                            return;
                        }

                        return getAmazonBestsellersSubcategoriesBySubcategory({
                            parent: subSubCategory.parent,
                            id: subSubCategory.id
                        });

                    }).filter((item) => typeof item !== 'undefined'));

                }).filter((item) => typeof item !== 'undefined'));

            }).filter((item) => typeof item !== 'undefined'));

        })
        .then((subCategoriesOfSubCategories) => {

            return Promise.all(subCategoriesOfSubCategories.map((subCategoryArraySubCategories) => {

                return Promise.all(subCategoryArraySubCategories.map((subSubCategoryItems) => {

                    return Promise.all(subSubCategoryItems.map((subSubCategoryArray) => {

                        return subSubCategoryArray.map((subSubCategory) => {

                            return urls.push(subSubCategory.url);

                        });

                    }));

                }));

            }));

        })
        .then(() => {

            require('fs').writeFileSync('urls.json', JSON.stringify(urls, null, 2), {
                encoding: 'utf-8'
            });

            return resolve(urls);

        });

    });

};

export default {
    getAmazonProductDetails,
    getAmazonProductImages,
    getAmazonCategoryList,
    getAmazonBestsellersCategories,
    getAmazonBestsellersSubcategories,
    getAmazonBestsellersSubcategoriesBySubcategory
};
