# 简介
smart-complete是一个为input和textarea提供提示补全功能的AngularJS指令

# 依赖
* [AngularJS](http://angularjs.org/)
* [jQuery](https://jquery.com/)
* [Caret.js](https://github.com/ichord/Caret.js)

# 安装
npm install smart-complete

# 使用

```js
angular.module('app', ['smart-complete']);
```

```html
<input type="text" smart-complete="searchFunc"
  sc-width="'240px'" sc-height="'200px'" sc-sep="','"
  sc-item-click-cb="itemClickCb" sc-enter-cb="enterCb">
```

Demo: [http://codepen.io/zskymn/pen/dMbNNb](http://codepen.io/zskymn/pen/dMbNNb)

# 开发
```sh
$ npm installl
$ gulp
```
