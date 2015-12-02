## pandora-proxy

Pandora插件。通过代理的方式，解决在本地环境调用（测试、线上）接口时

### 配置
在site.js中，增加proxy字段：

    proxy: {
        '本地路由': {
            hostname: '服务器名称',
            port: '端口号',  // 默认为80
            url: '/',       // 对应的远程服务器路径
            headers: {}     // 默认请求头，可通过这里设置认证信息
        },
        '/baidu/': {
            // 代理访问的路径
            hostname: 'www.baidu.com',
            port: 80,
            url: '/',
            headers: {}
        }
    }



设置以上代理后

`127.0.0.1:3201/baidu/` 对应 百度首页`www.baidu.com`<br>
`127.0.0.1:3201/baidu/s?wd=key` 对应 `www.baidu.com/s?wd=key`

### 使用

在启动服务前，进行初始化。

	var app = (require('express'))();
	var pandora = new(require('pandorajs'));

	pandora.init(app, __dirname);
	
	require('pandora-proxy')(app);
	
	app.listen(appCfg.port);

