const priceToFloat = (price) => {
    return String(price)
        .replace(/[A-Z|\$|€|£|￥]*/g, '') // remove currency from price
        .trim() // cleanup (do I actually have to comment that?!)
        .replace(/(\.|,)([0-9]{2})$/,'|$2') // convert cent separator to | temporarily
        .replace(/(,|\.)/g,'') // remove both , and . from the price
        .replace('|','.'); // re-replace | with .
};

export default class AmazonDataExtractor {

    constructor(document) {

        this.document = document;

        this.priceSelectors = [
            '#priceblock_dealprice',
            '#priceblock_ourprice',
            '#priceblock_saleprice',
            '#product-price',
            '.priceLarge'
        ];

        this.titleSelectors = [
            '#title',
            '#productTitle',
            '#btAsinTitle',
            '#item_name'
        ];

    }

    getUrl() {
        return this.document.location.href;
    }

    getAsin() {

        const document = this.document;
        const asinNode = document.querySelector('[name="asin"],[name="ASIN"],[name="a"]');

        if (asinNode) {
            return asinNode.value;
        }

    }

    getPrice() {

        const document = this.document;

        const getPrice = (node) => {
            return node && priceToFloat(node.textContent);
        };

        for (let i = 0; i < this.priceSelectors.length; i++) {
            const node = document.querySelector(this.priceSelectors[i]);
            if (node) {
                return getPrice(node);
            }
        }

    }

    getCurrency() {

        const document = this.document;

        const getCurrency = (node) => {
            return node && node.textContent.match(/(CDN\$|USD|EUR|GBP|JPY|\$|€|£|￥)/g,'')[0]
            .trim()
            .replace('CDN$', 'CAD')
            .replace('￥', 'JPY')
            .replace('£', 'GBP')
            .replace('$', 'USD')
            .replace('€', 'EUR');
        };

        for (let i = 0; i < this.priceSelectors.length; i++) {
            const node = document.querySelector(this.priceSelectors[i]);
            if (node) {
                return getCurrency(node);
            }
        }

    }

    getTitle() {

        const document = this.document;

        const getTitle = (node) => {
            return node && node.textContent.trim();
        };

        for (let i = 0; i < this.titleSelectors.length; i++) {
            const node = document.querySelector(this.titleSelectors[i]);
            if (node) {
                return getTitle(node);
            }
        }

    }

    isOutOfStock() {
        const document = this.document;
        return Boolean(document.querySelectorAll('#outOfStock').length);
    }

    getImages() {

        const document = this.document;

        const basename = (filename) => {
            return filename.match(/([\d\w\.]*)$/g)[0];
        };

        const uniqueImages = [];

        const allImages = Array.from(document.querySelectorAll('[data-a-hires][data-a-image-name="immersiveViewMainImage"]')).map((img) => {
            return img.getAttribute('data-a-hires');
        });

        // Old way / Desktop version. Buggy!
        // const allImages = (
        //     document.body.innerHTML
        //     .match(/"hiRes":"(https:\/\/([a-z\-\.]+)images-amazon.com\/images\/I\/([\w.%\-]*)_SL1(5|0)00_.jpg)"/g)
        //     || []
        // )
        // .map((image) => image.replace(/"/g,'').replace('hiRes:',''));
        //
        // if (!allImages || !allImages.length) {
        //     return;
        // }

        allImages.forEach((image) => {

            const imageExists = uniqueImages
            .map((filteredImage) => basename(filteredImage))
            .find((filteredImageName) => filteredImageName === basename(image));

            if (!imageExists) {
                uniqueImages.push(image);
            }

        });

        return uniqueImages;

    }

    getData() {

        return {
            // asin: this.getAsin(),
            url: this.getUrl(),
            price: this.getPrice(),
            currency: this.getCurrency(),
            title: this.getTitle(),
            outOfStock: this.isOutOfStock() || undefined
        };

    }

}
