module.filter('digitType', [ADMdtpDigitTypeFilter]);


     function ADMdtpDigitTypeFilter() {
         return function(input, type) {
             return type=='jalali' ? String(input).toPersianDigits() : input;
         };
    }