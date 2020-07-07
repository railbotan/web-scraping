const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");

const moreUniversitySelector= "body > div:nth-child(2) > div.maincontent > div.m270 > div > div.mobpadd20.morediv";
const moreSpecialtiesSelector = "#rezspec > div.mobpadd20.morediv";

const specialtiesSelector = "#rezspec > div.headnap > div.napravlenienaz > center > span.font3 > b";
const specialtyCodesSelector = "#rezspec > div.headnap > div.napravlenienaz > center > span.font2";
const notesSelector = "div.mobpadd20-3:nth-child(2) table.cirfloat.cirfloatmargin:first-child table.circ2.circ2unique b.font11";

async function getLinks(content) {
    const dom = cheerio.load(content);
    const links = [];
    dom("a[href$=proxodnoi]").each((i, elem) => {
        const link = dom(elem).attr('href');
        links.push(link);
        console.log(`Получена ссылка №${i+1}: ${link}`);
    });
    return links;
}

async function pageClicker(page, selector) {
    while (true) {
        try {
            await page.waitForSelector(selector);
            await page.click(selector);
        } catch (e) {
            break;
        }
    }
}

async function getContents(url) {
    const pages = [];
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await pageClicker(page, moreUniversitySelector);
    const content = await page.content();
    console.log("Получена главная страница");
    const links = await getLinks(content);
    for (const link of links) {
        await page.goto(link);
        await pageClicker(page, moreSpecialtiesSelector);
        const pageContent = await page.content();
        console.log(`Получена страница ${link}`);
        pages.push(pageContent);
    }
    await browser.close();
    return pages;
}

function parsePage(page) {
    const dom = cheerio.load(page);
    const name = dom("h2[itemprop=name]").text();
    const alterName = dom("h2[itemprop=alternateName]").text();

    const specialties = [];

    dom(specialtiesSelector).each((i, elem) => {
        const data = dom(elem).text();
        specialties[i] = {
            specialty: data
        };
    });
    dom(specialtyCodesSelector).each((i, elem) => {
        const data = dom(elem).text();
        specialties[i] = {
            ...specialties[i],
            code: data.split(' | ')[1]
        };
    });
    dom(notesSelector).each((i, elem) => {
        const data = dom(elem).text();
        specialties[i] = {
            ...specialties[i],
            note: data
        };
    });
    console.log(`Извлеченны данные для ${alterName}`);
    return {
        name,
        alterName,
        specialties
    };
}

async function getData() {
    const result = [];
    const pages = await getContents("https://tabiturient.ru");
    for (const page of pages) {
        result.push(parsePage(page));
    }
    return result;
}

function writeFile(data) {
    const json = JSON.stringify(data, null, 2);
    fs.writeFile("D:\\Практика 3\\web-scraping\\temp.json", json, () => console.log("write!"));
}

getData().then(writeFile);

function readFile(data) {
    const vuz = JSON.parse(data, (key, value) => key === "note" ? parseInt(value) : value);
}

//fs.readFile("D:\\Практика 3\\web-scraping\\temp.json", "utf-8", (err, data) => readFile(data));