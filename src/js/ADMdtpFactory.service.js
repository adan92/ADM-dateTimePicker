module.factory('ADMdtpFactory', ['ADMdtpConvertor', ADMdtpFactory]);

    /* @ngInject */
    function ADMdtpFactory(ADMdtpConvertor) {
        this.dateFormat = function(date, time, format, notView) {
            var year = date.year;
            var halfYear = notView ? date.year : date.year%100;
            var month = date.month.lZero();
            var day = date.day.lZero();
            var hour = time.hour.lZero();
            var minute = time.minute.lZero();

            var replaceMap = [
                {key: 'YYYY', value: year},
                {key: 'YY', value: halfYear},
                {key: 'MM', value: month},
                {key: 'DD', value: day},
                {key: 'hh', value: hour},
                {key: 'mm', value: minute}
            ]

            for(var i=0,j=replaceMap.length;i<j;i++) {
                format = format.replace(replaceMap[i].key, replaceMap[i].value);
            }

            return format;
        };
        this.parseString = function(str, format) {
            var _keys = [], _date = {};
            var formats = ['YY/MM/DD', 'YY/MM/DD hh:mm', 'YY-MM-DD', 'YY-MM-DD hh:mm', 'MM/DD/YY', 'MM-DD-YY', 'MM/DD/YY hh:mm', 'MM-DD-YY hh:mm'];
            formats.unshift(format);

            for(var i=0,j=format.length;i<j;i++) {
                var _isValid = new RegExp(formats[i].replace(/[a-z]+/gi, function(key) {
                    var _mustReplace = false;
                    if (key.indexOf('YY') != -1)
                        _keys.push('year'), _mustReplace=true;
                    else if (key.indexOf('MM') != -1)
                        _keys.push('month'), _mustReplace=true;
                    else if (key.indexOf('DD') != -1)
                        _keys.push('day'), _mustReplace=true;
                    else if (key.indexOf('hh') != -1)
                        _keys.push('hour'), _mustReplace=true;
                    else if (key.indexOf('mm') != -1)
                        _keys.push('minute'), _mustReplace=true;

                    if (_mustReplace)
                        return '[0-9]+';
                    else
                        return key;
                }).replace(/[(]/g, '[(]').replace(/[)]/g, '[)]')).test(str);

                if (!_isValid)
                    continue;

                _keys.reverse();

                str.replace(/[0-9]+/g, function(value) {
                    _date[_keys.pop()] = Number(value);
                    return value;
                });
                _date.hour = _date.hour || 0;
                _date.minute = _date.minute || 0;

                return _date;
            }

            return false;
        };
        this.toRegularFormat = function(date, type, format) {
            if (typeof date == "string")
                date = this.parseString(date, format);
            else if (typeof date == "number")
                date = this.convertFromUnix(date, type);

            if (date.year<=99)
                date.year = ((type == 'jalali') ? 1300+date.year : 2000+date.year);

            return date.year+'/'+date.month.lZero()+'/'+date.day.lZero()+' '+date.hour.lZero()+':'+date.minute.lZero();

        };
        this.isDateEqual = function(date1, date2) {
            var diff = new Date(date1) - new Date(date2);
            return diff==0;
        };
        this.isDateBigger = function(date1, date2) {
            var diff = new Date(date1) - new Date(date2);
            return diff>=0;
        };
        this.isMonthBigger = function(date1, date2) {
            var diff = new Date(date1.year, date1.month) - new Date(date2.year, date2.month);
            return diff>=0;
        };
        this.joinTime = function(date, time) {
            return new Date(new Date(new Date(date).setHours(time.hour)).setMinutes(time.minute));
        };
        this.removeTime = function(date) {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        }
        this.validateJalaliDateSeparate = function(date, time) {
            if (date.length!=3 || time.length!=2)
                return false;

            if (time[0]>23 || time[0]<0 || time[1]>59 || time[1]<0 || date[0]<0 || date[1]<1 || date[1]>12)
                return false;

            if (date[1]>0 && date[1]<7) {
                if (date[2]<1 || date[2]>31)
                    return false;
            }
            else if (date[1]>6 && date[1]<12) {
                if (date[2]<1 || date[2]>30)
                    return false;
            }
            else if (date[1] == 12) {
                var isLeap = ADMdtpConvertor.isLeapJalali(date[0]);
                if ((isLeap && (date[2]<1 || date[2]>30)) || (!isLeap && (date[2]<1 || date[2]>29)))
                    return false;
            }

            return true;
        }
        this.validateJalaliDate = function(input, format) {
            var _dateTime;

            if (typeof input == "number") {
                var _gDate = new Date(input);
                if (_gDate == 'Invalid Date')
                    return false;
                var _pDate = this.convertToJalali(_gDate);
                _dateTime = angular.extend(_pDate, {hour: _gDate.getHours(), minute: _gDate.getMinutes()});
            }
            else if (typeof input == "string")
                _dateTime = this.parseString(input, format);

            else if (input instanceof Object)
                _dateTime = input;

            var _date = [_dateTime.year, _dateTime.month, _dateTime.day];
            var _time = [_dateTime.hour, _dateTime.minute];

            if (this.validateJalaliDateSeparate(_date, _time)) {
                var _gDateC = ADMdtpConvertor.toGregorian(_date[0],_date[1],_date[2]);
                var _gDate = new Date(_gDateC.year, _gDateC.month-1, _gDateC.day, _time[0], _time[1]);

                return {
                    year: _date[0],
                    month: _date[1],
                    day: _date[2],
                    hour: _time[0],
                    minute: _time[1],
                    unix: _gDate.getTime(),
                    gDate: _gDate
                }
            }
            return false;

        };
        this.convertToUnix = function(value, type, format) {
            if (!value)
                return null;
            if (typeof value == "number")
                return value;

            if (typeof value == "string") {
                value = this.parseString(value, format);
            }
            else if (value instanceof Date)
                value = {year: value.getFullYear(), month: value.getMonth()+1, day: value.getDate(), hour: value.getHours(), minute: value.getMinutes()};
            else
                return null;

            if (value.year<=99)
                value.year = ((type == 'jalali') ? 1300+value.year : 2000+value.year);


            if (type == 'jalali') {
                var _dateTime = this.validateJalaliDate(value, format);
                return _dateTime.unix || null;
            }
            else if (type == 'gregorian') {
                var _dateTime = new Date(this.toRegularFormat(value, type));
                return (_dateTime=='Invalid Date')?null:_dateTime.getTime();
            }

            return null;
        };
        this.convertFromUnix = function(unix, type) {
            var _gDate = new Date(unix);
            if (type == 'jalali')
                return this.convertToJalali(_gDate);
            else if (type == 'gregorian')
                return {
                    year: _gDate.getFullYear(),
                    month: _gDate.getMonth()+1,
                    day: _gDate.getDate(),
                    unix: unix
                };
        };
        this.convertToJalali = function(date) {

            if (date instanceof Date) {
                var _date = {
                    year: date.getFullYear(),
                    month: date.getMonth()+1,
                    day: date.getDate(),
                    unix: date.getTime()
                }
                date = _date;
            }
            if (date instanceof Object) {
                return angular.extend(ADMdtpConvertor.toJalali(date.year, date.month, date.day), {unix: date.unix});
            }
        };
        this.parseDisablePattern = function(options) {
            var arr = options.disabled, smart = options.smartDisabling, calType = options.calType, format = options.format;

            var _inWeek = Array.apply(null, Array(7)).map(Number.prototype.valueOf,0);
            var _inMonth = Array.apply(null, Array(31)).map(Number.prototype.valueOf,0);
            var _static = {};

            if (arr instanceof Array) {
                for (var i=0,j=arr.length; i<j; i++) {
                    if (typeof arr[i] == "number") {
                        var _gDate = new Date(arr[i]);
                        if (_gDate != 'Invalid Date')
                            _static[this.removeTime(_gDate).getTime()] = true;
                    }
                    else if (typeof arr[i] == "string") {
                        arr[i] = arr[i].toLowerCase();
                        if (arr[i].indexOf('d') == -1 && arr[i].indexOf('i') == -1) {
                            var _unix = this.convertToUnix(arr[i], calType, format);
                            if (_unix)
                                _static[_unix] = true;
                        }
                        else {
                            var _inMonthValid = new RegExp("^[!]?(([0-9]?[0-9])?[d]([+][0-9][0-9]?)?)([&]([0-9]?[0-9])?[d]([+][0-9][0-9]?)?)*?$").test(arr[i]);
                            var _inWeekhValid = new RegExp("^[!]?([i]([+][0-9][0-9]?)?)([&][i]([+][0-9][0-9]?)?)*?$").test(arr[i]);

                            if (_inMonthValid || _inWeekhValid) {
                                var _not = arr[i][0]=='!';
                                arr[i] = _not?arr[i].split('!')[1]:arr[i];
                                var _patt = arr[i].split('&');

                                if (_inMonthValid) {
                                    var _tmpObj = {};
                                    _patt.forEach(function(item) {
                                        var _params = item.split(/d[+]?/).map(function(str) {return Number(str);});
                                        _params[0] = _params[0]?_params[0]:1;
                                        _params[1]%=31;

                                        for (var k=0; k<31; k++) {
                                            if (_params[0]!=1 && k%_params[0] == _params[1] || _params[0]==1 && k==_params[1])
                                                _tmpObj[k] = 1;
                                        }
                                    });
                                    for (var k=0; k<31; k++) {
                                        if (_not) {
                                            if (!_tmpObj[k])
                                                _inMonth[k] = 1;
                                        }
                                        else {
                                            if (_tmpObj[k])
                                                _inMonth[k] = 1;
                                        }
                                    }
                                }
                                else if (_inWeekhValid) {
                                    var _tmpObj = {};
                                    _patt.forEach(function(item) {
                                        var _params = item.split(/i[+]?/).map(function(str) {return Number(str);});
                                        _params[1]%=7;
                                        _tmpObj[_params[1]] = 1;
                                    });
                                    for (var k=0; k<7; k++) {
                                        if (_not) {
                                            if (!_tmpObj[k])
                                                _inWeek[k] = 1;
                                        }
                                        else {
                                            if (_tmpObj[k])
                                                _inWeek[k] = 1;
                                        }

                                    }
                                }
                            }
                            else {
                                console.warn(arr[i] + " is not valid!");
                            }
                        }
                    }
                }
            }
            return {smart: smart, calType: calType, static: _static, inWeek: _inWeek, inMonth: _inMonth};
        }
        this.isDayDisable = function(calType, disabled, day) {
            if (disabled.static[day.unix])
                return true;

            var _gap = 0;

            if (disabled.smart) {
                if (disabled.calType=='gregorian' && calType=='jalali')
                    _gap = +1;
                else if (disabled.calType=='jalali' && calType=='gregorian')
                    _gap = -1;
            }
            else {
                if (disabled.calType=='gregorian' && calType=='jalali')
                    _gap = -1;
                else if (disabled.calType=='jalali' && calType=='gregorian')
                    _gap = +1;
            }


            var _dayName = (day.dayName + 7 + _gap)%7;

            if (disabled.inMonth[day.day-1])
                return true;

            return !!+disabled.inWeek[_dayName];
        }

        return {
            dateFormat: this.dateFormat,
            parseString: this.parseString,
            toRegularFormat: this.toRegularFormat,
            isDateEqual: this.isDateEqual,
            isDateBigger: this.isDateBigger,
            isMonthBigger: this.isMonthBigger,
            joinTime: this.joinTime,
            removeTime: this.removeTime,
            validateJalaliDateSeparate: this.validateJalaliDateSeparate,
            validateJalaliDate: this.validateJalaliDate,
            convertToUnix: this.convertToUnix,
            convertFromUnix: this.convertFromUnix,
            convertToJalali: this.convertToJalali,
            parseDisablePattern: this.parseDisablePattern,
            isDayDisable: this.isDayDisable
        }
    }
