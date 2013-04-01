/**
 * Flingr Now Playing UI handler
 * @author Jim O'Brien
 */
window.flingr = window.flingr || {};
window.flingr.nowPlaying = (function(nowPlaying, $, _, undefined) {

	nowPlaying = function(host, element, renderer) {
		var _this = this;
		this.host = host;
		this.context = {};
		this.$elem = $(element);
		this.renderer = renderer;
		this.update();
	};

	nowPlaying.prototype.render = function() {
		var _this = this;
		return _this.renderer('nowplaying', _this.context, _this.$elem, true);
	};

	nowPlaying.prototype.getActivePlayer = function() {
		var _this = this,
			promise = $.Deferred();
		_this.host.api.Player.GetActivePlayers.send().done(function(players) {
			if(players && players.length) {
				_this.context.player = players[0];
				$.when(_this.getPlayerData(), _this.getItemData()).done(function() {
					promise.resolve();
				});
			} else {
				delete _this.context.player;
				promise.resolve();
			}
		}).fail(function() {
			delete _this.context.player;
			promise.resolve();
		});
		return promise.promise();
	};

	nowPlaying.prototype.getPlayerData = function() {
		var _this = this;
		return _this.host.api.Player.GetProperties.send({
			playerid: _this.context.player.playerid,
			properties: ['canseek', 'currentaudiostream', 'live', 'speed', 'time', 'totaltime', 'percentage', 'type']
		}).done(function(data) {
			_.extend(_this.context.player, data);
		});
	};

	nowPlaying.prototype.getItemData = function() {
		var _this = this,
			promise = $.Deferred();
		_this.host.api.Player.GetItem.send({
			playerid: _this.context.player.playerid
		}).done(function(data) {
			var typeMap = {
					'episode': {
						api: 'GetEpisodeDetails',
						fields: ['showtitle', 'season', 'episode']
					},
					'movie': {
						api: 'GetMovieDetails',
						fields: ['year', 'tagline']
					}
				},
				apiPayload = {},
				typeName = data.item.type,
				type;

			_.extend(_this.context.player, data);
			if(typeName && typeMap[typeName]) {
				type = typeMap[typeName];
				apiPayload.properties = type.fields;
				apiPayload[typeName + 'id'] = data.item.id;
				_this.host.api.VideoLibrary[type.api].send(apiPayload).done(function(data) {
					_.extend(_this.context.player.item, data);
					promise.resolve();
				}).fail(function() {
					promise.resolve();
				});
			} else {
				promise.resolve();
			}
		});
		return promise.promise();
	}

	nowPlaying.prototype.update = function() {
		var _this = this,
			updateThenRender = function(changes) {
				_.extend(_this.context, changes || {});
				console.log('Updates started...');
				return _this.getActivePlayer().always(function() {
					console.log('Updates completed');
					_this.render();
				});
			};

		// Update, then render
		updateThenRender();

		// Subscribe to events on our host
		_this.host
			.on('Application.OnVolumeChanged', function(changes) {
				console.log('Volume change caught', changes);
				updateThenRender({volume: changes});
			})
			.on('Player.OnPlay', function(changes) {
				console.log('Play caught', changes);
				updateThenRender();
			})
			.on('Player.OnPause', function(changes) {
				console.log('Pause caught', changes);
				updateThenRender();
			})
			.on('Player.OnStop', function(changes) {
				console.log('Stop caught', changes);
				updateThenRender();
			})
			.on('Player.OnPropertyChanged', function(changes) {
				console.log('Player property change caught', changes);
				updateThenRender();
			})
			.on('Player.OnSeek', function(changes) {
				console.log('Seek caught', changes);
				updateThenRender();
			})
			.on('JSONRPC.Disconnect', function() {
				_this.context = {};
				_this.$elem.html('');
			});
	};

	return nowPlaying;
})(window.flingr.nowPlaying || {}, jQuery, _);