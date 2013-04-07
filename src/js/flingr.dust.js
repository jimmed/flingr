(function(dust, $) {
	dust.helpers.each = function(chunk, context, bodies, params) {
		var isEmpty = true,
			data = {},
			tmp;
		
		if($.isPlainObject(params.input)) {
			$.extend(data, params.input);
		} else {
			console.warn('@each expected plain object, got', params.input);
			return chunk;
		}
		if(bodies.block) {
			$.each(params.input, function(key, value) {
				isEmpty = false;
				chunk.render(bodies.block, context.push({key: key, value: params.input[key]}));
			});
		}
		if(isEmpty && bodies.empty) {
			chunk.render(bodies.empty, context);
		}
		return chunk;
	};

	var dustUuids = {};
	dust.helpers.uuid = function(chunk, context, bodies, params) {
		var uuid;
		params = params || {};
		if(params.key && $.isFunction(params.key)) {
			params.key = params.key(chunk, context);
		}
		if(params.key && dustUuids[params.key]) {
			uuid = dustUuids[params.key];
		} else {
			uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
			});
		}
		if(params.key) {
			dustUuids[params.key] = uuid;
		}
		console.log(params.key);
		return chunk.write(uuid);
	};

	dust.filters.a = function(i) { return i.replace(/[^a-z0-9]/gi, '_'); };
	dust.filters.xt = function(t) { console.log('Rendering XBMC time', t); return t; };
})(dust || {}, jQuery, undefined);