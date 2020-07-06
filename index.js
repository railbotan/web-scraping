const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

async function getContents(urls) {
    const pages = [];
    const browser = await puppeteer.launch();
    let page = await browser.newPage();
    for (const url of urls) {
        await page.goto(url);
        const content = await page.content();
        pages.push(content);
    }
    await browser.close();
    return pages;
}

async function f() {
    const pages = await getContents(["https://google.com", "https://yandex.ru", "https://vk.com"]);
    for (const page of pages){
        const $ = cheerio.load(page);
        let a = $("title");
        let b = a[0].children[0];
        console.log(b.data);
    }
}

f().then(()=>console.log("end"));






