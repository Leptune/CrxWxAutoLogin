function msg(msg) {
    layer.msg(msg, {offset: 0, shift:6});
}

$(document).ready(function(){
	// console.log('popup.js开始执行')
	chrome.storage.local.get(null, function(items) {
		for (var key in items) {
			if (key == '__names') {
				continue;
			}
			$('#accountBtnArea').append('\
				<div class="button-row" data-user="'+items[key].user+'">\
					<button class="account-btn">&nbsp;'+items[key].name+'</button>\
					<div class="icon-container delete-acct"><i class="fa fa-trash"></i></div>\
				</div>');
		}
	});

    $('#showAddBtn').click(function(event) {
    	$('.button-area').hide();
    	$('.add-area').show();
    	$('.acct-input').val('');
    });
    $('#cancelBtn').click(function(event) {
    	$('.button-area').show();
    	$('.add-area').hide();
    });
    $('#confirmBtn').click(function(event) {
    	var name = $('#accountName').val();
    	var user = $('#account').val();
    	var pwd = $('#password').val();
    	if (!name || !user || !pwd) {
    		msg('请填入信息！');
    		return;
    	}
    	if (name == '__names') {
    		msg('该名字不允许使用！');
    		return;
    	}
    	chrome.storage.local.get([user, '__names'], function(result) {
    		if (result[user]) {
    			msg('该用户已存在，请删除后再添加');
    			return;
    		}
    		if (result.__names && result.__names[name]) {
    			msg('您已经有该名字了，请换个名字吧！');
    			return;
    		}
    		if (!result.__names) {
    			result.__names = {};
    		}
    		$('#accountBtnArea').append('\
    			<div class="button-row" data-user="'+user+'">\
    				<button class="account-btn">'+name+'</button>\
    				<div class="icon-container delete-acct"><i class="fa fa-trash"></i></div>\
    			</div>');
    		$('.button-area').show();
    		$('.add-area').hide();
    		var saveObj = {};
    		saveObj[user] = {
    			user: user,
    			pwd: md5(pwd),
    			name: name
    		}
    		result.__names[name] = '';
    		saveObj['__names'] = result.__names;
    		chrome.storage.local.set(saveObj);
    	});
    });
    $('body').on('click', '.delete-acct', function(event) {
    	$(this).closest('.button-row').remove();
    	var user = $(this).closest('.button-row').attr('data-user');
    	chrome.storage.local.remove(user);
    	chrome.storage.local.get([user, '__names'], function(result) {
    		delete result.__names[user];
    		chrome.storage.local.set({__names: result.__names});
    	});
    });
    $('body').on('click', '.button-row', function(event) {
    	var bg = chrome.extension.getBackgroundPage();
    	// console.log('开始调用background的start方法')
    	bg.start($(this).data('user'));
    });
});
