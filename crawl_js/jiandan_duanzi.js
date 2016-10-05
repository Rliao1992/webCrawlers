const async = require("async");
const cheerio = require("cheerio");
const superagent = require("superagent");
const fs = require("fs");
const emoji = require("node-emoji");
const colors = require("colors/safe");

var url = "http://jandan.net/duan";

async.waterfall(
    [
        function (callback) {
            console.log("正在开始获得要抓取的页数...");
            superagent.get("http://jandan.net/duan")
                .set("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1 wechatdevtools/0.7.0 MicroMessenger/6.3.9 Language/zh_CN webview/0")
                .set("X-Forwarded-For" , "10.111.198.90")
                .end(function (err, sres) {
                    if (err) {
                        console.log("failed to get: " + url + ", reason: " + err + " exit..");
                        process.exit();
                    } else {
                        //console.log(sres.text);
                        var $ = cheerio.load(sres.text);
                        var pageNum = $('span.current-comment-page').text();
                        var pageNumInt = parseInt(pageNum.substring(1, 5));
                        var urls = [];
                        for(var i = pageNumInt; i > pageNumInt - 30; i--){
                            urls.push("http://jandan.net/duan/page-" + i + "#comments");
                        }
                        console.log("总共有" + 30 + "页需要抓取...");
                        callback(null, urls);
                    }
                })
        },
        function(urls, callback) {
            console.log("现在开始抓取每页内容...");
            async.mapLimit(urls, 5, 
                function(v, mcallback){
                    console.log(colors.yellow("现在在抓取：" + v + "..." ));
                    superagent.get(v)
                    .set("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1 wechatdevtools/0.7.0 MicroMessenger/6.3.9 Language/zh_CN webview/0")
                    .set("X-Forwarded-For" , "10.111.198.90")
                    .end(function(err, sres2){
                        if (err) {
                            console.log("failed to get: " + v + ", " + err + " exit..");
                            process.exit();
                        }else{
                            var $ = cheerio.load(sres2.text);
                            var contentContainer = $("ol.commentlist > li > div.commenttext");
                            var singlePage = [];
                            contentContainer.each(
                                function(i,v2){
                                   var ac = {};
                                   ac.content = $(v2).children("p").text();
                                   ac.author = $(v2).parent().find("b").text();
                                   //console.log("这是第" + colors.red((i+1)) + "条内容");
                                   singlePage.push(ac);
                                   //console.log("内容已放到singlePage里面...");
                                }
                            );
                            console.log(colors.blue("当前页面抓取完成!") + " 页面共有" + colors.red(singlePage.length) + "条内容");
                            mcallback(null, singlePage);
                        }
                    })
                },
                function(err, result){
                    console.log(result.length);
                    var data = [];
                    //processArray:
                    function processArray(arr){
                        for(var k in arr){
                            if(Array.isArray(arr[k]) === true){
                                processArray(arr[k]);
                            }else{
                                data.push(arr[k]); 
                            }
                        }
                    };

                    processArray(result);
                    
                    console.log("所有页面抓取完成，总共抓取了" + data.length + "个段子 " + emoji.get(":laughing:"));
                    console.log("准备写入文件...");
                    callback(null, JSON.stringify(data));
                }
            );
        },
        function(result, callback){
            var file = "../results/duanzi.json";
            fs.writeFile(file,
                result, function(err){
                    if(err){
                        console.log(err);
                    }else{
                        callback(null, "写入文件完成...")
                    }
                }
            );
        }
    ],
    function (err, result) {
        //console.log("line 86: " + JSON.stringify(result));
        console.log(colors.green(result));
        process.exit();
    }
);