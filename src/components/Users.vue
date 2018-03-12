<template>
<div id="landing-page">
	<div class="ui large top fixed menu transition" style="display: flex !important;">
		<div class="ui container">
			<router-link :to="{ name: 'Home', params: { user: user }}" class="item">Home</router-link>
			<router-link :to="{ name: 'Users', params: { user: user }}" class="item active">User</router-link>
			<router-link :to="{ name: 'Messages', params: { user: user }}" class="item">Messages</router-link>
			<div class="right menu">
				<div class="item">
					<button class="ui primary button" v-on:click="login" v-bind:class="{ disabled: status == 'on' }" >Log in</button>
				</div>
				<div class="item">
					<button class="ui red button" v-bind:class="{disabled: status == 'off' }" v-on:click="logout">Logout</button>
				</div>
			</div>
		</div>
	</div>
	<div class="ui container">
		<div class="ui container">
			<div class="ui icon input fluid">
			  <input type="text" placeholder="Search..." id="email">
			  <i class="circular search link icon" v-on:click="serchBy()"></i>
			</div>
		</div>
		<div class="ui container body-space">
			<div class="ui cards" v-if="allUsers && allUsers.all">
				<div class="ui card" v-for="item in allUsers.all">
				  <div class="image">
				    <img :src="item.userInfo.picture  + '?height=200'">
				  </div>
				  <div class="content">
				    <a class="header">{{item.userInfo.name}}</a>
				  </div>
				  <div class="extra content" v-on:click="follow(item)">
				    <a>
				      <i class="user icon"></i>
				      <span class="date" v-if="item.followers">{{item.followers.length}} followers</span>
				    </a>
				  </div>
				</div>
			</div>
		</div>
	</div>
</div>
</template>

<script>

export default {
  name: 'Users',
  data: function () {
  	let _self = this;
    return {
      allUsers: {
      	all: []
      },
      user:  _self.$session.get('user'),
      status:  _self.$session.get('user') ? 'on' : 'off',
      typeMap: ["Public", "Private", "Shared"]
    }
  },
  methods: {
  	login: function(){
  		let _self = this;
  		let app = this.$app;
  		_self.status = 'on';
  		this.$hello('facebook').login({scope: 'email, friends, photos', redirect_uri: 'http://localhost:8080/'});

		this.$hello.on('auth.login', async function (auth) {
		    const socialToken = auth.authResponse.access_token;
		    const userInfo = await hello(auth.network).api('me');
		    const socialId = userInfo.id;
		    const email = userInfo.email;
		    if(email){	
				return app.service('users').find({
					email: email 
				}).then((user) =>{
					if(!user.total){
						return app.service('users').create({
							email,
							socialId,
							socialToken,
							userInfo,
							followers: [],
							messages: []
						});
					}else{
						return app.service('users').update(user.data[0]._id, {
							email,
							socialId,
							socialToken,
							userInfo,
							followers: user.data[0].followers,
							messages: user.data[0].messages
						});
					}
				}).then(user => {
				  app.set('user', user);
				  if(user && user.email){
				  	_self.$session.set('user', user)
				  	_self.user = user;
				  	_self.status = 'on';
				 }
				}).catch(function(error){
				  console.error('Error authenticating!', error);
				});
			}
		});
  	},
  	logout: function(){
  		let _self = this;
  		hello('facebook').logout().then(function() {
			_self.$session.remove('user')
		  	_self.user = '';
		  	_self.status = 'off';
		  	window.location.href = './#/';
		}, function(e) {
			_self.$session.remove('user')
		  	_self.user = '';
		  	_self.status = 'off';
		  	window.location.href = './#/';
		});
  	},
  	serchBy: function(){
  		let _self = this;
  		let email = $('#email').val();
  		if(email){
  			return app.service('users').find({query: {email: email}}).then((users) =>{
		  		_self.allUsers.all = users.data;
		  	});
  		}else{
  			return app.service('users').find().then((users) =>{
		  		_self.allUsers.all = users.data;
		  	});
  		}
  	},
  	follow: function(user){
  		let _self  = this;
		return app.service('users').find({query: {email: user.email}}).then((users) =>{
	  		let followers  = users.data[0].followers;
	  		let follow = _.find(followers, function(item){
	  			return item.email === _self.user.email;
	  		});

	  		if(_.isEmpty(follow)){
	  			users.data[0].followers.push(_self.user);
	  			app.service('users').update(user._id, users.data[0]).then((response) =>{
	  				user.followers = response.followers;
	  			});
	  		}
	  	});
  	}
  },
  mounted(){
  	let _self = this;
  	if(_self.user){
  		return app.service('users').find().then((users) =>{
	  		_self.allUsers.all = users.data;
	  	});
  	}else{
  		window.location.href = './#/';
  	}
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.main-menu-template{
	min-height: 600px;
}

#landing-page{
  width: 100%;
  height: 100%;
}

.image-cool{
	width: 200px;
    height: 200px;
    margin: auto;
}

.body-space{
	margin-top: 30px;
}



</style>
