(function($, undefined) {

var kendo = window.kendo,
    Class = kendo.Class,
    extend = $.extend,
    Editor = kendo.ui.editor,
    dom = Editor.Dom,
    RangeUtils = Editor.RangeUtils,
    EditorUtils = Editor.EditorUtils,
    Command = Editor.Command,
    Tool = Editor.Tool,
    ToolTemplate = Editor.ToolTemplate,
    InlineFormatter = Editor.InlineFormatter,
    InlineFormatFinder = Editor.InlineFormatFinder,
    textNodes = RangeUtils.textNodes,
    registerTool = Editor.EditorUtils.registerTool;

var LinkFormatFinder = Class.extend({
    findSuitable: function (sourceNode) {
        return dom.parentOfType(sourceNode, ["a"]);
    }
});

var LinkFormatter = Class.extend({
    init: function() {
        this.finder = new LinkFormatFinder();
    },

    apply: function (range, attributes) {
        var nodes = textNodes(range),
            markers, doc,
            formatter, a;

        if (attributes.innerHTML) {
            markers = RangeUtils.getMarkers(range);

            doc = RangeUtils.documentFromRange(range);

            range.deleteContents();
            a = dom.create(doc, "a", attributes);
            range.insertNode(a);

            if (dom.name(a.parentNode) == "a") {
                dom.insertAfter(a, a.parentNode);
            }

            if (markers.length > 1) {
                dom.insertAfter(markers[markers.length - 1], a);
                dom.insertAfter(markers[1], a);
                dom[nodes.length > 0 ? "insertBefore" : "insertAfter"](markers[0], a);
            }
        } else {
            formatter = new InlineFormatter([{ tags: ["a"]}], attributes);
            formatter.finder = this.finder;
            formatter.apply(nodes);
        }
    }
});

var UnlinkCommand = Command.extend({
    init: function(options) {
        options.formatter = /** @ignore */ {
            toggle : function(range) {
                new InlineFormatter([{ tags: ["a"]}]).remove(textNodes(range));
            }
        };
        this.options = options;
        Command.fn.init.call(this, options);
    }
});

var LinkCommand = Command.extend({
    init: function(options) {
        var cmd = this;
        cmd.options = options;
        Command.fn.init.call(cmd, options);
        cmd.formatter = new LinkFormatter();
        if (!options.url) {
            cmd.attributes = null;
            cmd.async = true;
        } else {
            this.exec = function() {
                this.formatter.apply(options.range, {
                    href: options.url,
                    innerHTML: options.text || options.url,
                    target: options.target
                });
            };
        }
    },

    _dialogTemplate: function() {
        return kendo.template(
            '<div class="k-editor-dialog k-popup-edit-form k-edit-form-container">' +
                "<div class='k-edit-label'>" +
                    "<label for='k-editor-link-url'>#: messages.linkWebAddress #</label>" +
                "</div>" +
                "<div class='k-edit-field'>" +
                    "<input type='text' class='k-input k-textbox' id='k-editor-link-url'>" +
                "</div>" +
                "<div class='k-edit-label'>" +
                    "<label for='k-editor-link-text'>#: messages.linkText #</label>" +
                "</div>" +
                "<div class='k-edit-field'>" +
                    "<input type='text' class='k-input k-textbox' id='k-editor-link-text'>" +
                "</div>" +
                "<div class='k-edit-label'>" +
                    "<label for='k-editor-link-title'>#: messages.linkToolTip #</label>" +
                "</div>" +
                "<div class='k-edit-field'>" +
                    "<input type='text' class='k-input k-textbox' id='k-editor-link-title'>" +
                "</div>" +
                "<div class='k-edit-label'></div>" +
                "<div class='k-edit-field'>" +
                    "<input type='checkbox' class='k-checkbox' id='k-editor-link-target'>" +
                    "<label for='k-editor-link-target'>#: messages.linkOpenInNewWindow #</label>" +
                "</div>" +
                "<div class='k-edit-buttons k-state-default'>" +
                    '<button class="k-dialog-insert k-button">#: messages.dialogInsert #</button>' +
                    '<button class="k-dialog-close k-button k-secondary">#: messages.dialogCancel #</button>' +
                "</div>" +
            "</div>"
        )({
            messages: this.editor.options.messages
        });
    },

    exec: function () {
        var that = this,
            range = that.getRange(),
            collapsed = range.collapsed,
            nodes,
            initialText = "",
            messages = that.editor.options.messages;

        range = that.lockRange(true);
        nodes = textNodes(range);

        function apply(e) {
            var element = dialog.element,
                href = $("#k-editor-link-url", element).val(),
                title, text, target;

            if (href && href != "http://") {

                if (href.indexOf("@") > 0 && !/^(\w+:)|(\/\/)/i.test(href)) {
                    href = "mailto:" + href;
                }

                that.attributes = { href: href };

                title = $("#k-editor-link-title", element).val();
                if (title) {
                    that.attributes.title = title;
                }

                text = $("#k-editor-link-text", element).val();
                if (!text && !initialText) {
                    that.attributes.innerHTML = href;
                } else if (text && (text !== initialText)) {
                    that.attributes.innerHTML = dom.stripBom(text);
                }

                target = $("#k-editor-link-target", element).is(":checked");
                that.attributes.target = target ? "_blank" : null;

                that.formatter.apply(range, that.attributes);
            }

            close(e);

            if (that.change) {
                that.change();
            }
        }

        function close(e) {
            e.preventDefault();
            dialog.destroy();

            dom.windowFromDocument(RangeUtils.documentFromRange(range)).focus();

            that.releaseRange(range);
        }

        function linkText(nodes) {
            var text = "";

            if (nodes.length == 1) {
                text = nodes[0].nodeValue;
            } else if (nodes.length) {
                text = nodes[0].nodeValue + nodes[1].nodeValue;
            }

            return dom.stripBom(text);
        }

        var a = nodes.length ? that.formatter.finder.findSuitable(nodes[0]) : null;

        var dialog = this.createDialog(that._dialogTemplate(), {
            title: messages.createLink,
            close: close,
            visible: false
        })
            .find(".k-dialog-insert").click(apply).end()
            .find(".k-dialog-close").click(close).end()
            .find(".k-edit-field input").keydown(function (e) {
                var keys = kendo.keys;
                if (e.keyCode == keys.ENTER) {
                    apply(e);
                } else if (e.keyCode == keys.ESC) {
                    close(e);
                }
            }).end()
            // IE < 8 returns absolute url if getAttribute is not used
            .find("#k-editor-link-url").val(a ? a.getAttribute("href", 2) : "http://").end()
            .find("#k-editor-link-text").val(linkText(nodes)).end()
            .find("#k-editor-link-title").val(a ? a.title : "").end()
            .find("#k-editor-link-target").attr("checked", a ? a.target == "_blank" : false).end()
            .data("kendoWindow")
            .center().open();

        if (nodes.length > 0 && !collapsed) {
            initialText = $("#k-editor-link-text", dialog.element).val();
        }

        $("#k-editor-link-url", dialog.element).focus().select();
    },

    redo: function () {
        var that = this,
            range = that.lockRange(true);

        that.formatter.apply(range, that.attributes);
        that.releaseRange(range);
    }

});

var UnlinkTool = Tool.extend({
    init: function(options) {
        this.options = options;
        this.finder = new InlineFormatFinder([{tags:["a"]}]);

        Tool.fn.init.call(this, $.extend(options, {command:UnlinkCommand}));
    },

    initialize: function(ui, options) {
        Tool.fn.initialize.call(this, ui, options);
        ui.addClass("k-state-disabled");
    },

    update: function (ui, nodes) {
        ui.toggleClass("k-state-disabled", !this.finder.isFormatted(nodes))
          .removeClass("k-state-hover");
    }
});

extend(kendo.ui.editor, {
    LinkFormatFinder: LinkFormatFinder,
    LinkFormatter: LinkFormatter,
    UnlinkCommand: UnlinkCommand,
    LinkCommand: LinkCommand,
    UnlinkTool: UnlinkTool
});

registerTool("createLink", new Tool({ key: "K", ctrl: true, command: LinkCommand, template: new ToolTemplate({template: EditorUtils.buttonTemplate, title: "Create Link"})}));
registerTool("unlink", new UnlinkTool({ key: "K", ctrl: true, shift: true, template: new ToolTemplate({template: EditorUtils.buttonTemplate, title: "Remove Link"})}));

})(window.kendo.jQuery);
