/* dependencies :  jquery */
define('vcLoader', ['jquery'], function ($) {

    "use strict";

    var Loadr = function(options){
        var defaults = {
            host : null,
            interval : 100,
            maxLength : 10,
            token : "."
        };
        this.intervalId = null;
        options = $.extend(defaults, options);
        $.extend(this, options);

        this.start();
    };

    Loadr.prototype = function () { this.apply(this, arguments); };

    Loadr.prototype.start = function(){
        this.stop();
        var self = this;

        this.intervalId = window.setInterval(function(){
            var html = self.host.html();
            html += self.token;
            if (html.length > self.maxLength)
                html = "";
            self.host.html(html);
        }, this.interval);
    };

    Loadr.prototype.stop = function(){
        if (this.intervalId)
            window.clearInterval(this.intervalId);

        this.intervalId= null;
    };

    return Loadr;

});
