'use strict';

var async = require('async');
var _ = require('underscore');
var plugins = require('../../plugins');

var pluginsController = {};

pluginsController.get = function(req, res, next) {
	async.parallel({
		compatible: function(next) {
			plugins.list(function(err, plugins) {
				if (err || !Array.isArray(plugins)) {
					plugins = [];
				}

				next(null, plugins);
			});
		},
		all: function(next) {
			plugins.list(false, function(err, plugins) {
				if (err || !Array.isArray(plugins)) {
					plugins = [];
				}

				next(null, plugins);
			});
		},
		custom_header: function(next) {
			plugins.fireHook('filter:admin.header.build', {plugins: []}, next);
		}
	}, function(err, payload) {
		if (err) {
			return next(err);
		}
		var compatiblePkgNames = payload.compatible.map(function(pkgData) {
				return pkgData.name;
			});

		var installedPlugins = payload.compatible.filter(function(plugin) {
				return plugin.installed;
			}).map(function(plugin) {
				var routeMatchRX = /nodebb-(?:plugin|rewards|theme|widget)-(.*)/;
				var routeToMatch = '/plugins/' + plugin.id.match(routeMatchRX)[1];

				if (_.findWhere(payload.custom_header.plugins, {route: routeToMatch})) {
					plugin.settingsRoute = routeToMatch.substr(1);
				}

				return plugin;
			});

		res.render('admin/extend/plugins' , {
			installed: installedPlugins,
			download: payload.compatible.filter(function(plugin) {
				return !plugin.installed;
			}),
			incompatible: payload.all.filter(function(plugin) {
				return compatiblePkgNames.indexOf(plugin.name) === -1;
			})
		});
	});
};

module.exports = pluginsController;
