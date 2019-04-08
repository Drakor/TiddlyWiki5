/*\
title: $:/core/modules/savers/github.js
type: application/javascript
module-type: saver

Saves wiki by pushing a commit to the GitHub v3 REST API

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var base64utf8 = require("$:/core/modules/utils/base64-utf8/base64-utf8.module.js");

/*
Select the appropriate saver module and set it up
*/
var GitHubSaver = function(wiki) {
	this.wiki = wiki;
};

GitHubSaver.prototype.save = function(text,method,callback) {
	var self = this,
		username = this.wiki.getTiddlerText("$:/GitHub/Username"),
		password = $tw.utils.getPassword("github"),
		repo = this.wiki.getTiddlerText("$:/GitHub/Repo"),
		path = this.wiki.getTiddlerText("$:/GitHub/Path"),
		filename = this.wiki.getTiddlerText("$:/GitHub/Filename"),
		branch = this.wiki.getTiddlerText("$:/GitHub/Branch") || "master",
		headers = {
			"Accept": "application/vnd.github.v3+json",
			"Content-Type": "application/json;charset=UTF-8",
			"Authorization": "Basic " + window.btoa(username + ":" + password)
		};
	// Make sure the path start and ends with a slash
	if(path.substring(0,1) !== "/") {
		path = "/" + path;
	}
	if(path.substring(path.length - 1) !== "/") {
		path = path + "/";
	}
	// Compose the base URI
	var uri = "https://api.github.com/repos/" + repo + "/contents" + path;
	// Bail if we don't have everything we need
	if(!username || !password || !repo || !path || !filename) {
		return false;
	}
	// Perform a get request to get the details (inc shas) of files in the same path as our file
	$tw.utils.httpRequest({
		url: uri,
		type: "GET",
		headers: headers,
		data: {
			ref: branch
		},
		callback: function(err,getResponseDataJson,xhr) {
			if(err) {
				return callback(err);					
			}
			var getResponseData = JSON.parse(getResponseDataJson),
				sha = "";
			$tw.utils.each(getResponseData,function(details) {
				if(details.name === filename) {
					sha = details.sha;
				}
			});
			var data = {
					message: "Saved by TiddlyWiki",
					content: base64utf8.base64.encode.call(base64utf8,text),
					branch: branch,
					sha: sha
				};
			// Perform a PUT request to save the file
			$tw.utils.httpRequest({
				url: uri + filename,
				type: "PUT",
				headers: headers,
				data: JSON.stringify(data),
				callback: function(err,putResponseDataJson,xhr) {
					if(err) {
						return callback(err);
					}
					var putResponseData = JSON.parse(putResponseDataJson);
					callback(null);
				}
			});
		}
	});
	return true;
};

/*
Information about this saver
*/
GitHubSaver.prototype.info = {
	name: "github",
	priority: 2000,
	capabilities: ["save", "autosave"]
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	return true;
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new GitHubSaver(wiki);
};

})();