/**
 * flingr Chrome App Console UI client
 * @author Jim O'Brien
 */

(function(window, $, undefined) {

	var setupConnectionHandler = function($host, connect) {
		var $hostname = $('#hostname', $host),
			$port = $('#port', $host);

		$host.on('submit', function(ev) {
			var hostname = $hostname.val() || $hostname.prop('placeholder'),
				port = $port.val() || $port.prop('placeholder');

			$hostname.val(hostname);
			$port.val(port);
			connect(hostname, port);
			ev.preventDefault();
			return false;
		});

		return $host;
	};

	var onConnect = function(XBMC, renderPage) {
		var $page = renderPage('tree');
		XBMC.introspect().done(function(tree) {
			console.log('Introspection complete', tree, $page);
			renderTree(tree, $page);
		}).fail(function(error) {
			console.error('Error introspecting', error);
			// TODO: display error to user
		})
	};

	var renderConsole = function(event, $console) {
		console.info(event);
		var $out = $('<pre>');
		if(event.method) {
			$out.append(event.method);
		}
		if(event.data) {
			$out.append(event.data).append(JSON.stringify(event.params.data, null, 2));
		}
		$console.prepend($out);
		return $out;
	};

	var renderTree = function(tree, $tree) {
		var $header = $('<h2>', {text: tree.description}),
			$sections = $('<ul>'),
			sections = {};

		$.each(tree.methods, function(name, details) {
			var _name = name.split(/\./g),
				section = sections[_name[0]],
				method = _name[1];

			if(!$.isPlainObject(section)) {
				section = sections[_name[0]] = {};
			}
			section[name] = details;
		});
			
		$.each(sections, function(section, methods) {
			var $section = $('<li>'),
				$methods = $('<ul>');

			$.each(methods, function(name, details) {
				var $api = $('<li>'),
					$details = $('<ul>');

				$.each(details.params, function(id, param) {
					var $param = $('<li>'),
						$type = $('<span>', {'class':'label'});

					if(param.type) {
						if(typeof param.type === 'string') {
							$type.append(param.type).addClass('label-success');
						} else if(param.type.length) {
							$type.append('mixed').addClass('label-warning');
						}
					} else if(param.$ref) {
						$type.append(param.$ref).addClass('label-info');
					} else {
						return true;
					}
					$param.append($type);

					$param.append(' ' + param.name);
					$details.append($param);
				});

				$api.append(' ' + name).append($details);
				$methods.append($api);
			});

			$section.append(section).append($methods);
			$sections.append($section);
		});

		$tree.append($header).append($sections);
	};

	$(function() {
		var $hostForm = $('#hostForm'),
			$pages = $('[data-content]'),
			renderPage;

		renderPage = function(pageName) {
			console.log('Rendering page', pageName);
			var $page = $('[data-content="' + (pageName || 'home') + '"]');
			if($page.length) {
				$pages.addClass('hidden');
				$page.removeClass('hidden');
			}
			console.log($page);
			return $page;
		};

		// The UI launcher adds a method to return an XBMC object given a host/port.
		if(!flingr && !flingr.connect) {
			console.warn('Background window hasn\'t provided connection function.');
		} else {
			setupConnectionHandler($hostForm, function(host, port) {
				console.log('Connecting to', host, port);
				flingr.connect(host, port).always(function(XBMC){
					console.log('XBMC Connected', arguments);
					onConnect(XBMC, renderPage);
					XBMC.on('XBMC.Event', function() {
						console.log('XBMC Event', arguments);
					});
				});
			});
		}
	});


}).call(this, window, jQuery);