(function(){
    jsonp=function(url,callbackname,callback){
        var cbname='cb'+jsonp.COUNT++;
        var funcname='jsonp.'+cbname;
        jsonp[cbname]=function(data){
            try{
                callback(data)
            }finally{
                script.parentNode.removeChild(script);
            }
        };
        var script=document.createElement('script');
        url+=(/\?/.test(url)?'&':'?')+callbackname+'='+funcname+'&_='+(Math.random()*0xffffff|0);
        script.src=url;
        document.body.appendChild(script);
    };
    jsonp.COUNT=0;
})();