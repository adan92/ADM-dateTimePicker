module.provider('ADMdtp', ADMdtp);


    /* @ngInject */
    function ADMdtp() {
        // Provider
        var options = {
            calType: 'gregorian',
            format: 'YYYY/MM/DD hh:mm',
            multiple: true,
            autoClose: false,
            transition: true,
            disabled: [],
            smartDisabling: true
        };

        var ADMdtp = {
            getOptions: function(type) {
                var typeOptions = type && options[type] || options;
                return typeOptions;
            }
        };

        this.setOptions = function(type, customOptions) {
            if (!customOptions) {
                customOptions = type;
                options = angular.extend(options, customOptions);
                return;
            }
            options[type] = angular.extend(options[type] || {}, customOptions);
        };

        this.$get = function() {
            return ADMdtp;
        };

    }

