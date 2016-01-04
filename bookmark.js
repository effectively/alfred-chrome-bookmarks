'use strict';

const fs = require('fs');
const os = require('os');
const query = process.argv[2];
const bookmarksDir = os.homedir() + '/Library/Application Support/Google/Chrome/Default/Bookmarks';


new Promise(function (resolve, reject) {
    fs.readFile(bookmarksDir, 'utf-8', function (err, data) {
        if (err) {
            reject(err);
        } else {
            resolve(JSON.parse(data).roots);
        }
    });
})
    .then(collectUrls)
    .then(urls=>filterUrls(query, urls))
    .then(urls=>urls.map(toItem))
    .then(toItems)
    .then(xml=>console.log(xml))
    .catch(function (err) {
        let items = toItems([toItem({name: err, url: 'https://github.com/Youmoo'})]);
        console.log(items);
    });

function collectUrls(bookmarks) {
    return ["bookmark_bar", "other"].reduce(function (p, v) {
        let urls = handleBookmarks(bookmarks[v].children);
        p.push(...urls);
        return p;
    }, []);

}

function filterUrls(query, urls) {
    if (!query) {
        return urls;
    }
    return urls.filter(url=>new RegExp(query, 'i').test(url.url) || new RegExp(query, 'i').test(url.name))
}

function handleBookmarks(list) {
    return list.reduce(function (p, e) {
        if (e.type === 'folder') {
            let pp = handleBookmarks(e.children);
            p.push(...pp);
        }
        if (e.type === 'url') {
            p.push({
                name: e.name,
                url: e.url
            });
        }
        return p;
    }, [])
}

function toItem(url, i) {
    return `
        <item uid="${i}">
            <title><![CDATA[${url.name}]]></title>
            <subtitle><![CDATA[${url.url}]]></subtitle>
            <arg><![CDATA[${url.url}]]></arg>
        </item>
    `
}

function toItems(urls) {
    let text = urls.join('');
    return `
        <?xml version="1.0"?>
        <items>
            ${text}
        </items>
    `
}