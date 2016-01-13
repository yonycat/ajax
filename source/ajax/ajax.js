/**
 * Created by Administrator on 2015/08/15.
 */
(function () {

    var _ = {};

    //利用惰性函数，得到当前浏览器最合适的ajax对象
    var getXHR = (function () {
        var arr = [function () {
            return new XMLHttpRequest;
        }, function () {
            return new ActiveXObject('Microsoft.XMLHTTP')
        }, function () {
            return new ActiveXObject('Msxml2.XMLHTTP')
        }, function () {
            return new ActiveXObject('Msxml3.XMLHTTP')
        }], val;

        while (arr.length) {
            val = arr.splice(0, 1)[0];
            try {
                val();
                break;
            } catch (e) {
                val = null;
            }
        }
        if (val === null) {
            throw new Error('当前浏览器不支持此功能')
        }
        return val;
    })();

    //声明一个ajax方法，用于处理ajax逻辑，传入一个配置对象
    _.ajax = function (option) {
        //判断传入的参数是不是一个对象，不是对象就抛出错误
        if (!_.isObject(option)) {
            throw new Error('参数格式错误,类型必须是个对象')
        }
        //默认参数列表，不相信用户输入的，根据默认列表来便利参数。
        var _defaultList = {
            url: '',
            type: 'get',
            data: '',//{name:'asdf',age:1}
            dataType: 'json',
            headers: {},
            isAsync: true,
            cache: false
        }, key, tempVal;//声明两个临时变量，后面会用到。这样的话不必要每次都重新声明临时变量

        //   {a:1,b:2}
        //遍历参数列表，把用户输入的项放到默认参数列表里，如果用户输入参数中没有这个项，就不覆盖到默认参数列表
        for (tempVal in _defaultList) {
            key = option[tempVal];
            //key && (_defaultList[tempVal] = key);
            if (key !== undefined) {
                _defaultList[tempVal] = key
            }
        }

        //得到ajax对象
        var xhr = getXHR();

        //判断用户输入的http method是否合法，不合法就抛出错误
        if (!/^(get|post|delete|put|head)$/igm.test(_defaultList.type)) {
            throw new Error('http方法不合法')
        }

        //判断用户往服务器传输的数据是否为一个对象，如果是一个对象，利用encodeURIComponet方法，使之变成一个KEY1=VALUE1&KEY2=VALUE2&KEY3=VALUE3这样的格式，然后覆盖到用户往服务器传输的数据对象上
        if (_.isObject(_defaultList.data)) {
            var uriArray = [];
            for (tempVal in _defaultList.data) {
                uriArray.push(encodeURIComponent(tempVal) + "=" + encodeURIComponent(_defaultList.data[tempVal]))
            }
            _defaultList.data = uriArray.join('&');
        }

        //用户指定的数据格式只能为text或者json  不是得话就抛出错误
        if (!/^(text|json)$/ig.test(_defaultList.dataType)) {
            throw new Error('数据类型错误，只能接收json或者text');
        }

        //if (!_defaultList.cache) {
        //    //if (/\?/.test(_defaultList.url) {
        //    //    _defaultList.url+="_="+ _.uniqueId('qid')
        //    //}else{
        //    //    _defaultList.url+="?_="+ _.uniqueId('qid')
        //    //}
        //
        //}
        //
        //http://www.baidu.com?name=ab cache->true get c

        //判断是否走缓存，如果不走，在判断url里有没有“?”，没有就拼接一个"?"。最后在拼接一个唯一id，就是“_=qidn”。最后，把用户传输的数据对象设置为undefined。因为get系方法不需要请求主体，所以设置为undefined
        !_defaultList.cache && (_defaultList.url += (/\?/.test(_defaultList.url) ? '' : '?') + "_=" + _.uniqueId('qid'));

        if (/^(get|delete|head)$/ig.test(_defaultList.type)) {
            if (!/\?/.test(_defaultList.url)) {
                _defaultList.url += '?'
            }
            _defaultList.url += _defaultList.data;
            _defaultList.data = void 0;
        }

        //声明一个延迟对象，用于实现延迟回调
        var deferred = new Deferred();
        //调用ajax对象的open方法，打开这个ajax
        xhr.open(_defaultList.type, _defaultList.url, !!_defaultList.isAsync);

        //判断ajax对象是否支持setRequestHeader并且用户指定了请求头信息
        if (xhr.setRequestHeader && _.isObject(_defaultList.headers)) {
            for (tempVal in _defaultList.headers) {
                //调用ajax对象的setRequestHeader方法，传入自定义请求头信息
                xhr.setRequestHeader(tempVal, _defaultList.headers[tempVal]);
            }
        }
        //注册一个onredystatechange方法，用于接收服务器返回的数据
        xhr.onreadystatechange = function () {
            //只有当readystate为4的时候，这个http事务才完成，可进行下一步操作
            if (xhr.readyState == 4) {
                //判断是否为http状态码2开头或者（4、5）开头。2开头的话就执行成功回调。（4、5）开头就执行失败回调
                if (/^2\d{2}$/.test(xhr.status)) {
                    //把ajax对象的responseText属性赋值给一个变量。因为这个属性是只读的不可写。所以才这样做。
                    tempVal=xhr.responseText;
                    //判断用户数据格式是否为json，如果是json就调用JSONParse方法。因为服务器有可能返回的不是正确格式的json字符串，执行parse方法的话会报错，所以需要用try catch包裹住。执行报错就走catch里的逻辑
                    if (/json/ig.test(_defaultList.dataType)) {
                        try{
                            tempVal = _.JSONparse(tempVal)
                        }catch (e){
                            deferred.onFailed(xhr.status,xhr.getAllResponseHeaders&&xhr.getAllResponseHeaders(),'json格式不正确');
                            return;
                        }
                    }
                    //如果上面没有报错，就执行延迟对象的onfilled方法，并将responseText传入
                    deferred.onFilled(tempVal);
                }
                if (/^(4|5)\d{2}$/.test(xhr.status)) {
                    //服务器异常，执行延迟对象的onfailed方法
                    deferred.onFailed(xhr.status,xhr.getAllResponseHeaders&&xhr.getAllResponseHeaders(),'服务器异常');
                }
            }
        };
        //如果是get方法的话 _defaultList.data=undefined
        xhr.send(_defaultList.data);

        //返回延迟对象的promise对象，用于延迟回调操作，一定要是异步才行。同步的话会失效
        return deferred.promise;
    };
    //利用闭包，实现类型判断
    var isType = function (type) {
        return function (obj) {
            return Object.prototype.toString.call(obj) == '[object ' + type + ']';
        }
    };

    //利用惰性函数，先判断数组是否含有forEach方法，有就返回一个运行forEach逻辑的方法，不支持foreach方法的话，就返回一个运行for循环逻辑的方法
    _.each = (function () {
        if ([].forEach) {
            return function (list, callback) {
                [].forEach.call(list, callback);
            }
        }
        return function (list, callback) {
            for (var i = 0, len = list.length; i < len; i++) {
                callback.call(null, list[i], i, list);
            }
        }
    })();

    //利用上面写的each实现循环逻辑，给_动态添加一个字段，用于判断类型
    _.each(['String', 'Object', 'Function', 'Number'], function (item, index, list) {
        _['is' + item] = isType(item);
    });

    //根据输入的字符串生成一个唯一的id
    _.uniqueId = (function () {
        var i = 0;
        return function (symbol) {
            return symbol + i++;
        }
    })();

    //同样利用惰性函数，先判断浏览器是否支持json对象。不支持的话就用eval方法，支持就是用json对象里的Parse方法。用于实现将json字符串转换为json对象
    _.JSONparse = (function () {
        if (this.JSON) {
            return function (param) {
                return JSON.parse(param);
            }
        }
        return function (param) {
            return eval('(' + param + ')')
        }
    })();

    //把内部变量_ 抛到window的全局变量_里
    this._=_;

})();