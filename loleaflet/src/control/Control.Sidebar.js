/* -*- js-indent-level: 8 -*- */
/*
 * L.Control.Sidebar
 */

/* global $ */
L.Control.Sidebar = L.Control.extend({
	options: {
		autoUpdate: true
	},

	panelIdPrefix: 'sidebarpanel-',

	// Converts an string Id to its raw integer Id.
	_toIntId: function(id) {
		if (typeof(id) === 'string')
			return parseInt(id.replace(this.panelIdPrefix, ''));
		return id;
	},

	// Converts an integer Id to string, such as 'sidebarpanel-123'.
	_toStrId: function(id) {
		return this.panelIdPrefix + id;
	},

	onAdd: function (map) {
		this._previewInitialized = false;
		this._sidebarCont = L.DomUtil.get('slide-sorter');
		this._scrollY = 0;

		map.on('window', this._onWindowMsg, this);
		map.on('windowpaint', this._onWindowPaint, this);
		map.on('docloaded', this._docLoaded, this);
	},

	_docLoaded: function(e) {
		if (!e.status) {
			// $('.lokdialog_container').remove();
			// $('.lokdialogchild-canvas').remove();
		}
	},

	_isParent: function(id) {
		return this._currentDeck != null && this._currentDeck.id === id;
	},

	_isOpen: function(id) {
		return this._isParent(id) && $('#' + this._toStrId(id)).length > 0;
	},

	_isChild: function(id) {
		return this._currentDeck != null && this._currentDeck.child != null && this._currentDeck.child.id === id;
	},

	_isChildOpen: function(id) {
		return this._isChild(id) && $('#' + this._currentDeck.strId + '-floating').length > 0;
	},

	// If returns non-null, then id is that of a panels and we have a parent (with the returned id).
	_getParentId: function(id) {
		if (this._isChild(parseInt(id)))
			return this._currentDeck.id;
		return null;
	},

	_onWindowMsg: function(e) {
		e.id = parseInt(e.id);
		var strId = this._toStrId(e.id);

		if (e.action === 'created') {
			var width = parseInt(e.size.split(',')[0]);
			var height = parseInt(e.size.split(',')[1]);

			if (e.position) {
				var left = parseInt(e.position.split(',')[0]);
				var top = parseInt(e.position.split(',')[1]);
			}

			if (e.winType === 'deck') {
				this._launchSidebar(e.id, left, top, width, height, e.title);
			} else if (e.winType === 'child') {
				var parentId = parseInt(e.parentId);
				if (!this._isOpen(parentId))
					return;

				left -= this._currentDeck.left;
				top -= this._currentDeck.top;

				this._removeChild(parentId);
				this._currentDeck.child = {
					open: true,
					id: e.id,
					strId: strId,
					left: left,
					top: top,
					width: width,
					height: height,
					parentId: parentId
				};

				this._createChild(e.id, parentId, top, left);
				this._sendPaintWindow(e.id, 0, 0, width, height);
			}
			else {
				// We only handle sidebar panels here (see Control.LokDialog.js)
				return;
			}
		}

		// The following act on an existing window.
		if (!this._isOpen(e.id) && !this._isChildOpen(e.id))
			return;

		if (e.action === 'invalidate') {
			var rectangle = e.rectangle;
			var fullRepaint = true;
			if (!rectangle || !this._isRectangleValid(rectangle) || fullRepaint)
			{
				if (this._isChild(e.id))
					rectangle = '0,0,' + this._currentDeck.child.width + ',' + this._currentDeck.child.height;
				else
					rectangle = '0,0,' + this._currentDeck.width + ',' + this._currentDeck.height;

				this._sendPaintWindowStr(e.id, rectangle);
			}
			else if (this._isChild(e.id))
			{
				// Child windows are given relative coordinates.
				this._sendPaintWindowStr(e.id, rectangle);
			}
			else
			{
				// Convert from absolute screen coordinates to relative.
				rectangle = rectangle.split(',');
				rectangle[0] = parseInt(rectangle[0]) - this._currentDeck.left;
				rectangle[1] = parseInt(rectangle[1]) - this._currentDeck.top;
				this._sendPaintWindow(e.id, rectangle[0], rectangle[1], rectangle[2], rectangle[3]);
			}
		} else if (e.action === 'size_changed') {
			width = parseInt(e.size.split(',')[0]);
			height = parseInt(e.size.split(',')[1]);
			left = parseInt(e.position.split(',')[0]);
			top = parseInt(e.position.split(',')[1]);
			this._launchSidebar(e.id, left, top, width, height);
		} else if (e.action === 'cursor_invalidate') {
			if (this._isOpen(e.id) && !!e.rectangle) {
				rectangle = e.rectangle.split(',');
				var x = parseInt(rectangle[0]);
				var y = parseInt(rectangle[1]);
				height = parseInt(rectangle[3]);

				// Relative x to the sidebar.
				x -= this._currentDeck.left;
				// We have 25 pixel top margin.
				y -= 25;

				this._updateDialogCursor(e.id, x, y, height);
			}
		} else if (e.action === 'title_changed') {
			if (e.title && this._currentDeck.cursor) {
				this._currentDeck.cursor.title = e.title;
				$('#' + strId).dialog('option', 'title', e.title);
			}
		} else if (e.action === 'cursor_visible') {
			this._currentDeck.cursor.cursorVisible = e.visible === 'true';
			if (this._currentDeck.cursor.cursorVisible)
				$('#' + strId + '-cursor').css({display: 'block'});
			else
				$('#' + strId + '-cursor').css({display: 'none'});
		} else if (e.action === 'close') {
			var parent = this._getParentId(e.id);
			if (parent)
				this._onPanelChildClose(this._toStrId(parent));
			else
				this._onPanelClose(e.id, false);
		}
	},

	_launchSidebar: function(id, left, top, width, height, title) {

		title; // unsed for now.
		if (!left)
			left = 0;
		if (!top)
			top = 0;

		// First, remove existing.
		// FIXME: we don't really have to destroy and launch the sidebar again but do it for
		// now because the size sent to us previously in 'created' cb is not correct
		if (this._currentDeck)
			$('#' + this._currentDeck.strId).remove();

		var strId = this._toStrId(id);

		var panelContainer = L.DomUtil.create('div', 'panel', L.DomUtil.get('sidebar-panel'));
		// var panelContainer = L.DomUtil.create('div', 'panel', L.DomUtil.get('slide-sorter'));
		L.DomUtil.setStyle(panelContainer, 'padding', '0px');
		L.DomUtil.setStyle(panelContainer, 'margin', '0px');
		L.DomUtil.setStyle(panelContainer, 'position', 'relative');
		panelContainer.id = strId;

		// Create the panel canvas.
		var panelCanvas = L.DomUtil.create('canvas', 'panel_canvas', panelContainer);
		L.DomUtil.setStyle(panelCanvas, 'position', 'absolute');
		panelCanvas.width = width;
		panelCanvas.height = height;
		panelCanvas.id = strId + '-canvas';

		// Create the child canvas now, to make it on top of the main panel canvas.
		var floatingCanvas = L.DomUtil.create('canvas', 'lokdialogchild-canvas', panelContainer);
		L.DomUtil.setStyle(floatingCanvas, 'position', 'absolute');
		floatingCanvas.width = 0;
		floatingCanvas.height = 0;
		floatingCanvas.id = strId + '-floating';


		L.DomEvent.on(panelCanvas, 'contextmenu', L.DomEvent.preventDefault);

		// Don't show the sidebar until we get the contents.
		$(panelContainer).parent().hide();

		this._currentDeck = {
			open: true,
			id: id,
			strId: strId,
			left: left,
			top: top,
			width: width,
			height: height,
			title: title,
			cursor: null,
			input: null,
			child: null // One child, typically drop-down list
		};

		// don't make 'TAB' focus on this button; we want to cycle focus in the lok dialog with each TAB
		// $('.lokdialog_container button.ui-dialog-titlebar-close').attr('tabindex', '-1').blur();

		this._createDialogCursor(strId);
		var dlgInput = this._createDialogInput(strId);

		L.DomEvent.on(panelCanvas, 'contextmenu', L.DomEvent.preventDefault);
		L.DomEvent.on(panelCanvas, 'mousemove', function(e) {
			this._map.lastActiveTime = Date.now();
			if (!this._currentDeck.title) // For context menu
				this._postWindowMouseEvent('move', id, e.offsetX, e.offsetY, 1, 0, 0);
		}, this);
		L.DomEvent.on(panelCanvas, 'mousedown mouseup', function(e) {
			L.DomEvent.stopPropagation(e);
			var buttons = 0;
			buttons |= e.button === this._map['mouse'].JSButtons.left ? this._map['mouse'].LOButtons.left : 0;
			buttons |= e.button === this._map['mouse'].JSButtons.middle ? this._map['mouse'].LOButtons.middle : 0;
			buttons |= e.button === this._map['mouse'].JSButtons.right ? this._map['mouse'].LOButtons.right : 0;
			// 'mousedown' -> 'buttondown'
			var lokEventType = e.type.replace('mouse', 'button');
			this._postWindowMouseEvent(lokEventType, id, e.offsetX, e.offsetY, 1, buttons, 0);
			dlgInput.focus();
		}, this);

		L.DomEvent.on(dlgInput,
		              'keyup keypress keydown compositionstart compositionupdate compositionend textInput',
		              function(e) {
			              e.originalEvent = e; // _onKeyDown fn below requires real event in e.originalEvent
			              this._map['keyboard']._onKeyDown(e,
			                                         L.bind(this._postWindowKeyboardEvent,
			                                                this,
			                                                id),
			                                         L.bind(this._postWindowCompositionEvent,
			                                                this,
			                                                id),
			                                         dlgInput);

			              // keep map active while user is playing with panel
			              this._map.lastActiveTime = Date.now();
		              }, this);
		L.DomEvent.on(dlgInput, 'contextmenu', function() {
			return false;
		});

		// Render window.
		this._sendPaintWindow(id);
	},

	_removeChild: function(parentId) {
		if (typeof parentId === 'number')
			parentId = this._toStrId(parentId);
		var floatingCanvas = L.DomUtil.get(parentId + '-floating');
		floatingCanvas.width = 0;
		floatingCanvas.height = 0;
		// $('#' + parentId + '-floating').remove();
	},

	_createChild: function(childId, parentId, top, left) {
		var strId = this._toStrId(parentId);
		var floatingCanvas = L.DomUtil.get(strId + '-floating');
		L.DomUtil.setStyle(floatingCanvas, 'position', 'relative'); // Relative to the sidebar
		L.DomUtil.setStyle(floatingCanvas, 'left', left + 'px'); // yes, it's necessary to append 'px'
		L.DomUtil.setStyle(floatingCanvas, 'top', top + 'px');

		L.DomEvent.on(floatingCanvas, 'contextmenu', L.DomEvent.preventDefault);

		// attach events
		L.DomEvent.on(floatingCanvas, 'mousedown mouseup', function(e) {
			var buttons = 0;
			buttons |= e.button === this._map['mouse'].JSButtons.left ? this._map['mouse'].LOButtons.left : 0;
			buttons |= e.button === this._map['mouse'].JSButtons.middle ? this._map['mouse'].LOButtons.middle : 0;
			buttons |= e.button === this._map['mouse'].JSButtons.right ? this._map['mouse'].LOButtons.right : 0;
			var lokEventType = e.type.replace('mouse', 'button');
			this._postWindowMouseEvent(lokEventType, childId, e.offsetX, e.offsetY, 1, buttons, 0);
		}, this);
		L.DomEvent.on(floatingCanvas, 'mousemove', function(e) {
			this._postWindowMouseEvent('move', childId, e.offsetX, e.offsetY, 1, 0, 0);
		}, this);
		L.DomEvent.on(floatingCanvas, 'contextmenu', function() {
			return false;
		});
	},

	_sendPaintWindowStr: function(id, rectangle) {
		if (rectangle)
			rectangle = rectangle.replace(/ /g, '');

		this._map._socket.sendMessage('paintwindow ' + id + (rectangle ? ' rectangle=' + rectangle : ''));
	},

	_sendPaintWindow: function(id, x, y, width, height) {
		if (!width)
			width = this._currentDeck.width;
		if (!height)
			height = this._currentDeck.height;
		if (!x)
			x = 0;
		if (!y)
			y = 0;

		// Don't request empty area rendering.
		if (width > 0 && height > 0)
			this._sendPaintWindowStr(id, [x, y, width, height].join(','));
	},

	/// Rendered image sent from Core.
	_onWindowPaint: function (e) {
		var parent = this._getParentId(e.id);
		if (parent) {
			this._paintPanelChild(parent, e.width, e.height, e.rectangle, e.img);
		} else {
			this._paintPanel(e.id, e.rectangle, e.img);
		}
	},

	/// Rendered image sent from Core.
	_paintPanel: function (parentId, rectangle, imgData) {
		// if (!this._isOpen(parentId))
		// 	return;

		var strId = this._toStrId(parentId);
		var canvas = document.getElementById(strId + '-canvas');
		if (!canvas)
			return; // no window to paint to

		var ctx = canvas.getContext('2d');

		// The actual image of the window may be larger/smaller than the dimension we get on size_changed.
		var width = this._currentDeck.width;

		var docContainer = this._map.options.documentContainer;
		var img = new Image();
		img.onload = function() {
			var x = 0;
			var y = 0;
			if (rectangle) {
				rectangle = rectangle.split(',');
				x = parseInt(rectangle[0]);
				y = parseInt(rectangle[1]);
			}

			ctx.drawImage(img, x, y);

			var sidebar = L.DomUtil.get(strId);
			sidebar.style.width = width.toString() + 'px';
			docContainer.style.right = sidebar.style.width;
			var spreadsheetRowColumnFrame = L.DomUtil.get('spreadsheet-row-column-frame');
			if (spreadsheetRowColumnFrame)
				spreadsheetRowColumnFrame.style.right = sidebar.style.width;

			// if dialog is hidden, show it
			var dialogContainer = L.DomUtil.get(strId);
			$(dialogContainer).parent().show();
			// that.focus(parentId);
		};
		img.src = imgData;
	},

	_paintPanelChild: function(parentId, width, height, rectangle, imgData) {
		var strId = this._toStrId(parentId);
		var img = new Image();
		var canvas = L.DomUtil.get(strId + '-floating');
		if (!canvas)
			return; // no floating window to paint to

		if (width !== canvas.width)
			canvas.width = width;
		if (height !== canvas.height)
			canvas.height = height;
		var ctx = canvas.getContext('2d');
		img.onload = function() {
			ctx.drawImage(img, 0, 0);
		};
		img.src = imgData;
	},

	_onPanelChildClose: function(parentId) {
		this._removeChild(parentId);
		// $('#' + parentId + '-floating').remove();
		// remove any extra height allocated for the parent container
		var canvasHeight = document.getElementById(parentId + '-canvas').height;
		$('#' + parentId).height(canvasHeight + 'px');
	},

	_onPanelClose: function(id, notifyBackend) {
		if (notifyBackend)
			this._sendCloseWindow(id);
		$('#' + this._toStrId(id)).remove();
		var sidebar = L.DomUtil.get(this._currentDeck.strId);
		if (sidebar)
			sidebar.style.width = '0px';
		var docContainer = this._map.options.documentContainer;
		docContainer.style.right = '0px';
		var spreadsheetRowColumnFrame = L.DomUtil.get('spreadsheet-row-column-frame');
		if (spreadsheetRowColumnFrame)
			spreadsheetRowColumnFrame.style.right = '0px';
		this._map.focus();
		this._currentDeck = null;
	},

	_postWindowMouseEvent: function(type, winid, x, y, count, buttons, modifier) {
		this._map._socket.sendMessage('windowmouse id=' + winid +  ' type=' + type +
		                              ' x=' + x + ' y=' + y + ' count=' + count +
		                              ' buttons=' + buttons + ' modifier=' + modifier);
	},

	_postWindowCompositionEvent: function(winid, type, text) {
		this._map._docLayer._postCompositionEvent(winid, type, text);
	},

	_postWindowKeyboardEvent: function(winid, type, charcode, keycode) {
		this._map._socket.sendMessage('windowkey id=' + winid + ' type=' + type +
		                              ' char=' + charcode + ' key=' + keycode);
	},

	_updateDialogCursor: function(dlgId, x, y, height) {
		var strDlgId = this._toStrId(dlgId);
		var dialogCursor = L.DomUtil.get(strDlgId + '-cursor');
		L.DomUtil.setStyle(dialogCursor, 'height', height + 'px');
		L.DomUtil.setStyle(dialogCursor, 'display', this._currentDeck.cursor.cursorVisible ? 'block' : 'none');
		// set the position of the cursor container element
		L.DomUtil.setStyle(this._currentDeck.cursor, 'left', x + 'px');
		L.DomUtil.setStyle(this._currentDeck.cursor, 'top', y + 'px');

		// update the input as well
		this._updateDialogInput(dlgId);
	},

	_createDialogCursor: function(dialogId) {
		this._currentDeck.cursor = L.DomUtil.create('div', 'sidebar-cursor-container', L.DomUtil.get(dialogId));
		var cursor = L.DomUtil.create('div', 'leaflet-cursor lokdialog-cursor', this._currentDeck.cursor);
		cursor.id = dialogId + '-cursor';
		L.DomUtil.addClass(cursor, 'blinking-cursor');
	},

	_createDialogInput: function(dialogId) {
		var clipDlgContainer = L.DomUtil.create('div', 'clipboard-container', L.DomUtil.get(dialogId));
		clipDlgContainer.id = dialogId + '-clipboard-container';
		var dlgTextArea = L.DomUtil.create('input', 'clipboard', clipDlgContainer);
		dlgTextArea.setAttribute('type', 'text');
		dlgTextArea.setAttribute('autocorrect', 'off');
		dlgTextArea.setAttribute('autocapitalize', 'off');
		dlgTextArea.setAttribute('autocomplete', 'off');
		dlgTextArea.setAttribute('spellcheck', 'false');
		this._currentDeck.input = dlgTextArea;

		return dlgTextArea;
	},

	_updateDialogInput: function(dlgId) {
		if (!this._currentDeck.input)
			return;

		var strDlgId = this._toStrId(dlgId);
		var left = parseInt(L.DomUtil.getStyle(this._currentDeck.cursor, 'left'));
		var top = parseInt(L.DomUtil.getStyle(this._currentDeck.cursor, 'top'));
		var dlgContainer = L.DomUtil.get(strDlgId + '-clipboard-container');
		L.DomUtil.setPosition(dlgContainer, new L.Point(left, top));
	},

	focus: function(dlgId) {
		if (!this._isOpen(dlgId) || !this._currentDeck.input)
			return;

		this._currentDeck.input.focus();
	},

	_isRectangleValid: function(rect) {
		rect = rect.split(',');
		return (parseInt(rect[0]) >= 0 && parseInt(rect[1]) >= 0 &&
				parseInt(rect[2]) >= 0 && parseInt(rect[3]) >= 0);
	},
});

L.control.sidebar = function (options) {
	return new L.Control.Sidebar(options);
};