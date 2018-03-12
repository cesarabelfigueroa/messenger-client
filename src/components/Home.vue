<template>
<div id="landing-page">
	<div class="ui modal addMessage">
		<i class="close icon"></i>
		<div class="header">
			New Message
		</div>
		<div class="content">
			<div class="ui form">
				<div class="field">
					<label>Type</label>
					<div class="ui selection dropdown addMessage">
						<input type="hidden" name="type" id="message-type">
						<i class="dropdown icon"></i>
						<div class="default text">Type</div>
						<div class="menu">
							<div class="item" data-value="0">Public</div>
							<div class="item" data-value="1">Private</div>
							<div class="item" data-value="2">Shared</div>
						</div>
					</div>
				</div>
				<div class="field">
					<textarea id="message-text"></textarea>
				</div>
			</div>
		</div>
		<div class="actions">
			<div class="ui black deny button">
				Cancel
			</div>
			<div class="ui positive right labeled icon button" v-on:click="addMessage()">
				Submit
			</div>
		</div>
	</div>
	<div class="ui large top fixed menu transition" style="display: flex !important;">
		<div class="ui container">
			<router-link :to="{ name: 'Home', params: { userId: user }}" class="item active">Home</router-link>
			<router-link :to="{ name: 'Users', params: { user: user }}" class="item">User</router-link>
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
			<div class="ui grid main-menu-template" >
				<div class="four wide column">
					<div class="ui vertical fluid tabular menu">
						<a class="active item main-menu"  v-on:click="change('bio')" id="bio">
							Bio
						</a>
						<a class="item main-menu" v-on:click="change('followers')" id="followers">
							Followers
						</a>
						<a class="item main-menu" v-on:click="change('messages')" id="messages">
							Messages
						</a>
					</div>
				</div>
				<div class="twelve wide stretched column">
					<div class="ui segment" v-if="!user">
						You have to login first.
					</div>
					<div class="ui segment" v-if="user">
						<div class="ui container">
							<div class="ui card fluid" v-if="page =='bio' || !!!page ">
								<div class="image image-cool">
									<img :src="user.userInfo.picture  + '?height=200'">
								</div>
								<div class="content">
									<a class="header">{{user.userInfo.name}}</a>
									<div class="meta">
										<span class="date" v-if="user.followers">{{user.followers.length}} followers</span>
										<span class="date" v-if="user.messages">{{user.messages.length}} messages</span>
									</div>
								</div>
							</div>
						</div>
						<div class="ui container" v-if="page == 'messages'">
							<div class="ui menu">
								<div class="header item" v-on:click="showMessageDialog()">
									+
								</div>
							</div>
							<div class="ui cards" v-if="user && user.messages">
								<div class="card" v-for="message in user.messages">
									<div class="content">
										<div class="header">{{typeMap[message.type]}}</div>
										<div class="description">
											{{message.text}}
										</div>
									</div>
								</div>
							</div>
						</div>
						<div class="ui container" v-if = "page == 'followers'"> 
							<div class="ui container body-space">
								<div class="ui cards" v-if="user.followers">
									<div class="ui card" v-for="item in user.followers">
									  <div class="image">
									    <img :src="item.userInfo.picture + '?height=200'">
									  </div>
									  <div class="content">
									    <a class="header">{{item.userInfo.name}}</a>
									  </div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>

export default {
  name: 'Home',
  data: function () {
  	let _self = this;
    return {
      msg: '',
      type: '',
      page: 'bio',
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
					query:{
						email: email 
				}}).then((user) =>{
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
		}, function(e) {
			_self.$session.remove('user')
		  	_self.user = '';
		  	_self.status = 'off';
		});
  	},
  	change: function(actual){
  		let _self = this;
  		$('.main-menu').removeClass('active');
  		$('#'+actual).addClass('active');
  		this.page = actual;
  		if(_self.user){
  			return app.service('users').find({query:{
  				email: _self.user.email
  			}}).then((response) => {
				_self.$session.set('user', response.data[0])
			  	_self.user = response.data[0];
			  	_self.status = 'on';
  			});
  		}
  	},
  	showMessageDialog: function(){
  		$('.ui.selection.dropdown.addMessage').dropdown('set selected', '0');
  		$('.ui.modal.addMessage').modal('show');
  	},
  	addMessage: function(){
  		let _self = this;
  		let app = _self.$app;
  		let type = $('#message-type').val();
  		let text = $('#message-text').val();
  		let userId  = _self.user._id;

  		return app.service('message').create({
  			type, text,userId
  		}).then((message) =>{
  			return app.service('users').find({query:{
  				email: _self.user.email
  			}});
  		}).then((user) =>{
  			let messagesList = [];
  			user.data[0].messages.push({
	  			type, text,userId, likes: []
	  		});
	  		return app.service('users').update(user.data[0]._id, user.data[0])
  		}).then(user => {
  			_self.$session.set('user', user)
		  	_self.user = user;
		  	_self.status = 'on';
  		}).catch((err)=> console.log(err));
  	}
  }, 
  mounted: function(){
  	let _self = this;
  	if(_self.user){
  		return app.service('users').find({query:{
  			email: _self.user.email
  		}}).then((response) => {
			_self.$session.set('user', response.data[0])
		  	_self.user = response.data[0];
		  	_self.status = 'on';
		});
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

.image.image-cool {
    height: 100%;
}


</style>
