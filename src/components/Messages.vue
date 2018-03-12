<template>
<div id="landing-page">
	<div class="ui large top fixed menu transition" style="display: flex !important;">
		<div class="ui container">
			<router-link :to="{ name: 'Home', params: { user: user }}" class="item">Home</router-link>
			<router-link :to="{ name: 'Users', params: { user: user }}" class="item">User</router-link>
			<router-link :to="{ name: 'Messages', params: { user: user }}" class="item active">Messages</router-link>
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
	<div class="ui container" v-if="user">
		<div class="ui container body-space">
			<div class="ui cards" v-if="messages && messages.all">
				<div class="card" v-for="message in messages.all">
				    <div class="content">
				      <div class="description">
				         {{message.text}}
				      </div>
				       <div class="description" v-if="message.likes">
				        	{{message.likes.length}}  - Likes
				      </div>
				        <div class="description" v-if="!message.likes">
				        	0 - Likes
				      </div>
				    </div>
				    <div class="extra content">
				      <div class="ui two buttons">
				        <div class="ui green button" v-on:click="like(message)">Like</div>
				        <div class="ui red button" v-on:click="dislike(message)">Dislike</div>
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
  name: 'Users',
  data: function () {
  	let _self = this;
    return {
      messages: {
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
  		this.$hello('facebook').login({scope: 'email, friends, photos', redirect_uri: ''});

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
  	},
  	refresh: function(){
  		let _self = this;
	  	return app.service('message').find().then((response) =>{
	  		let messagesToShow = _.filter(response.data, function(item){
	  			return item.type == 0;
	  		})

	  		return {messages: response.data, messagesToShow: messagesToShow};
	  	}).then((messages) =>{
	  		let messagesShared = _.filter(messages.messages, function(item){
	  			return item.type == 2;
	  		});

	  		var promises = [];

			messagesShared.forEach(function(element) {
			    promises.push(
			        app.service('users').get(element.userId)
			            .then((data) => {
			                let find = _.find(data.followers, function(item){
			                	return _self.user._id == item._id;
			                });

			                return find;
			            }).then((result) =>{
			            	if(result){
			            		return element;
			            	}else{
			            		return false;
			            	}
			            })
			    );
			});

			return Promise.all(promises).then((values) => {
				let allData = _.filter(values, (item) =>{
					return item;
				});
				return _.concat(allData, messages.messagesToShow);
			});
	  	}).then((response) => {
	  		_self.messages.all = response.sort(function(a, b){

			  if(!b.likes){
			  	b.likes = [];
			  }

			  if(!a.likes){
			  	a.likes = [];
			  }
			  return b.likes.length - a.likes.length;
			});
	  	});
  	},
  	like: function(message){
  		let _self  = this;
		return app.service('message').get(message._id).then((message) =>{
	  		let likes  = message.likes || [];
	  		let like = _.find(likes, function(item){
	  			return item.email === _self.user.email;
	  		});

	  		if(_.isEmpty(like)){
	  			likes.push(_self.user);
	  			message.likes = likes;
	  			app.service('message').update(message._id, message).then((response) =>{
	  				message.likes = response.likes;
	  				_self.refresh();
	  			});
	  		}
	  	});
  	},
  	dislike: function(message){
  		let _self = this;
  		return app.service('message').get(message._id).then((message) =>{
	  		let likes  = message.likes || [];
	  		let dislikes = _.find(likes, function(item){
	  			return item.email !== _self.user.email;
	  		});

  			message.likes = dislikes || [];
  			app.service('message').update(message._id, message).then((response) =>{
  				message.likes = response.likes;
  				_self.refresh();
  			});
  		
	  	});
  	}
  },
  mounted(){
  	let _self = this;
  	if(_self.user){
  		_self.refresh();
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
