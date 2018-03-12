import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home'
import Users from '@/components/Users'
import Messages from '@/components/Messages'

Vue.use(Router)

export default new Router({
	routes: [{
		path: '/',
		name: 'Home',
		component: Home
	}, {
		path: '/Users',
		name: 'Users',
		component: Users
	}, {
		path: '/Messages',
		name: 'Messages',
		component: Messages
	}]
})