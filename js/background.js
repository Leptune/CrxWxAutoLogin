// console.log('background js开始执行')

var userStor;

function removeAllCookies(cookies) {
	cookies.forEach(function(cookie, index) {
		chrome.cookies.remove({
	        'url':'https://mp.weixin.qq.com',
	        'name': cookie.name
	    });
	})
}

function start(user) {
	// console.log('被popup.js调用该start方法')
	chrome.storage.local.get([user], function(result) {
		if (result && result[user] && result[user].user && result[user].pwd) {
			userStor = result[user];
			var time = Date.now()/1000|0;
			if (!userStor.cookies || time >= userStor.expire_time) { // 超时，需重新登陆
				chrome.cookies.getAll({url: 'https://mp.weixin.qq.com/'}, function (cookies) {
					removeAllCookies(cookies);
					chrome.tabs.create({'url': 'https://mp.weixin.qq.com/#login'});
			    });
				return;
			}
			// 没有超时，直接设置cookie登陆
			chrome.cookies.getAll({url: 'https://mp.weixin.qq.com/'}, function (cookies) {
				removeAllCookies(cookies);
				userStor.cookies.forEach(function(cookie, index) {
					delete cookie.hostOnly;
					delete cookie.session;
					cookie.url = 'https://mp.weixin.qq.com/';
					chrome.cookies.set(cookie);
				});
				// console.log('成功登陆公众号，准备跳转...')
				// chrome.tabs.create({'url': 'https://mp.weixin.qq.com/'});
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					if (tabs[0].url.startsWith('https://mp.weixin.qq.com') && tabs[0].id) { // 该页面直接跳转
						chrome.tabs.sendMessage(tabs[0].id, {cmd:'jump_url', url:'https://mp.weixin.qq.com/'});
					} else {
						chrome.tabs.create({'url': 'https://mp.weixin.qq.com/'});
					}
				});
		});
		} else {
			console.log('请先添加账号！');
		}
	});
}

// 监听来自content-script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	// console.log('收到来自content-script的消息：' + JSON.stringify(request));
	// sendResponse('我是后台，我已收到你的消息：' + JSON.stringify(request));
	if (request.type == 'login_success') {
		chrome.cookies.getAll({url: 'https://mp.weixin.qq.com/'}, function (cookies) {
			userStor.token = request.token;
			userStor.cookies = cookies;
			var time = Date.now()/1000|0;
			userStor.expire_time = time + 12*3600 - 60;
			var saveObj = {};
			saveObj[request.user] = userStor;
			chrome.storage.local.set(saveObj);
			// console.log('成功登陆公众号，准备跳转...')
			chrome.tabs.sendMessage(request.tabId, {cmd:'jump_url', url:'https://mp.weixin.qq.com/'});
	    });
	} else if (request.type == 'content_js_start') {
		// console.log('content_js_start, url:'+request.url)
		if ('https://mp.weixin.qq.com/#login' == request.url) { // 创建重新登录页面返回的消息
			chrome.tabs.sendMessage(sender.tab['id'], {cmd:'show_qrcode', user:userStor.user, pwd:userStor.pwd, tabId: sender.tab['id']});
		}
	}
});
