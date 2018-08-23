// console.log('content-js开始执行');
function loginWx(user, tabId) {
	var url = 'https://mp.weixin.qq.com/cgi-bin/loginqrcode?action=ask&token=&lang=zh_CN&f=json&ajax=1';
	(function wxAsk() {
		$.get(url, function(data, status, xhr) {
			if (data.ret) {
				console.log(data)
				return;
			}
			switch (data.status) {
				case 1:
					if (1 == data.user_category) {
						url = "https://mp.weixin.qq.com/cgi-bin/loginauth?action=ask&token=&lang=zh_CN&f=json&ajax=1";
					} else {
						$.post('https://mp.weixin.qq.com/cgi-bin/bizlogin?action=login&lang=zh_CN', {
							userlang: 'zh_CN',
							token: '',
							lang: 'zh_CN',
							f: 'json',
							ajax: '1',
						}, function(data, textStatus, xhr) {
							if (data.base_resp && !data.base_resp.ret) {
								$('#__gzh-saomiao-status').text('登录成功！');
								var token = data.redirect_url.replace(/.*token=/g, '');
								chrome.runtime.sendMessage({type: 'login_success', token: token, user: user, tabId: tabId});
							}
						});
						return;
					}
					break;
				case 2: $('#__gzh-saomiao-status').text('管理员拒绝！'); return;
				case 3: $('#__gzh-saomiao-status').text('登录超时！'); return;
				case 4: $('#__gzh-saomiao-status').text('扫描成功，等待确认...'); break;
				default: $('#__gzh-saomiao-status').text('等待扫描...'); break;
			}
			setTimeout(function() { wxAsk(); }, 1000);
		});
	})();
}

function start(user, pwd, tabId) {
	$.post('https://mp.weixin.qq.com/cgi-bin/bizlogin?action=startlogin', {
		username: user,
		pwd: pwd,
		imgcode: '',
		f: 'json',
		userlang: 'zh_CN',
		token: '',
		lang: 'zh_CN',
		ajax: '1'
	}, function(data, status, xhr) {
		if (!data || !data.base_resp || data.base_resp.ret) {
			alert('用户名或密码错误！');
			console.log(data);
			return;
		}
		$('body').append('\
			<script>loginWx("'+user+'", '+tabId+');</script>\
			<div style="width: 100%; text-align: center; position: absolute; top: 20%; background: none; z-index: 999; ">\
			    <div style="width: 20%; text-align: center; background: #389a20a3; padding: 31px; margin: 0 auto;">\
			    	<h1 style="color: #e4f31f;">请扫描二维码</h1><br>\
			    	<img src="https://mp.weixin.qq.com/cgi-bin/loginqrcode?action=getqrcode&param=4300&rd='+Math.floor(1e3 * Math.random())+'" style="width:100%;">\
			    	<br><br><h1 id="__gzh-saomiao-status" style="color: #e4f31f;">等待扫描...</h1>\
			    </div>\
			</div>\
			<div style="position: fixed; top: 0; right: 0; bottom: 0; left: 0; background-color: rgba(0,0,0,.8); "></div>\
		');
	});
}

// 监听来自background-script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	// console.log(['get msg from background', request]);
	if(request.cmd == 'show_qrcode') {
		// sendResponse('content js has get msg');
		start(request.user, request.pwd, request.tabId);
	} else if (request.cmd == 'jump_url') {
		window.location.href = request.url;
	}
});

// 发送消息给background js
chrome.runtime.sendMessage({type: 'content_js_start', url: window.location.href});
