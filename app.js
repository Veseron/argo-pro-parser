const axios = require('axios'),
    cheerio = require('cheerio'),
    fs = require('fs')

const url = 'https://argo.pro/catalog/napravleniya/'

const parse = async () => {
    const result = []
    const getHtml = async (url) => {
        try {
            const { data } = await axios.get(url)
            return cheerio.load(data)
        } catch(err) {
            if (err.response) {
                return err.response.status
            } 
        }
    }

    // Парсим список разделов
    const ignoreList = ['/catalog/catalog_flip.php', '/catalog/all/']
    const $ = await getHtml(url)
    $('.ul_step_01 a').each(async function() {
        let href = await $(this).attr('href')
        if (ignoreList.indexOf(href) != -1) return;
        
        const $_ = await getHtml(`https://argo.pro${href}`)

        const pageData = {
            title: $_('.ul_step_01 a.activ').text(),
            link: `https://argo.pro${href}`,
            items: []
        }

        // Проходимся по каждому разделу, включая страницы пагинации
        
        let itemsCount = $_('.result').text().split(' ')
        itemsCount = parseInt(itemsCount.splice(-2, 1).join(''))
        const itemsOnPage = 8
        const pages = itemsCount / itemsOnPage

        for (let i = 1; i < itemsCount; i++) {
            const $__ = await getHtml(`https://argo.pro${href}?PAGEN_1=${i}`)
            
            try {
                $__('.catalog_bl').each(function(el) {
                    pageData.items.push({
                        cateory:pageData.title.trim(),
                        title: $_(this).find('.title_h').children('a').text(),
                        price: parseInt($_(this).find('.price').children('span').text().match(/\d+/)),
                        article: parseInt($_(this).find('.price').text().match(/\d+/)),
                        brand: $_(this).find('.brend').text()
                    })
                })
            } catch (err) {
                console.log(err)
            }
        }

        // result.push(pageData)
        console.log(pageData)
        
        // fs.readFile('results.json', function (err, data) {
        //     var json = JSON.parse(data)
        //     json.push(pageData)
        //     fs.writeFile("results.json", JSON.stringify(json), err => console.log(err))
        // })
    })

}

parse()