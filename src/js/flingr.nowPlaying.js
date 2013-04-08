/**
 * Flingr Now Playing UI handler
 * @author Jim O'Brien
 */
window.flingr = window.flingr || {};
window.flingr.nowPlaying = (function(nowPlaying, $, _, undefined) {

	var secondsToTime = function(seconds) {
		var hours = Math.floor(seconds / 3600),
			minutes;

		seconds -= hours * 3600;
		minutes = Math.floor(seconds / 60);
		seconds -= minutes * 60;
		
		return {
			hours: hours,
			minutes: minutes,
			seconds: Math.floor(seconds),
			milliseconds: (seconds - Math.floor(seconds)) * 1000
		}
	};

	var timeToSeconds = function(time) {
		return time.hours * 3600
			 + time.minutes * 60
			 + time.seconds;
	};

	nowPlaying = function(host, element, renderer) {
		this.host = host;
		this.context = {};
		this.$elem = $(element);
		this.renderer = renderer;
		this.update();
		this.originalBottom = parseInt($('[data-content]').css('bottom'), 10) || 0;
	};

	nowPlaying.prototype.render = function() {
		var _this = this;
		return _this.renderer('nowplaying', _this.context, _this.$elem, true).done(function() {
			$('[data-content]').css({bottom: (_this.originalBottom + _this.$elem.height()) + 'px'});
		});
	};

	nowPlaying.prototype.getActivePlayer = function() {
		var _this = this,
			promise = $.Deferred();

		_this.host.api.Player.GetActivePlayers.send().done(function(players) {
			_this.host.api.Application.GetProperties.send({properties: ['volume', 'muted']}).done(function(volume) {
				_this.context.volume = volume;
				if(players && players.length) {
					_this.context.player = players[0];
					$.when(_this.getPlayerData(), _this.getPlayingItemData()).done(function() {
						promise.resolve();
					});
				} else {
					delete _this.context.player;
					promise.resolve();
				}
			});
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
			console.log(_this.context, data);
			_this.context.player.totalSeconds = timeToSeconds(data.totaltime);
			_this.context.player.seconds = timeToSeconds(data.time);
			console.log(_this.context);
		});
	};

	nowPlaying.prototype.getPlayingItemData = function() {
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
			updateTick,
			updateThenRender = function(changes) {
				var promise = $.Deferred();

				if(updateTick) {
					clearInterval(updateTick);
				}
				_.extend(true, _this.context, changes || {});
				_this.render().done(setupUiHandlers);
				_this.getActivePlayer().always(function() {
					_this.render().pipe(promise).done(setupUiHandlers);
				});
				return promise.promise();
			},
			setupUiHandlers = function() {
				var $elem = _this.$elem,
					$btnPlayPause = $('#btnPlay, #btnPause', $elem),
					$btnStop = $('#btnStop', $elem)
					$seeker = $('#seeker', $elem),
					$volume = $('#volumeLevel', $elem),
					api = _this.host.api.Player,
					player = _this.context.player;

				if(player) {
					// Play/pause button
					$btnPlayPause.one('click', function(event) {
						api.PlayPause.send({playerid: player.playerid});
						event.preventDefault();
					});

					// Stop button
					$btnStop.one('click', function(event) {
						api.Stop.send({playerid: player.playerid});
						event.preventDefault();
					});

					// Seeker
					$seeker.slider({
						max: player.totalSeconds,
						step: 1,
						value: player.seconds
					}).on('slide', function(event) {
						api.Seek.send({
							playerid: player.playerid,
							value: (event.value / player.totalSeconds) * 100
						});
					});
					if(player.speed) {
						updateTick = setInterval(function() {
							$seeker.slider('setValue', ++player.seconds);
						}, 1000 / player.speed);
					}

					$('#progressBar .slider', $elem).css({width: '100%'});
				}
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
				updateThenRender({player: changes});
			})
			.on('Player.OnPause', function(changes) {
				console.log('Pause caught', changes);
				updateThenRender({player: changes});
			})
			.on('Player.OnStop', function(changes) {
				console.log('Stop caught', changes);
				delete _this.context.player;
				updateThenRender();
			})
			.on('Player.OnPropertyChanged', function(changes) {
				console.log('Player property change caught', changes);
				updateThenRender();
			})
			.on('Player.OnSeek', function(changes) {
				console.log('Seek caught', changes);
				updateThenRender({player: changes});
			})
			.on('JSONRPC.Disconnect', function() {
				_this.context = {};
				_this.$elem.html('');
			});
	};

	return nowPlaying;
})(window.flingr.nowPlaying || {}, jQuery, _);