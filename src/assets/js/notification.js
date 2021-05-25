// var times = [3120, 4442, 5224, 7510, 8636, 16002, 17222];
// var countries = ['eng','us','eng_flage','fn','rus_flage','chn_flage','frn_flage'];
// var themeInterval = setInterval('notification()', time());

// function time() {
//     return   times[parseInt(Math.random()*7)] + 8000;
// };
function notification(msg,status) {
    spop({
        template: msg,
        group: false,
		style     : status,// error or success
        position  : 'bottom-left',
        autoclose: 5000,
        icon: true
    });
};