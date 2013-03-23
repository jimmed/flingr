/**
 * flingr Chrome App Console UI client
 * @author Jim O'Brien
 */

(function(window, $, undefined) {

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
		var $tree = $('#apiTree'),
			$console = $('#console-output');
		if(!flingr && !flingr.hosts) {
			console.warn('Background window hasn\'t provided flingr.hosts');
		} else {
			$.each(flingr.hosts, function(hostId, host) {
				host.on('Flingr.Event', function(event) {
					renderConsole(event, $console)
				});

				host.api('JSONRPC.Introspect').done(function(tree) {
					renderTree(tree, $tree);
				}).fail(function(error) {
					console.warn('Introspect error', error);
				})
			})
		}
	});


}).call(this, window, jQuery);