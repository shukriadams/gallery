(function(){

    'use strict';

    klon.register('app.views.template', app.views.base.type().extend({

        templateFile : "",
        elementFromTemplate : true,

        initialize : function(options){
            _.extend(this, options);
        },

        loadTemplate : function(){
            this.template = _.template(new EJS({ url: "/js/templates/" + this.templateFile }).text);
        },

        render : function(){
            this.loadTemplate();

            if (this.template){
                if (this.data)
                    this.html = this.template(this.data);
                else
                    this.html = this.template();
            }

            if (this.elementFromTemplate){
                // overwrite view element with template markup -
                // requires that template has a single html root element
                this.setElement($(this.html));
            } else {
                // append view markup to view root element
                this.$el.html(this.html);
            }

        }


    }));

}());