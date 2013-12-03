(function(){

var editor;

editor_module("editor range", {
    setup: function() {
        editor = $("#editor-fixture").data("kendoEditor");
    }
});

function getRange() {
    return editor.createRange(document);
}


function getRangeFromHtml(html) {
    var editor = getEditor();

    editor.value(html);

    var range = editor.createRange();
    range.setStartBefore(editor.body.firstChild);
    range.setEndAfter(editor.body.lastChild);

    return range;
}

test("range creation", function() {
    var range = editor.createRange();

    equal(range.startContainer, editor.document);
    equal(range.endContainer, editor.document);
    equal(range.commonAncestorContainer, editor.document);
    equal(range.startOffset, 0);
    equal(range.endOffset, 0);
    equal(range.collapsed, true);
});

test("setStart setEnd within the same text node", function() {
    editor.value("this is only a test of the <span>emergency</span> <em>broadcast</em> system");

    var range = editor.createRange();

    range.setStart(editor.body.firstChild, 2);
    range.setEnd(editor.body.firstChild, 10);

    equal(range.startContainer, editor.body.firstChild);
    equal(range.endContainer, editor.body.firstChild);
    equal(range.commonAncestorContainer, editor.body.firstChild);
    equal(range.startOffset, 2);
    equal(range.endOffset, 10);
    equal(range.collapsed, false);
});

test("setStart setEnd collapsing", function() {
    editor.value("this is only a test of the <span>emergency</span> <em>broadcast</em> system");

    var range = editor.createRange();

    range.setStart(editor.body.firstChild, 4);
    range.setEnd(editor.body.firstChild, 4);

    equal(range.collapsed, true);
});

test("setStart setEnd in different containers", function() {
    editor.value("this is only a test of the <span>emergency</span> <em>broadcast</em> system");

    var range = editor.createRange();

    range.setStart(editor.body.childNodes[1].firstChild, 2);
    range.setEnd(editor.body.childNodes[3].firstChild, 3);

    equal(range.commonAncestorContainer, editor.body);
});

test("setStart setEnd in nested containers", function() {
    editor.value("this is only a test of the <span>emergency</span> <em>broadcast</em> system");

    var range = editor.createRange();

    range.setStart(editor.body.firstChild, 2);
    range.setEnd(editor.body.childNodes[1].firstChild, 3);

    equal(range.commonAncestorContainer, editor.body);
});

test("selectNode selects node", function() {
    editor.value("<strong>foo</strong>");

    var range = editor.createRange();

    range.selectNode(editor.body.firstChild);

    equal(range.commonAncestorContainer, editor.body);

    equal(range.startContainer, editor.body);
    equal(range.endContainer, editor.body);
    equal(range.startOffset, 0);
    equal(range.endOffset, 1);
});

test("selectNodeContents selects node contents", function() {
    editor.value("<strong>foo</strong>");

    var range = editor.createRange();

    range.selectNodeContents(editor.body.firstChild);

    equal(range.commonAncestorContainer, editor.body.firstChild);

    equal(range.startContainer, editor.body.firstChild);
    equal(range.endContainer, editor.body.firstChild);
    equal(range.startOffset, 0);
    equal(range.endOffset, 1);
});

test("selectNodeContents on img", function() {
    editor.value("<img src='foo' />");

    var range = editor.createRange();

    range.selectNodeContents(editor.body.firstChild);

    equal(range.commonAncestorContainer, editor.body.firstChild);
    equal(range.startContainer, editor.body.firstChild);
    equal(range.endContainer, editor.body.firstChild);
    equal(range.startOffset, 0);
    equal(range.endOffset, 0);

    range.collapse(true);

    equal(range.commonAncestorContainer, editor.body.firstChild);
    equal(range.startContainer, editor.body.firstChild);
    equal(range.endContainer, editor.body.firstChild);
    equal(range.startOffset, 0);
    equal(range.endOffset, 0);
});

test("insertNode on expanded range in text element", function() {
    editor.value("foo");

    var range = editor.createRange();
    range.setStart(editor.body.firstChild, 1);
    range.setEnd(editor.body.firstChild, 2);

    range.insertNode(editor.document.createElement("span"));

    equal(editor.value(), "f<span></span>oo");
});

test("insertNode on expanded range inserts node at start", function() {
    editor.value("<p>foo</p>");

    var range = editor.createRange();
    range.selectNode(editor.body.firstChild);

    range.insertNode(editor.document.createElement("span"));

    equal(editor.value(), "<span></span><p>foo</p>");
});

test("insertNode on collapsed range at end of text element", function() {

    editor.value("foo<br />");

    var range = editor.createRange();
    range.setStart(editor.body.firstChild, 3);
    range.setEnd(editor.body.firstChild, 3);

    range.insertNode(editor.document.createElement("span"));

    equal(editor.value(), "foo<span></span><br />");
});

test("extractContents on text node", function() {
    editor.value("foobar");

    var range = editor.createRange();

    range.setStart(editor.body.firstChild, 3);
    range.setEnd(editor.body.firstChild, 5);

    var contents = range.extractContents();

    equal(contents.firstChild.nodeValue, "ba");
    equal(editor.value(), "foor");
});

test("extractContents extracts tags", function() {
    editor.value("foo<strong>bar</strong>");

    var range = editor.createRange();

    range.setStart(editor.body.lastChild.firstChild, 1);
    range.setEndAfter(editor.body.lastChild);

    var contents = range.extractContents();

    equal(contents.childNodes.length, 1);
    equal(contents.firstChild.tagName.toLowerCase(), "strong");
    equal(contents.firstChild.innerHTML.toLowerCase(), "ar");
    equal(editor.value(), "foo<strong>b</strong>");
});

test("extractContents after range manipulation", function() {
    editor.value("foo<strong>bar</strong>");

    var range = editor.createRange();

    range.setStart(editor.body.firstChild, 0);
    range.setEnd(editor.body.firstChild, 2);

    range = range.cloneRange();
    range.collapse(false);
    range.setEndAfter(editor.body.lastChild);

    var contents = range.extractContents();

    equal(editor.value(), "fo");
    equal(contents.childNodes.length, 2);
    equal(contents.firstChild.nodeValue, "o");
    equal(contents.lastChild.tagName.toLowerCase(), "strong");
    equal(contents.lastChild.firstChild.nodeValue, "bar");
});

test("extractContents updates original range when container is element node", function() {
    var range = createRangeFromText(editor, "<strong>|fo|o</strong>");

    var marker = new kendo.ui.editor.Marker();
    marker.add(range);

    var leftRange = range.cloneRange();
    leftRange.collapse(true);
    leftRange.setStartBefore(editor.body.firstChild);
    leftRange.extractContents();

    equal(range.startContainer, editor.body.firstChild);
    equal(range.endContainer, editor.body.firstChild);
    equal(range.startOffset, 0);
    equal(range.endOffset, 3);
});

test("extractContents updates original range when whole text element is removed", function() {
    editor.value("<p>foo</p><p>bar<a></a>baz</p>")
    var range = editor.createRange();
    var anchor = editor.body.lastChild.childNodes[1];
    range.selectNode(anchor);

    var leftRange = range.cloneRange();
    leftRange.collapse(true);
    leftRange.setStartBefore(anchor.parentNode);

    leftRange.extractContents();

    equal(range.startContainer, editor.body.lastChild);
    equal(range.endContainer, editor.body.lastChild);
    equal(range.startOffset, 0);
    equal(range.endOffset, 1);
});

test("extractContents does not update original range when outside range", function() {
    editor.value("<p>foo</p><p>bar<strong>baz</strong>foo</p>")
    var range = editor.createRange();
    var anchor = editor.body.lastChild.childNodes[1];
    range.selectNode(anchor);

    var rightRange = range.cloneRange();
    rightRange.collapse(false);
    rightRange.setEndAfter(anchor.parentNode);
    rightRange.extractContents();

    equal(range.startContainer, editor.body.lastChild);
    equal(range.endContainer, editor.body.lastChild);
    equal(range.startOffset, 1);
    equal(range.endOffset, 2);
});

test("setStart to marker after end collapses range to new start", function() {
    var range = createRangeFromText(editor, "|f|oo");

    range.setStart(editor.body.firstChild, 2);

    equal(range.startContainer, editor.body.firstChild);
    equal(range.endContainer, editor.body.firstChild);
    equal(range.commonAncestorContainer, editor.body.firstChild);
    equal(range.startOffset, 2);
    equal(range.endOffset, 2);
    equal(range.collapsed, true);
});

test("setEnd to marker before start collapses range to new end", function() {
    var range = createRangeFromText(editor, "fo|o|");

    range.setEnd(editor.body.firstChild, 1);

    equal(range.startContainer, editor.body.firstChild);
    equal(range.endContainer, editor.body.firstChild);
    equal(range.commonAncestorContainer, editor.body.firstChild);
    equal(range.startOffset, 1);
    equal(range.endOffset, 1);
    equal(range.collapsed, true);
});

test("setStart validation across nested containers", function() {
    var range = createRangeFromText(editor, "<div><span>f|oo</span><span>ba|r</span></div>");

    range.setStart(editor.body.firstChild, 2);

    equal(range.startContainer, editor.body.firstChild);
    equal(range.endContainer, editor.body.firstChild);
    equal(range.commonAncestorContainer, editor.body.firstChild);
    equal(range.startOffset, 2);
    equal(range.endOffset, 2);
    equal(range.collapsed, true);
});

test("setStart validation across sibling containers", function() {
    var range = createRangeFromText(editor, "<span>f|oo</span><span>ba|r</span><span>baz</span");

    range.setStart(editor.body.lastChild.firstChild, 2);

    equal(range.startContainer, editor.body.lastChild.firstChild);
    equal(range.endContainer, editor.body.lastChild.firstChild);
    equal(range.commonAncestorContainer, editor.body.lastChild.firstChild);
    equal(range.startOffset, 2);
    equal(range.endOffset, 2);
    equal(range.collapsed, true);
});

test("setEnd validation across nested containers", function() {
    var range = createRangeFromText(editor, "<div><span>f|oo</span><span>ba|r</span></div>");

    range.setEnd(editor.body.firstChild, 0);

    equal(range.startContainer, editor.body.firstChild);
    equal(range.endContainer, editor.body.firstChild);
    equal(range.commonAncestorContainer, editor.body.firstChild);
    equal(range.startOffset, 0);
    equal(range.endOffset, 0);
    equal(range.collapsed, true);
});

test("setEnd validation across sibling containers", function() {
    var range = createRangeFromText(editor, "<span>foo</span><span>ba|r</span><span>ba|z</span");

    range.setEnd(editor.body.firstChild.firstChild, 2);

    equal(range.startContainer, editor.body.firstChild.firstChild);
    equal(range.endContainer, editor.body.firstChild.firstChild);
    equal(range.commonAncestorContainer, editor.body.firstChild.firstChild);
    equal(range.startOffset, 2);
    equal(range.endOffset, 2);
    equal(range.collapsed, true);
});

test("setEndAfter validation across sibling containers", function() {
    editor.value("<p>foo<strong>bar</strong>baz<br />foo<em>bar</em>baz<br />foo</p>");

    var range = editor.createRange();

    range.setStart(editor.body.firstChild.childNodes[1], 1);
    range.setEnd(editor.body.firstChild.childNodes[5], 1);

    range.collapse(false);
    range.setEndAfter(editor.body.firstChild.childNodes[1]);

    equal(range.startContainer, editor.body.firstChild);
    equal(range.endContainer, editor.body.firstChild);
    equal(range.commonAncestorContainer, editor.body.firstChild);
    equal(range.startOffset, 2);
    equal(range.endOffset, 2);
    equal(range.collapsed, true);
});

test("getRange returns body when editor is empty", function() {
    editor.value("");
    editor.focus();

    var range = editor.getRange();

    equal(range.startContainer, editor.body);
    equal(range.endContainer, editor.body);
    equal(range.startOffset, 0);
    equal(range.endOffset, 0);
});

}());
