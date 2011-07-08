/// <reference path="jquery-1.5-vsdoc.js" />
/*!
*   NMultiSelect - a jQuery plugin
*   Creates a multi selection box.
*   http://ndesoft.dk/
*
*   Version 1.5.2
*
*   Copyright 2011, Nick Frederiksen
*
*   Requires the disableTextSelect plugin from James Dempster
*   http://code.jdempster.com/jQuery.DisableTextSelect/
*
*   This program is free software: you can redistribute it and/or modify
*   it under the terms of the GNU General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.
*
*   This program is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU General Public License for more details.
*
*   You should have received a copy of the GNU General Public License
*   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
*/
(function ($) {

    $.NMultiSelect = { Instances: 0 };
    $.fn.NMultiSelect = function (options) {
        /// <summary>Transforms the first element in the jQuery selection to an NMultiSelection box.
        /// </summary>
        /// <param name="options" type="Object">Name of the hidden field, which value is being passed to the server on post or get.</param>
        /// <return type="NMultiSelect" />

        if (this.length > 1) {
            // We only wan't to use the first element:
            return this.first().NMultiSelect(options);
        } else {

            $.NMultiSelect.Instances++;
            var settings = {
                Name: "NMultiSelect_" + $.NMultiSelect.Instances,
                Move: true,
                FilterText: "filter", // Set to null to disable filters
                AvailableText: "Available items:",
                SelectedText: "Selected items:",
				EnableAddAll: true,
				EnableRemoveAll: true,
				EnableMultiSelect: true,
                Height: 150,
                Width: 150,
                FadeSpeed: "fast", // How fast would we wan't the fading to go?
                TitleTag: "h2", // What tag should be surrounding our box title?
                Title: null, // Our box title, if null, the box title is not shown.
                SelectionLimit: -1 // -1 unlimited selections.
            },

            // vars:
            selectionChangedCallBack = null,
            items = new Array(),
            myForm = this.closest("form"),

            // Create elements:
            leftContainer = $("<div />"),
            rightContainer = $("<div />"),
            fromContainer = $("<div />"),
            toContainer = $("<div />"),
            from = $("<div />"),
            to = $("<div />"),
            buttonContainer = $("<div/>"),
            finish = $("<div style=\"clear:both;\"/>"),
            fixButtonAlignment = $("<label>&nbsp;</label>"),
            title = $("<" + settings.TitleTag + "/>"),

            selection = $("<input type=\"hidden\" />"),
            add = $("<a>&gt;</a>"),
            addAll = $("<a>&gt;&gt;</a>"),
            remove = $("<a>&lt;</a>"),
            removeAll = $("<a>&lt;&lt;</a>"),

            filterFrom = $("<input type=\"text\">"),
            filterTo = $("<input type=\"text\">"),

            availableLabel = $("<label/>"),
            selectedLabel = $("<label/>"),



            // Selection limit, based on selection
            _getSelectionLimit = function () {
                /// <summary>Gets the dif. between the selected items count and the limit.
                /// </summary>
                /// <return type="int" />
                var selection = _getItemsInTo();
                return settings.SelectionLimit - selection.length;
            },

            // Get:
             _getSelection = function () {
                 /// <summary>Gets the currently selected items in the left box.
                 /// Except those that has already been selected and put in the right box.
                 /// </summary>
                 /// <return type="jQuery" />

                 return from.find('a.selected').slice(0, _getSelectionLimit());
             },

             _getAll = function (onlyVisible) {
                 /// <summary>Gets all items in the left box.
                 /// Except those that has already been selected and put in the right box.
                 /// </summary>
                 /// <return type="jQuery" />
                 var tmp = from.find('a');
                 if (onlyVisible === true) {
                     tmp = from.find("a:visible");
                 }

                 return tmp.slice(0, _getSelectionLimit());
             },

             _clearSelected = function () {
                 /// <summary>Clears selection in the left box.
                 /// </summary>
                 /// <return type="jQuery" />
                 return from.find('a.selected').removeClass("selected");
             },

             _getItemsInTo = function (onlyVisible) {
                 /// <summary>Gets all items in the right box.
                 /// Except those that has already been selected and put in the left box.
                 /// </summary>
                 /// <return type="jQuery" />
                 var tmp = to.find('a');
                 if (onlyVisible === true) {
                     tmp = to.find("a:visible");
                 }
                 return tmp;
             },

             _getSelectedInTo = function () {
                 /// <summary>Gets the currently selected items in the right box.
                 /// Except those that has already been selected and put in the left box.
                 /// </summary>
                 /// <return type="jQuery" />
                 return to.find('a.selected');
             },

            // Special functions:
             _isInSelection = function (item) {
                 /// <summary>Returns true, if the passed item has been selected and put in the right box.
                 /// </summary>
                 /// <param name="item" type="anchor">Item to look for in the right box.</param>
                 /// <return type="bool" />
                 var res = false,

                inSelection = _getItemsInTo();
                 inSelection.each(function (index, value) {
                     if ($(value).attr("value") == item) {
                         res = true;
                     }
                 });

                 return res;
             },


            // Special functions:
             _showHideFromFilter = function (list, filter) {
                 /// <summary>Hides all elements, escept those containing the filter text.
                 /// </summary>
                 /// <param name="list" type="jQuery">List of items to show or hide.</param>
                 /// <param name="filter" type="string">Text to filter by.</param>

                 list.removeClass("selected");

                 if (filter !== "" && filter !== settings.FilterText) {

                     var contains = list.filter(function (index) {
                         var text = $(this).text().toLowerCase();
                         return text.indexOf(filter.toLowerCase()) > -1;
                     }),
                    containsNot = list.filter(function (index) {
                        var text = $(this).text().toLowerCase();
                        return text.indexOf(filter.toLowerCase()) == -1;
                    });

                     contains.slideDown(settings.FadeSpeed);
                     containsNot.slideUp(settings.FadeSpeed);
                 } else {
                     list.slideDown(settings.FadeSpeed);
                 }
             },

             _clearFilter = function () {
                 // <summary>Clears the filter boxes, and resets the default values.</summary>
                 filterFrom.val(settings.FilterText);
                 filterTo.val(settings.FilterText);
                 filterFrom.removeClass("focus");
                 filterTo.removeClass("focus");
                 _showHideFromFilter(_getAll(), "");
                 _showHideFromFilter(_getItemsInTo(), "");
             },

             _updateSelection = function (me, hideEvent) {
                 /// <summary>Updates the hiddenfield with the currently selected values.
                 /// </summary>
                 /// <param name="me" type="jQuery">Hack to get the owner jQuery object.</param>
                 /// <param name="hideEvent" type="bool">When true, the SelectionChanged-event won't fire.</param>
                 var values = new Array(),
                sel = '';

                 _getItemsInTo().each(function (index, value) {
                     var val = $(value).attr("value");
                     if (sel.length > 0) {
                         sel += ',';
                     }
                     sel += val;
                     values.push(new NMultiSelectValue(val, $(value).text(), true));
                 });
                 selection.val(sel);

                 me.data('values', { Items: items, Selection: values });

                 if (selectionChangedCallBack !== null && hideEvent !== true) {
                     try {
                         selectionChangedCallBack(me.data('values'));
                     } catch (ex) {
                         alert("An error occured while trying to execute the callback function:\r\n" + ex);
                     }
                 }
                 _clearFilter();
             },

             _bindItemEvents = function (container, item, func) {
                 /// <summary>Unbinds existing event handlers, and binds new ones.
                 /// </summary>
                 /// <param name="container" type="jQuery">Hack to get the owner jQuery object.</param>
                 /// <param name="hideEvent" type="jQuery">Item(s) on which to rebind event handlers.</param>
                 /// <param name="hideEvent" type="code">Code to execute when events are being fired.</param>
                 item.unbind("click.multiselect");
                 item.unbind("dblclick.multiselect");

                 item.bind("click.multiselect", _item_click);
                 item.bind('dblclick.multiselect', { container: container }, func);
             },

            // Event handlers:
             _fromBox_dblClick = function (e) {
                 /// <summary>Event handler being fired when an item in the left box are being dobble clicked or when the
                 /// add selection button is being clicked.
                 /// </summary>
                 $(this).toggleClass("selected");
                 e.data.container.AddSelection();
             },
             _toBox_dblClick = function (e) {
                 /// <summary>Event handler being fired when an item in the right box are being dobble clicked or when the
                 /// remove selection button is being clicked.
                 /// </summary>
                 $(this).toggleClass("selected");
                 e.data.container.RemoveSelection();
             },
             _addAll_Click = function (e) {
                 /// <summary>Event handler being fired when the add all button is being clicked.
                 /// </summary>
                 e.data.container.AddAll();
             },
             _removeAll_Click = function (e) {
                 /// <summary>Event handler being fired when the remove all button is being clicked.
                 /// </summary>
                 e.data.container.RemoveAll();
             },
             _item_click = function (e) {
                 /// <summary>Event handler being fired when item is being clicked.
                 /// </summary>
				 if (!settings.EnableMultiSelect){
					from.find('a.selected').toggleClass("selected");
					to.find('a.selected').toggleClass("selected");
				 }
				 
                 $(this).toggleClass("selected");
             },

             _filterBox_focus = function (e) {
                 /// <summary>Event handler being fired when a filter box is focused.
                 /// </summary>
                 var me = $(this),
                text = jQuery.trim(me.val());
                 if (text == settings.FilterText) {
                     me.addClass("focus");
                     me.val("");
                 }
             },

             _filterBox_blur = function (e) {
                 /// <summary>Event handler being fired when a filter box is blurred.
                 /// </summary>
                 var me = $(this),
                text = jQuery.trim(me.val());
                 if (text === settings.FilterText || text === "") {
                     me.removeClass("focus");
                     me.val(settings.FilterText);
                 }
             },

             _filterFrom_keyUp = function (e) {
                 /// <summary>Event handler being fired when a keypress has occurred on the filterFrom box.
                 /// </summary>
                 var all = _getAll(),
                filter = $(this).val();

                 _showHideFromFilter(all, filter);

             },

             _filterTo_keyUp = function (e) {
                 /// <summary>Event handler being fired when a keypress has occurred on the filterTo box.
                 /// </summary>
                 var all = _getItemsInTo(),
                filter = $(this).val();
                 _showHideFromFilter(all, filter);

             },

             _myForm_submit = function (e) {
                 // <summary>Cleans up our form, so we don't post back irrelevant data.</summary>
                 filterFrom.remove();
                 filterTo.remove();
             };


            // Set defaults:
            if (options) {
                $.extend(settings, options);
            }

            // Set infinity:
            if (settings.SelectionLimit == -1) {
                settings.SelectionLimit = Infinity;
            }

            // Set properties:
            selection.attr("name", settings.Name);
            selection.attr("id", settings.Name);
            filterFrom.attr("name", settings.Name + "-filter-from");
            filterFrom.attr("id", settings.Name + "-filter-from");
            filterTo.attr("name", settings.Name + "-filter-to");
            filterTo.attr("id", settings.Name + "-filter-to");
            filterFrom.attr("value", settings.FilterText);
            filterTo.attr("value", settings.FilterText);
            add.attr("href", "javascript:void(0);");
            addAll.attr("href", "javascript:void(0);");
            remove.attr("href", "javascript:void(0);");
            removeAll.attr("href", "javascript:void(0);");
            availableLabel.text(settings.AvailableText);
            selectedLabel.text(settings.SelectedText);
            title.text(settings.Title);

            // Disallow text select:
            try {
                from.disableTextSelect();
                to.disableTextSelect();
            } catch (ex) {
                if (typeof (console) !== 'undefined' && console !== null) {
                    console.error(ex);
                }
            }

            // Set CSS classes:		
            this.addClass("multiselect");
            from.addClass("select");
            to.addClass("select");
            fromContainer.addClass("selectContainer");
            toContainer.addClass("selectContainer");
            leftContainer.addClass("Container");
            rightContainer.addClass("Container");
            buttonContainer.addClass("Buttons");
            add.addClass("Add");
            addAll.addClass("AddAll");
            remove.addClass("Remove");
            removeAll.addClass("RemoveAll");
            filterTo.addClass("FilterBox");
            filterFrom.addClass("FilterBox");

            // Set CSS:
            fromContainer.css({ width: settings.Width + "px", height: settings.Height + "px" });
            toContainer.css({ width: settings.Width + "px", height: settings.Height + "px" });


            // Bind event handlers:
            add.bind('click.multiselect', { container: this }, _fromBox_dblClick); 
			remove.bind('click.multiselect', { container: this }, _toBox_dblClick);
			myForm.bind("submit.multiselect", { container: this }, _myForm_submit);
			if (settings.EnableAddAll){
				addAll.bind('click.multiselect', { container: this }, _addAll_Click);
			}
			if (settings.EnableRemoveAll){
				removeAll.bind('click.multiselect', { container: this }, _removeAll_Click);
			}
			if (settings.FilterText !== null){
				filterFrom.bind("focus.multiselect", { container: this }, _filterBox_focus);
				filterTo.bind("focus.multiselect", { container: this }, _filterBox_focus);
				filterFrom.bind("blur.multiselect", { container: this }, _filterBox_blur);
				filterTo.bind("blur.multiselect", { container: this }, _filterBox_blur);

				filterFrom.bind("keyup.multiselect", { container: this }, _filterFrom_keyUp);
				filterTo.bind("keyup.multiselect", { container: this }, _filterTo_keyUp);
			}

            // Append items:
            if (settings.Title !== null) {
                this.append(title);
            }
            this.append(leftContainer);
            this.append(buttonContainer);
            this.append(rightContainer);

            leftContainer.append(availableLabel);
            rightContainer.append(selectedLabel);

            leftContainer.append(fromContainer);
            rightContainer.append(toContainer);

			if (settings.FilterText !== null){
				fromContainer.append(filterFrom);
				toContainer.append(filterTo);
			}
            fromContainer.append(from);
            toContainer.append(to);

            buttonContainer.append(fixButtonAlignment);
            buttonContainer.append(add);	
			if (settings.EnableAddAll){
				buttonContainer.append(addAll);
			}
			if (settings.EnableRemoveAll){
				buttonContainer.append(removeAll);
			}
            buttonContainer.append(remove);
            buttonContainer.append(selection);
            this.append(finish);

            /* Public functions: */
            // Add:
            this.AddSelection = function () {
                /// <summary>Adds the currently selected items in the left box, to the items in the right box.
                /// Except for those already there.
                /// </summary>

                var me = this,
                selected = _getSelection(),
                clone = null,

                amount = selected.length,
                tmpAmount = amount;

                selected.removeClass("selected");
                if (settings.Move !== true) {
                    selected = selected.filter(function (index) {
                        return !_isInSelection($(this).attr("value"));
                    });
                    amount = selected.length;
                    clone = selected.clone();
                    clone.hide();
                    _bindItemEvents(this, clone, _toBox_dblClick);
                    to.append(clone);
                    clone.fadeIn(settings.FadeSpeed, function () {
                        $(this).removeAttr("style");
                        amount--;
                        if (amount === 0) {
                            _updateSelection(me);
                        }
                    });
                }
                else {
                    _bindItemEvents(this, selected, _toBox_dblClick);
                    selected.fadeOut(settings.FadeSpeed, function () {
                        amount--;
                        if (amount === 0) {
                            to.append(selected);
                            selected.fadeIn(settings.FadeSpeed, function () {
                                tmpAmount--;
                                if (tmpAmount === 0) {
                                    _updateSelection(me);
                                }
                            });
                        }
                    });
                }
                _clearSelected();
            };

            this.AddAll = function () {
                /// <summary>Adds all items in the left box, to the items in the right box.
                /// Except for those already there.
                /// </summary>
                var all = _getAll(true),
                me = this,
                clone = null,
                amount = all.length,
                tmpAmount = amount;

                all.removeClass("selected");

                if (settings.Move !== true) {
                    all = all.filter(function (index) {
                        return !_isInSelection($(this).attr("value"));
                    });
                    amount = all.length;
                    clone = all.clone();
                    clone.hide();
                    _bindItemEvents(this, clone, _toBox_dblClick);
                    to.append(clone);
                    clone.fadeIn(settings.FadeSpeed, function () {
                        $(this).removeAttr("style");
                        amount--;
                        if (amount === 0) {
                            _updateSelection(me);
                        }
                    });
                }
                else {
                    _bindItemEvents(this, all, _toBox_dblClick);
                    all.fadeOut(settings.FadeSpeed, function () {
                        amount--;
                        if (amount === 0) {
                            to.append(all);
                            all.fadeIn(settings.FadeSpeed, function () {
                                tmpAmount--;
                                if (tmpAmount === 0) {
                                    _updateSelection(me);
                                }
                            });
                        }
                    });
                }
                _clearSelected();

            };

            // Remove:
            this.RemoveSelection = function () {
                /// <summary>Remove all selected items in the right box.
                /// </summary>
                var selected = _getSelectedInTo(),
                me = this,

                amount = selected.length,
                tmpAmount = amount;

                selected.removeClass("selected");
                if (settings.Move !== true) {
                    selected.fadeOut(settings.FadeSpeed, function () {
                        selected.remove();
                        _updateSelection(me);
                        amount--;
                        if (amount === 0) {
                            _updateSelection(me);
                        }
                    });
                }
                else {
                    _bindItemEvents(this, selected, _fromBox_dblClick);
                    selected.fadeOut(settings.FadeSpeed, function () {
                        amount--;
                        if (amount === 0) {
                            from.append(selected);
                            selected.fadeIn(settings.FadeSpeed, function () {
                                tmpAmount--;
                                if (tmpAmount === 0) {
                                    _updateSelection(me);
                                }
                            });
                        }
                    });
                    selected.mouseover();
                }
                _clearSelectedInTo();
            };

            this.RemoveAll = function () {
                /// <summary>Remove all items in the right box.
                /// </summary>
                var all = _getItemsInTo(true),
                me = this,

                amount = all.length,
                tmpAmount = amount;

                all.removeClass("selected");
                if (settings.Move !== true) {
                    all.fadeOut(settings.FadeSpeed, function () {
                        all.remove();
                        amount--;
                        if (amount === 0) {
                            _updateSelection(me);
                        }
                    });
                }
                else {
                    _bindItemEvents(this, all, _fromBox_dblClick);
                    all.fadeOut(settings.FadeSpeed, function () {
                        amount--;
                        if (amount === 0) {
                            from.append(all);
                            all.fadeIn(settings.FadeSpeed, function () {
                                tmpAmount--;
                                if (tmpAmount === 0) {
                                    _updateSelection(me);
                                }
                            });
                        }
                    });
                    from.mouseover();
                }
                _clearSelectedInTo();
            };

            // Add items:
            this.AddItemToList = function (value, text, selected) {
                /// <summary>Adds an item to the list(s).
                /// </summary>
                /// <param name="value" type="string">Value to pass to the server on post or get.</param>
                /// <param name="text" type="string">Visible text.</param>
                /// <param name="selected" type="bool">[optional]. When true, the item will be added to the right box.</param>
                items.push(new NMultiSelectValue(value, text, selected));
                var option = $("<a />"),
                clone = null;

                option.attr("value", value);
                option.text(text);
                from.append(option);

                _bindItemEvents(this, option, _fromBox_dblClick);
                if (settings.Move !== true) {
                    if ((selected !== true && selected !== false) ? false : selected) {
                        clone = option.clone();
                        _bindItemEvents(this, clone, _toBox_dblClick);
                        to.append(clone);
                    }
                }
                else {
                    if ((selected !== true && selected !== false) ? false : selected) {

                        _bindItemEvents(this, option, _toBox_dblClick);
                        to.append(option);
                    }
                }

                _updateSelection(this, false);
            };

            // Events:
            this.SelectionChanged = function (callback, fireAtOnce) {
                /// <summary>Subscribe to the SelectionChanged event.
                /// </summary>
                /// <param name="callback" type="code">Code to execute, when the event is being fired.</param>
                selectionChangedCallBack = callback;
                if (fireAtOnce) {
                    _updateSelection(this);
                }
            };

            /* public functions end */

            return this;
        }
        return null;
    };
})(jQuery);

function NMultiSelectValue(value, text, selected) {
    /// <summary>Represents a list item.
    /// </summary>
    /// <param name="value" type="string">Value to pass to the server on post or get.</param>
    /// <param name="text" type="string">Visible text.</param>
    /// <param name="selected" type="bool">[optional]. When true, the item will be added to the right box.</param>
    /// <return type="NMultiSelectValue" />

    this.Value = value;
    this.Text = text;
    this.Selected = (selected !== true && selected !== false) ? false : selected;
}