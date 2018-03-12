// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
const hello = require('hellojs/dist/hello.all.js');
var $ = require('jquery');
window.jQuery = $;
window.$ = $;
window.hello = hello;

import Vue from 'vue'
import App from './App'
import VueSessionStorage from 'vue-sessionstorage'
import router from './router'
import _ from 'lodash'
import semantic from './../semantic/semantic.js';
import css from './../semantic/semantic.css';
window.Vue = hello;

hello.init({
    facebook: '139762896848998'
});
const feathers = require('feathers/client');
const rest = require('feathers-rest/client');
const axios = require('axios');
const hooks = require('feathers-hooks');
const localStorage = require('localstorage-memory');
const auth = require('feathers-authentication-client');
const app = feathers();
app
.configure(hooks())
.configure(rest('https://message-server-1.herokuapp.com').axios(axios))
.configure(auth({storage: localStorage}));


Vue.use(VueSessionStorage)

Vue.config.productionTip = false


Vue.prototype.$app = app;
Vue.prototype.$hello = hello;

window.app = app;
window.router = router;


new Vue({
	el: '#app',
	router,
	components: {
		App
	},
	template: '<App/>'
})