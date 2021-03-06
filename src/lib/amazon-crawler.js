import Promise from 'bluebird';
import jsdom from 'jsdom';

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

        const queryRoot = document.querySelector('#zg_browseRoot');
        if (!queryRoot) {
            return [];
        }

        // Array.from(document.querySelector('#zg_browseRoot').querySelectorAll('ul li:not(.zg_browseUp) a')).forEach((link) => {
        Array.from(queryRoot.querySelectorAll('ul li:not(:only-of-type) a')).forEach((link) => {

            const url = link.getAttribute('href').replace(/\/ref=([\d\w]*)/,'');
            const id = url.replace(/\/ref=([\d\w]*)/,'').match(/bestsellers\/([\d\w-]*)\/([0-9]*)/)[2];
            const title = link.textContent.trim();
            const checkForChildren = !!document.querySelector('#zg_browseRoot').querySelector('.zg_selected').parentNode.parentNode.querySelector('ul');

            categories.push({
                url, id, title, parent, checkForChildren
            });

        });

        return categories;

    })
    .catch((err) => {
        console.log('COULD NOT LOAD', `https://www.amazon.${tld}/gp/bestsellers/${parent}`);
        console.log('ERR', err);
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

    })
    .catch((err) => {
        console.log('COULD NOT LOAD', `https://www.amazon.${tld}/gp/bestsellers/${parent}/${id}`);
        console.log('ERR', err);
    });

};
