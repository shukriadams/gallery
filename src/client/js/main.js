(function(){

    "use strict";
    var _router = null,
        _portfolios = [],
        _settings = null,
        _imagesWithProducts = [],
        Router = Backbone.Router.extend({

        currentView: null,
        root: null,
        dataLoaded : false,

        initialize: function () {

            // override underscore default template embed tags
            _.templateSettings = {
                evaluate: /\{%([\s\S]+?)%\}/g,
                interpolate: /\{\{([\s\S]+?)\}\}/g
            };

            // load menu items, remove disabled menu items
            var menuData = [
                {
                    "key" : "portfolio",
                    "route" : "portfolio/fata",
                    "text" : "Work",
                    "enabled" : true
                },
                {
                    "key" : "shop",
                    "route" : "shop",
                    "text" : "Shop",
                    "enabled" : true
                },
                {
                    "key" : "biog",
                    "route" : "biog",
                    "text" : "Me",
                    "enabled" : true
                },
                {
                    "key" : "links",
                    "route" : "links",
                    "text" : "Links",
                    "enabled" : true
                }
            ]
            
            var length = menuData.length;
            for (var i = 0 ; i < menuData.length ; i ++){
                if (!menuData[length - 1 - i].enabled){
                    menuData.splice(length - 1 - i, 1);
                }
            }

            this.ensureData()

            var master = app.views.template.instance({  templateFile : 'master', data : { 
                title: _settings.title, 
                subtitle: _settings.subtitle, 
                menu : menuData,
                footer: _settings.footer
            }})

            master.render();
            var body = $('[data-role="content-root"]');
            $(body).empty();
            $(body).append(master.$el);
            this.root = $('#content');

        },

        routes: {
            "" : "home",
            "contact": "contact",
            "links": "links",
            "portfolio": "portfolio",
            "image": "image",
            "shop": "shop",
            "checkoutDone" : "checkoutDone",
            "image/:img" : "image",
            "portfolio/:port": "portfolio",
            "home" :  "home",
            "biog" :  "biog",
            '*notFound': '404'
        },

        ensureData : function(){
            if (this.dataLoaded)
                return;

            // load portfolios
            _settings = JSON.parse(new EJS({ url: '/json/settings' }).text)

            for (const gallery of _settings.galleries)
                _portfolios[gallery] = JSON.parse(new EJS({ url: `/json/galleries/${gallery}`}).text)

            // normalize data structure
            var ids = [];
            for (var item in _portfolios){
                for (var i = 0 ; i < _portfolios[item].images.length ; i ++){
                    //todo : remove this check on compile
                    var key = _portfolios[item].images[i].key;
                    if (!! ~ids.indexOf(key))
                        throw (key + " key duplicated");

                    if (_portfolios[item].images[i].products && _portfolios[item].images[i].products.length > 0){
                        _imagesWithProducts.push( _portfolios[item].images[i]);
                    }

                    ids.push(key);
                    _portfolios[item].images[i] = _.extend({
                        description : "",
                        products : []
                    }, _portfolios[item].images[i]);
                }
            }

            this.dataLoaded = true;
        },

        home : function(){
            if (window.loadr) {
                window.loadr.stop()
                window.loadr = null;
            }

            $('#subheader').empty();
            this.setMenuState("header", "");

            // todo remove this hardcoded ref
            var view = app.views.template.instance({ templateFile : 'home', data : { splashImage : _settings.splashImage, splashGallery : _settings.splashGallery } });
            this._showPageView(view);
        },

        shop : function(){
            $('#subheader').empty();
            this.setMenuState("header", "shop");

            var view = app.views.template.instance({ templateFile : 'shop', data : { images : _imagesWithProducts, content : _settings.shop } });
            this._showPageView(view);
        },

        checkoutDone : function() {
            $('#subheader').empty();
            this.setMenuState('header', '');

            var view = app.views.template.instance({ templateFile : 'checkoutDone' });
            this._showPageView(view);
        },

        biog : function(){
            $('#subheader').empty();
            this.setMenuState("header", "biog");

            var view = app.views.template.instance({ templateFile : 'biog', data : { content : _settings.biog } });
            this._showPageView(view);
        },

        contact : function(){
            $('#subheader').empty();
            this.setMenuState("header", "contact");

            var view = app.views.template.instance({ templateFile : 'contact' });
            this._showPageView(view);
        },

        404 : function(){
            $('#subheader').empty();
            this.setMenuState("header", "---");

            var view = app.views.template.instance({ templateFile : '404' });
            this._showPageView(view);
        },


        news : function(){
            $('#subheader').empty();
            this.setMenuState("header", "news");

            var view = app.views.template.instance({ templateFile : 'news' });
            this._showPageView(view);
        },

        links : function(){
            $('#subheader').empty();
            this.setMenuState("header", "links");

            var view = app.views.template.instance({ templateFile : 'links', data : { content : _settings.links } });
            this._showPageView(view);

        },

        image : function(img){
            this.portfolio(null, img);
        },

        portfolio : function(portfolio, img){
            var imgIndexInGallery;

            if (!portfolio){
                if (img){
                    for (var p in _portfolios){
                        for (var i = 0 ; i < _portfolios[p].images.length ; i ++){
                            var thisImgKey = _portfolios[p].images[i].key;
                            if (_portfolios[p].images[i].key === img){
                                portfolio = p;
                                imgIndexInGallery = i;
                                break;
                            }
                        }
                        if (portfolio)
                            break;
                    }
                }
            }

            // required when reloading a page, forces gallery to the image it was on when reload was trigger
            if (img) {
                $(window).bind('galleryInitialized', function (sender, args) {
                   if (args.gallery.currentIndex !== imgIndexInGallery){
                       args.gallery.gotoIndex(imgIndexInGallery);
                   }
                });
            }

            if (!portfolio)
                portfolio = _portfolios[Object.keys(_portfolios)[0]].name;

            // do this before using name, rectifies invalid names
            var p = _portfolios[portfolio];
            if (p === null) {
                p = _portfolios[Object.keys(_portfolios)[0]];
                portfolio = p.name;
            }

            var submenu =_.template(new EJS({ url: "/js/templates/portfolio_menu" }).text);
            submenu = submenu(_portfolios);
            $('#subheader').html(submenu);

            this.setMenuState("header", "portfolio");
            this.setMenuState("subheader", portfolio);


            var view = app.views.template.instance({  templateFile : 'portfolio', data : { portfolio : p} });
            this._showPageView(view);

            var script = app.scripts.portfolio.type();
            script.run();
        },

        bindRoutes : function(){
            $('[data-route]').unbind();
            $('[data-route]').click(function(e){
                var route = $(e.target).closest('[data-route]').data('route');
                _router.navigate(route, {trigger: true });
            });
        },

        setMenuState : function(menu, active){
            $.each($('#' + menu + ' [data-link-key]'), function(i, li){
                var $li = $(li);
                $li.toggleClass("active", $li.data("link-key") === active);
            });
        },

        // transitions page view in. If page supports sliding transition,
        // slide is done. Else a hard attachment is done.
        _showPageView: function (view) {

            // removes old page out, if page supports t
            var previousView = this.currentView || null;
            if (previousView) {
                previousView.remove();
            }

            view.render();
            this.currentView = view;

            this.root.empty();
            this.root.append(view.$el);

            view.onShow();

            this.bindRoutes();
        }

    });

    _router = new Router();
    Backbone.history.start({ pushState: true });

})();
