let http = require('http'),
    Express = require('express'),
    fsUtils = require('madscience-fsUtils'),
    fs = require('fs-extra'),
    handlebarsLoader = require('madscience-handlebarsloader'),
    app = Express(),
    port = 8030,
    galleries = [],
    portfolioData = null

async function loadPortfolio(){
    portfolioData = {} // force to something to prevent this from breaking on each pageload
    let portfolioFiles

    try {
        portfolioFiles = await fsUtils.readFilesUnderDir('./client/portfolio/json/galleries')

        for (const portfolioFile of portfolioFiles){
            const galleryName = fsUtils.fileNameWithoutExtension(portfolioFile)
            galleries.push(fsUtils.fileNameWithoutExtension(galleryName))
            let galleryDate = await fs.readJson(portfolioFile)
            for (const item of galleryDate.images){
                item.gallery = galleryName
                portfolioData[item.key] = item
            }
        }
        
        await fs.writeJson('./client/portfolio/json/_data.ejs', {
            galleries
        })

    } catch(ex){
        console.log(ex)
    }
}

(async ()=>{

    handlebarsLoader.initialize({ 
        pages : './templates/pages',
        // helpers : './templates/helpers',
        partials : './templates/partials'
    })
    

    
    app.use(Express.static('./client'))
    app.get(/^[^.]+$/, async function (req, res) {
        try {
            let browserDetect = require('browser-detect'),
                browser = browserDetect(req.headers['user-agent']),
                view = await handlebarsLoader.getPage('index'),
                model = {
                    galleries
                },
                agent = (req.headers['user-agent'] ||'').toLowerCase()
    
    
    
            if (browser && browser.name === 'ie' && browser.version < 11){
                view = await handlebarsLoader.getPage('unsupported')
                model = {
                    browser : `Internet Explorer version ${browser.version}`
                }
            }
    
            if (agent.includes('facebook')){
                view = await handlebarsLoader.getPage('facebook')
                
                const imageKey = req.url.replace(`/image/`, ''),
                    image = portfolioData[imageKey]
                

                model = {
                    gallery : image.gallery,
                    image
                }
            }
    
    
            res.send(view(model))
        } catch (ex){
            console.log(ex)
            res.end(ex)
        }
    })
    
    await loadPortfolio()
    
    let server = http.createServer(app)
    server.listen(port)
    console.log(`Gallery started, listening on port ${port} `)

})()

