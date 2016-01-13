/**
 * Created by Administrator on 2015/08/16.
 */
if (!/opera/i.test(navigator.userAgent) && (function () {
        if ('navigator' in window && 'plugins' in navigator && navigator.plugins['Shockwave Flash']) {
            return !!navigator.plugins['Shockwave Flash'].description;
        }
        if ('ActiveXObject' in window) {
            try {
                return !!new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version');
            } catch (e) {
            }
        }
        return false;
    })()){
    console.log('支持flash')
}