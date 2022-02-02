require('dotenv').config();

const fs = require("fs");
const axios = require("axios");
const cheerio = require('cheerio');

const remoteUrls = getRemoteUrls();

setTimeout(function () {
    remoteUrls.forEach(async (remoteUrl) => {
        if (remoteUrl === 'home') {
            remoteUrl = '/';
        }

        const remoteData = await getRemoteData(remoteUrl); // Ignore Intellij warning

        if (remoteUrl === '/') {
            remoteUrl = 'home';
        }

        let localData = getLocalData(remoteUrl);

        if (remoteData !== localData) {
            await googleNotification(remoteUrl);
        }
    });
}, process.env.INTERVAL * 1000 * 60);


/**
 * Return array of remote URLs
 * @return {Array}
 * */
function getRemoteUrls() {
    let result = fs.readdirSync('./data').map(file => file.replace('.txt', ''));

    return result.map(url => url.replace(/%2F/g, '/'));
}

/**
 * Return remote page content
 * @param {string} remoteUrl
 * @return {string}
 * */
async function getRemoteData(remoteUrl) {
    return axios.get(`${process.env.BASE_URL}/${remoteUrl}`)
        .then(response => {
            const html = response.data;
            let $ = cheerio.load(html)

            return $('#pageContent').text();
        });
}

/**
 * Get local page content
 * @param {string} localUrl
 * @returns {string}
 * */
function getLocalData(localUrl) {
    const html = fs.readFileSync(`./data/${encodeURIComponent(localUrl)}.txt`, 'utf8');

    let $ = cheerio.load(html);

    return $('#pageContent').text();
}

/**
 * Send notification to Google
 * @param {string} remoteUrl
 * */
async function googleNotification(remoteUrl) {
    const data = {
        'text': `There is a difference in endpoint: ${remoteUrl}`,
    };

    const headers = {
        'Content-Type': 'application/json'
    };

    await axios.post(process.env.GOOLE_WEBHOOK, data, {
        headers: headers
    });
}
