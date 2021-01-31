(function() {

    require.config({
        baseUrl: "/",
        paths: {
            'backbone': '/lib/backbone',
            'underscore': '/lib/underscore',
            'ejs': '/lib/ejs_production',
            'jquery': '/lib/jquery',
            'klon': '/lib/klon',
            'vcLoader': '/lib/vcJS/vcProgressTicker',
            'main': '/js/main',
            'base': '/js/views/base',
            'template': '/js/views/template',
            'gallery': '/js/gallery',
            'galleriffic': '/lib/jquery.galleriffic',
            'history': '/lib/jquery.history',
            'opacityrollover': '/lib/jquery.opacityrollover'
        },
        shim: {
            'backbone': { deps: ['underscore'] },
            'base': { deps: ['klon', 'ejs', 'jquery', 'backbone'] },
            'template': { deps: ['base'] },
            'vcLoader' : { deps: ['jquery'] },
            'galleriffic' : { deps: ['jquery'] },
            'history' : { deps: ['jquery'] },
            'opacityrollover' : { deps: ['jquery'] },
            'gallery': { deps: ['galleriffic', 'history', 'opacityrollover', 'klon'] },
            'main': { deps: ['template', 'gallery']}
        }
    });

    require(['vcLoader'], function(Loadr){
        // load progress ticker
        window.loadr = new Loadr({ host : $('#pageLoader #progress'), interval : 50});

        require(['main'], function(){
            // app will be loaded by require loading
        });

    });
})();