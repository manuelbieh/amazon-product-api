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

// export const getAmazonBestsellerUrls = () => {
//
//     const urls = [];
//
//     return new Promise((resolve) => {
//
//         return getAmazonBestsellersCategories()
//         .then((categories) => {
//
//             return Promise.all(categories.map((category) => {
//
//                 urls.push(category.url);
//                 return getAmazonBestsellersSubcategories({
//                     parent: category.name
//                 });
//
//             }));
//
//         })
//         .catch((err) => {
//             console.log('ERR 1:', err);
//         })
//         .then((subCategoriesOfMain) => {
//
//             return Promise.all(subCategoriesOfMain.map((subCategoryArrayOfMain) => {
//
//                 return Promise.delay(500).all(subCategoryArrayOfMain.map((subCategory) => {
//
//                     urls.push(subCategory.url);
//
//                     if (!subCategory.checkForChildren) {
//                         return;
//                     }
//
//                     return getAmazonBestsellersSubcategoriesBySubcategory({
//                         parent: subCategory.parent,
//                         id: subCategory.id
//                     });
//
//                 }).filter((item) => typeof item !== 'undefined'));
//
//             }).filter((item) => typeof item !== 'undefined'));
//
//         })
//         .catch((err) => {
//             console.log('ERR 2:', err);
//         })
//         .then((subCategoriesOfSubCategories) => {
//
//             return Promise.all(subCategoriesOfSubCategories.map((subCategoryArraySubCategories) => {
//
//                 return Promise.all(subCategoryArraySubCategories.map((subSubCategoryItems) => {
//
//                     return Promise.all(subSubCategoryItems.map((subSubCategory) => {
//
//                         urls.push(subSubCategory.url);
//
//                         if (!subSubCategory.checkForChildren) {
//                             return;
//                         }
//
//                         return getAmazonBestsellersSubcategoriesBySubcategory({
//                             parent: subSubCategory.parent,
//                             id: subSubCategory.id
//                         });
//
//                     }).filter((item) => typeof item !== 'undefined'));
//
//                 }).filter((item) => typeof item !== 'undefined'));
//
//             }).filter((item) => typeof item !== 'undefined'));
//
//         })
//         .catch((err) => {
//             console.log('ERR 3:', err);
//         })
//         .delay(5000)
//         .then((subCategoriesOfSubCategories) => {
//
//             return Promise.all(subCategoriesOfSubCategories.map((subCategoryArraySubCategories) => {
//
//                 return Promise.all(subCategoryArraySubCategories.map((subSubCategoryItems) => {
//
//                     return Promise.all(subSubCategoryItems.map((subSubCategoryArray) => {
//
//                         return subSubCategoryArray.map((subSubCategory) => {
//
//                             return urls.push(subSubCategory.url);
//
//                         });
//
//                     }));
//
//                 }));
//
//             }));
//
//         })
//         .then(() => {
//
//             require('fs').writeFileSync('urls.json', JSON.stringify(urls, null, 2), {
//                 encoding: 'utf-8'
//             });
//
//             return resolve(urls);
//
//         })
//         .catch((err) => {
//             console.log('ERROR:', err);
//         });
//
//     });
//
// };
//
// const data = {
//     l1: [],
//     l2: [],
//     l3: [],
//     l4: [],
//     l5: []
// };
//
// getAmazonBestsellersCategories()
// .then((categories) => {
//     data.l1 = data.l1.concat(categories);
//     console.log('GOT', categories.length, 'IN L1');
// })
// .delay(500)
// .then(() => {
//     return Promise.map(data.l1, (mainCategory) => {
//         return getAmazonBestsellersSubcategories({
//             parent: mainCategory.name
//         });
//     });
// })
// .then((subCategories) => {
//     data.l2 = data.l2.concat(...subCategories);
//     require('fs').writeFileSync('urls.json', JSON.stringify(data, null, 2), {
//         encoding: 'utf-8'
//     });
// })
// .delay(10000)
// .then(() => {
//     return Promise.map(data.l2, (subCategory) => {
//         return getAmazonBestsellersSubcategoriesBySubcategory({
//             parent: subCategory.parent,
//             id: subCategory.id
//         });
//     });
// })
// .then((subSubCategories) => {
//     data.l3 = data.l3.concat(...subSubCategories);
//     require('fs').writeFileSync('urls.json', JSON.stringify(data, null, 2), {
//         encoding: 'utf-8'
//     });
// });
