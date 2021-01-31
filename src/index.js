let http = require('http'),
    Express = require('express'),
    fsUtils = require('madscience-fsUtils'),
    fs = require('fs-extra'),
    yaml = require('js-yaml'),
    process = require('process'),
    handlebarsLoader = require('madscience-handlebarsloader'),
    app = Express(),
    path = require('path'),
    galleryNames = [],
    settings = null,
    portfolioData = null

async function loadPortfolio(){
    portfolioData = {} // force to something to prevent this from breaking on each pageload
    let portfolioFiles

    try {
        portfolioFiles = await fsUtils.readFilesUnderDir('./client/portfolio/json/galleries')
        for (const portfolioFile of portfolioFiles){
            const galleryName = fsUtils.fileNameWithoutExtension(portfolioFile)
            galleryNames.push(fsUtils.fileNameWithoutExtension(galleryName))
            let galleryDate = await fs.readJson(portfolioFile)

            for (const item of galleryDate.images){
                item.gallery = galleryName
                portfolioData[item.key] = item
            }
        }

        const outSettings = Object.assign({}, settings)
        outSettings.galleries = galleryNames

        // get splash image + gallery
        for (const galleryKey in settings.galleries){
            const images = settings.galleries[galleryKey].images || {}
            for (const imageKey in images){
                // force the first found item to be fallback splash
                if (!outSettings.splashImage){
                    outSettings.splashImage = images[imageKey].image
                    outSettings.splashGallery = galleryKey
                }

                if (images[imageKey].splash){
                    outSettings.splashImage = images[imageKey].image
                    outSettings.splashGallery = galleryKey
                    break
                }
            }
        }


        await fs.outputJson('./client/portfolio/json/settings.ejs', outSettings, { spaces : 4})

    } catch(ex){
        console.log(ex)
    }
}

async function loadSettings(){
    
    if (!await fs.exists('./settings.yml'))
        throw 'settings.yml not found.'

    let rawSettings = null

    try {
        const settingsYML = await fs.readFile('./settings.yml', 'utf8');
        rawSettings = yaml.safeLoad(settingsYML)
    } catch (e) {
        console.log('Error reading settings.yml')
        console.log(e)
        return process.exit(1)
    }    

    settings = Object.assign({
        // default settings
        version : 1,
        port: 8030,
        title: 'Your title here',
        subtitle : 'Your subtitle',
        googleAnalyticsCode: null,
        facebookAppId: null,
        biog: 'Add your biog here',
        links: 'Add your links text here',
        galleries : {}
    }, rawSettings);
    // generate gallery EJS/JSON files

    for(const galleryKey in settings.galleryNames) {
        const galleryIn = settings.galleries[galleryKey],
            galleryOut = {
                name : galleryKey,
                title : galleryIn.title,
                images : []
            }

        galleryIn.images = galleryIn.images || {}
        for (const imageKey in galleryIn.images){
            const image = galleryIn.images[imageKey]
            image.key = imageKey
            galleryOut.images.push(image)
        }

        await fs.outputJson(`./client/portfolio/json/galleries/${galleryKey}.ejs`, galleryOut, { spaces : 4})
    }
}

(async ()=>{
    
    await loadSettings()
    await loadPortfolio()

    handlebarsLoader.initialize({ 
        pages : './templates/pages',
        partials : './templates/partials'
    })
    
    
    app.use(Express.static('./client'))
    app.get(/^[^.]+$/, async function (req, res) {
        try {
            let browserDetect = require('browser-detect'),
                browser = browserDetect(req.headers['user-agent']),
                view = await handlebarsLoader.getPage('index'),
                model = {
                    galleryNames,
                    settings
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
    

    
    let server = http.createServer(app)
    server.listen(settings.port)
    console.log(`Gallery started, listening on port ${settings.port} `)

})()

