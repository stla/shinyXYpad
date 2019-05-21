var XYpadBinding = new Shiny.InputBinding();

$.extend(XYpadBinding, {
    find: function (scope) {
        return $(scope).find(".XYpad");
    },
    getValue: function (el) {
        return $(el).getValue();
    },
    setValue: function (el, value) {
        $(el).setValue(value);
    },
    subscribe: function (el, callback) {
        $(el).on("change.XYpadBinding", function (e) {
            callback();
        });
    },
    unsubscribe: function (el) {
        $(el).off(".XYpadBinding");
    },
    receiveMessage: function (el, data) {
        if (data.hasOwnProperty('value'))
            this.setValue(el, data.value);
        if (data.hasOwnProperty('label'))
            $(el).parent().parent().find("[id$=xylabel]").text(data.label);
        if (data.hasOwnProperty('options'))
            $(el).data('setOptions')(data.options);
        $(el).trigger('change');
    },
    initialize: function initialize(el) {
        var $el = $(el);
        $el.xy({
            fgColor: "#222222",
            change: function (value) {
                Shiny.setInputValue(this.$.attr("id"), { x: value[0], y: value[1] });
            }
        });

    }
});

Shiny.inputBindings.register(XYpadBinding);
