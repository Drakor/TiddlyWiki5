/*\
title: $:/core/modules/widgets/hover.js
type: application/javascript
module-type: widget

Hover widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Button = require("$:/core/modules/widgets/button.js").button;

var HoverWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	this.mouseInside = false;
};

/*
Inherit from the base widget class
*/
HoverWidget.prototype = new Button();

/*
Render this widget into the DOM
*/
HoverWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Create element
	var domNode = this.document.createElement("div");
	// Assign classes
	var classes = this["class"].split(" ") || [];
	// Assign hover class
	classes.unshift("tw-hoverzone");
	if(this.selectedClass) {
		if(this.set && this.setTo && this.isSelected()) {
			$tw.utils.pushTop(classes,this.selectedClass.split(" "));
		}
		if(this.popup && this.isPoppedUp()) {
			$tw.utils.pushTop(classes,this.selectedClass.split(" "));
		}
	}
	domNode.className = classes.join(" ");
	// Assign other attributes
	if(this.style) {
		domNode.setAttribute("style",this.style);
	}
	// In HTML5 this is valid, but might not be useful
	if(this.title) {
		domNode.setAttribute("title",this.title);
	}
	if(this["aria-label"]) {
		domNode.setAttribute("aria-label",this["aria-label"]);
	}
	// Add a click or mouse event handlers
	$tw.utils.addEventListeners(domNode, [{name: "mouseenter", handlerObject: this}]);
	$tw.utils.addEventListeners(domNode, [{name: "mouseleave", handlerObject: this}]);
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

/*
Compute the internal staté of the widget
*/
HoverWidget.prototype.execute = function() {
	// Get new attributes
	this.on = this.getAttribute("on", "hover");
	// Call the parent method
	Button.prototype.execute.call(this);
}

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
HoverWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.on) {
		this.refreshSelf();
		return true;
	}
	return Button.prototype.refresh.call(this,changedTiddlers);
};

/*
Handler for mouse events
*/
HoverWidget.prototype.handleEvent = function (event) {
	var self = this;
	var handled = false;
	switch (event.type) {
		case "mouseenter":
			if (self.mouseInside == false) {
				self.mouseInside = !self.mouseInside;
				if(self.on !== "mouseout") {
					handled = self.triggerActions(event);
				}
			}
			break;
		case "mouseleave":
			//Trigger popup again (to close)
			//Other actions are not triggered again
			if (self.mouseInside == true) {
				self.mouseInside = !self.mouseInside;
				if(self.on === "mouseout") {
					handled = self.triggerActions(event);
				} else if(self.on !== "mousein") {
					if (self.popup) {
						self.triggerPopup(event);
						handled = true;
					}
				}
			}
			break;
		default:
			// Don't handle other events.
	}
	if(handled) {
		event.preventDefault();
		event.stopPropagation();
	}
	// This is expected to be a void function, thus nothing to return
}

/*
Trigger the configured actions
*/
HoverWidget.prototype.triggerActions = function(event) {
	var self = this;
	var handled = false;
	if(self.to) {
		self.navigateTo(event);
		handled = true;
	}
	if(self.message) {
		self.dispatchMessage(event);
		handled = true;
	}
	if(self.popup) {
		self.triggerPopup(event);
		handled = true;
	}
	if(self.set) {
		self.setTiddler();
		handled = true;
	}
	return handled;
}

exports.hover = HoverWidget;

})();
