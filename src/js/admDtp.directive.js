
module.directive('admDtp',  ['ADMdtp', 'ADMdtpConvertor', 'ADMdtpFactory', 'constants', '$compile', '$timeout', ADMdtpDirective]);

    function ADMdtpDirective (ADMdtp, ADMdtpConvertor, ADMdtpFactory, constants, $compile, $timeout) {

        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            require: 'ngModel',
            scope: {
                options: '=?',
                fullData: '=?',
                onChange: '&',
                onDatechange: '&',
                onTimechange: '&',
                onOpen: '&',
                onClose: '&',
            },
            link: function(scope, element, attrs, ngModel) {
                if (!element.find('ng-transclude').children().length) {
                    scope.defaultTemplate = true;
                    element.find('ng-transclude').remove();
                }

                var _options = scope.options;
                if (!(_options instanceof Object))
                    _options = {};
                scope.option = angular.extend(angular.copy(ADMdtp.getOptions()), _options);
                scope.disableDays = ADMdtpFactory.parseDisablePattern(scope.option);
                scope.calType = scope.option.calType;
                scope.monthNames = constants.calendars[scope.calType].monthsNames;
                scope.daysNames = constants.calendars[scope.calType].daysNames;
                scope.timeoutValue = [0,0];

                scope.minDate = scope.mindate?new Date(scope.mindate):null;
                scope.maxDate = scope.maxdate?new Date(scope.maxdate):null;

                scope.current = {
                    year: '',
                    month: '',
                    monthDscr: '',
                    days: []
                };


                scope.updateMasterValue = function(newDate, releaseTheBeast) {
                    if (!newDate)
                        newDate = scope.dtpValue;

                    scope.$applyAsync(function() {
                        scope.dtpValue = newDate;
                        scope.dtpValue.formated = ADMdtpFactory.dateFormat(newDate, scope.time, scope.option.format);
                        scope.dtpValue.fullDate = ADMdtpFactory.joinTime(newDate.unix, scope.time);
                        scope.fullData = {
                            formated: scope.dtpValue.formated,
                            gDate: scope.dtpValue.fullDate,
                            unix: scope.dtpValue.fullDate.getTime(),
                            year: newDate.year,
                            month: newDate.month,
                            day: newDate.day,
                            hour: Number(scope.time.hour),
                            minute: Number(scope.time.minute),
                            minDate: scope.minDate,
                            maxDate: scope.maxDate,
                            calType: scope.calType,
                            format: scope.option.format
                        }

                        ngModel.$setViewValue( scope.dtpValue.formated );
                        ngModel.$render();

                        if (dtpInput.value)
                            dtpInput.value = scope.dtpValue.formated;

                        if (releaseTheBeast) {
                            if (scope.onChange)
                                scope.onChange({date:scope.fullData});
                            if (releaseTheBeast == 'time' && scope.onTimechange)
                                scope.onTimechange({date:scope.fullData});
                            else if (releaseTheBeast == 'day' && scope.onDatechange)
                                scope.onDatechange({date:scope.fullData});
                        }

                    });
                }

                scope.parseInputValue = function(valueStr, resetTime, releaseTheBeast) {

                    if (valueStr == 'today') {
                        valueStr = ADMdtpFactory.removeTime(new Date()).getTime();
                    }

                    var _dateTime = false;

                    if (valueStr) {

                        if (scope.calType == 'jalali') {
                            _dateTime = ADMdtpFactory.validateJalaliDate(valueStr, scope.option.format);
                        }
                        else {
                            if (typeof valueStr == "string")
                                valueStr = ADMdtpFactory.toRegularFormat(valueStr, scope.calType, scope.option.format);

                            _dateTime = new Date(valueStr);
                            _dateTime = (_dateTime == 'Invalid Date')?false:_dateTime;
                        }
                    }

                    if (_dateTime) {
                        scope.dtpValue = {
                            year: _dateTime.year || _dateTime.getFullYear(),
                            month: _dateTime.month || _dateTime.getMonth()+1,
                            day: _dateTime.day || _dateTime.getDate(),
                            unix: _dateTime.unix || _dateTime.getTime(),
                            fullDate: _dateTime.gDate || _dateTime
                        }

                        scope.dtpValue.fullDate = ADMdtpFactory.removeTime(scope.dtpValue.fullDate);
                        scope.dtpValue.unix = scope.dtpValue.fullDate.getTime();

                        scope.time = {
                            hour: ( _dateTime.getHours?_dateTime.getHours():_dateTime.hour ).lZero(),
                            minute: ( _dateTime.getMinutes?_dateTime.getMinutes():_dateTime.minute ).lZero()
                        }

                        scope.updateMasterValue(false, releaseTheBeast);
                    }
                    else {
                        if (resetTime)
                            scope.time = {
                                hour: '00',
                                minute: '00'
                            }
                    }
                }
                scope.parseInputValue(ngModel.$viewValue || scope.option.default, true, false);

                ngModel.$formatters.push(function (val) {
                    if (!val)
                        scope.destroy();
                    else if (scope.dtpValue && val == scope.dtpValue.formated) {
                        return;
                    }
                    else {
                        scope.parseInputValue(val, false, true);
                    }

                    return val;
                });

                attrs.$observe("disable", function (_newVal) {
                    scope.$applyAsync(function() {
                        _newVal = scope.$eval(_newVal);
                        scope.disable = _newVal;
                    });
                });

                attrs.$observe("mindate", function (_newVal) {
                    scope.$applyAsync(function() {
                        _newVal = scope.$eval(_newVal);
                        scope.minDate = ADMdtpFactory.convertToUnix(_newVal, scope.calType, scope.option.format);
                    });
                });

                attrs.$observe("maxdate", function (_newVal) {
                    scope.$applyAsync(function() {
                        _newVal = scope.$eval(_newVal);
                        scope.maxDate = ADMdtpFactory.convertToUnix(_newVal, scope.calType, scope.option.format);
                    });
                });

                scope.openCalendar = function() {
                    if (scope.showCalendarStat || scope.disable)
                        return;

                    scope.timeoutValue[0] = 0;
                    scope.showCalendarStat = true;

                    var _admDtpCalendarHtml = angular.element('<adm-dtp-calendar style="opacity:0;"></adm-dtp-calendar>');
                    angular.element(element.children()[0]).append(_admDtpCalendarHtml);

                    scope.$applyAsync(function () {
                        $compile(_admDtpCalendarHtml)(scope);
                    });

                    $timeout(function() {
                        var _element = angular.element(element.children()[0]).children()[1];
                        var _elementBound = _element.getBoundingClientRect();
                        var _input = element.children().children()[0];
                        var _inputBound = _input.getBoundingClientRect();
                        var _corner = {
                            x: _inputBound.left,
                            y: _inputBound.top + _inputBound.height
                        }

                        var _totalSize = {
                            width: _elementBound.width + _corner.x,
                            height: _elementBound.height + _corner.y
                        }

                        var _pos = {
                            top: '',
                            bottom: '',
                            left: '',
                            right: ''
                        }
                        if (_totalSize.height > window.innerHeight)
                            _pos.bottom = _inputBound.height + 'px';
                        else
                            _pos.top = _inputBound.height + 'px';

                        if (_totalSize.width > window.innerWidth)
                            _pos.left = (window.innerWidth - _totalSize.width - 20) + 'px';
                        else
                            _pos.left = 0;

                        angular.element(_element).css({top: _pos.top, bottom: _pos.bottom, left: _pos.left, opacity: 1});

                    }, 70);

                    if (scope.onOpen)
                        scope.onOpen();
                }

                scope.closeCalendar = function() {
                    if (!scope.showCalendarStat)
                        return;

                    scope.$applyAsync(function() {
                        scope.monthPickerStat = false;
                        scope.timePickerStat = false;
                        scope.showCalendarStat = false;
                    });

                    if (angular.element(element.children()[0]).children()[1]) {
                        angular.element(angular.element(element.children()[0]).children()[1]).remove();

                        if (scope.onClose)
                            scope.onClose();
                    }

                }

                scope.toggleCalendar = function() {
                    if (scope.showCalendarStat)
                        scope.closeCalendar();
                    else
                        scope.openCalendar();
                }

                scope.destroy = function() {
                    if (scope.disable)
                        return;

                    scope.monthPickerStat = false;
                    scope.timePickerStat = false;

                    scope.current = {
                        year: '',
                        month: '',
                        monthDscr: '',
                        days: []
                    };
                    scope.dtpValue = false;
                    scope.fullData = {
                        minDate: scope.minDate,
                        maxDate: scope.maxDate
                    }
                    scope.time = {
                        hour: '00',
                        minute: '00'
                    }
                    var _standValue = new Date();

                    if (scope.calType == 'jalali')
                        _standValue = ADMdtpFactory.convertToJalali(_standValue);

                    ngModel.$setViewValue('');
                    ngModel.$render();

                    scope.fillDays(_standValue, !scope.option.transition);

                    if (scope.onChange)
                        scope.onChange({date:scope.fullData});
                }

                var dtpInput = element[0].querySelector('[dtp-input]') || {};
                dtpInput.onblur = function() {
                    scope.modelChanged(this.value);
                }
                dtpInput.onfocus = scope.openCalendar;

                var dtpOpen = element[0].querySelector('[dtp-open]') || {};
                dtpOpen.onclick = scope.openCalendar;

                var dtpClose = element[0].querySelector('[dtp-close]') || {};
                dtpClose.onclick = scope.closeCalendar;

                var dtpToggle = element[0].querySelector('[dtp-toggle]') || {};
                dtpToggle.onclick = scope.toggleCalendar;

                var dtpDestroy = element[0].querySelector('[dtp-destroy]') || {};
                dtpDestroy.onclick = scope.destroy;
            },
            controller: ['$scope',
                function($scope) {

                    this.updateMasterValue = function(newDate, releaseTheBeast) {
                        $scope.updateMasterValue(newDate, releaseTheBeast);
                    }

                    this.fillDays = function(date, noTransition) {

                        if (noTransition)
                            $scope.timeoutValue[0] = 0;
                        else
                            $scope.loadingDays = true;


                        var _mainDate = angular.copy(date);

                        if ($scope.calType == 'jalali') {
                            var _gDate = ADMdtpConvertor.toGregorian(date.year, date.month, 29);
                            date = new Date(_gDate.year, _gDate.month-1, _gDate.day);
                        }

                        var _input = {
                            year: date.getFullYear(),
                            month: date.getMonth()+1,
                            day: date.getDate()
                        }

                        $scope.$applyAsync(function() {
                            var _month = _mainDate.month || (_mainDate.getMonth()+1);
                            angular.extend($scope.current, {
                                year: _mainDate.year || _mainDate.getFullYear(),
                                month: _month,
                                monthDscr: $scope.monthNames[_month-1]
                            });
                        });

                        var _today = new Date();
                        _today = new Date(_today.getFullYear(), _today.getMonth(), _today.getDate()).getTime();

                        var _selected = -1, _selectedIdx;
                        if ($scope.dtpValue) {
                            _selected = $scope.dtpValue.unix;
                        }

                        var _currDay = new Date(_input.year, _input.month-1, _input.day);
                        var _firstDayName = new Date(angular.copy(_currDay).setDate(1)).getDay();

                        var _days = [];

                        var _diff = -1 * _firstDayName,
                            _ite_date, _disable = true;
                        var _lastValidStat = -1;

                        if ($scope.calType == 'jalali') {
                            var _ite_date = new Date(angular.copy(_currDay).setDate(_diff));
                            var _pDate = ADMdtpConvertor.toJalali(_ite_date.getFullYear(), _ite_date.getMonth()+1, _ite_date.getDate());
                            _diff -= (Math.ceil((_pDate.day-1)/7)*7 + 1);
                        }

                        while (true) {
                            _diff++;
                            var _ite_date = new Date(angular.copy(_currDay).setDate(_diff));
                            var _pDate = false;

                            if ($scope.calType == 'jalali') {
                                _pDate = ADMdtpConvertor.toJalali(_ite_date.getFullYear(), _ite_date.getMonth()+1, _ite_date.getDate());
                            }

                            var _thisDay = _pDate.day || _ite_date.getDate();

                            if (_thisDay == 1)
                                _disable = !_disable;

                            if (_disable && _thisDay < 8)
                                if (($scope.calType == 'jalali' && _ite_date.getDay() == 6) || ($scope.calType == 'gregorian' && _ite_date.getDay() == 0))
                                    break;


                            var _isMin = false;
                            var _valid = 1;
                            if ($scope.minDate || $scope.maxDate) {
                                var _dateTime = ADMdtpFactory.joinTime(_ite_date, $scope.time);
                                if (($scope.minDate && !ADMdtpFactory.isDateBigger(_dateTime,$scope.minDate)) || ($scope.maxDate && !ADMdtpFactory.isDateBigger($scope.maxDate,_dateTime))) {
                                    _valid = 0;

                                    if (_lastValidStat == 2)
                                        _days[_days.length-1].isMax = true;
                                }
                                else {
                                    _valid = 2;

                                    if (_lastValidStat == 0)
                                        _isMin = true;
                                }
                                _lastValidStat = _valid;
                            }

                            var _unix = _ite_date.getTime();
                            var _dayName = _ite_date.getDay() + (($scope.calType=='jalali')?1:0);

                            var _day = {
                                day: _thisDay,
                                month: _pDate.month || _ite_date.getMonth()+1,
                                year: _pDate.year || _ite_date.getFullYear(),
                                dayName: _dayName,
                                fullDate: _ite_date,
                                disable: _disable,
                                today: (_unix == _today),
                                selected: (_unix == _selected),
                                unix: _unix,
                                valid: _valid,
                                isMin: _isMin
                            }

                            if (ADMdtpFactory.isDayDisable($scope.calType, $scope.disableDays, _day))
                                _day.valid = 0;

                            if (_day.selected)
                                _selectedIdx = _days.length;

                            _days.push(_day);
                        }

                        $timeout(function() {

                            $scope.timeoutValue[0] = 500;

                            $scope.$applyAsync(function() {
                                $scope.current.days = _days;
                                if (_selectedIdx)
                                    $scope.updateMasterValue($scope.current.days[_selectedIdx]);
                                $timeout(function() {
                                    $scope.loadingDays = false;
                                }, $scope.timeoutValue[1]);
                            });

                        }, $scope.timeoutValue[0]);
                    }

                    this.reload = function() {
                        var _cur = angular.copy($scope.current);
                        _cur.day = 29;
                        var _date = new Date(_cur.year, _cur.month-1, 8);
                        if ($scope.calType == 'jalali')
                            _date = _cur;
                        this.fillDays(_date, !$scope.option.transition);
                    }

                    $scope.fillDays = this.fillDays;
                }
            ],
            //templateUrl: 'js/ADM-dateTimePicker/ADM-dateTimePicker_view.html'
            template: '<div class="ADMdtp-container" ng-class="{rtl: (calType==\'jalali\'), touch: option.isDeviceTouch, disable: disable}"><div class="clickOutContainer" click-out="closeCalendar()"><ng-transclude></ng-transclude> <div ng-if="defaultTemplate" class="masterInput" ng-class="{touch: option.isDeviceTouch, disable: disable, open: showCalendarStat}"><input type="text" ng-model="dtpValue.formated" ng-focus="openCalendar()" ng-disabled="option.freezeInput || option.isDeviceTouch || disable" ng-blur="modelChanged()"><div class="iconContainer" ng-click="toggleCalendar()"><i class="dtpIcon null fakeIcon"></i><svg class="calendarIcon" viewBox="0 0 1664 1664"><use xlink:href="#dtpCalendar" /></svg><svg class="closeIcon" viewBox="0 0 1400 1400"><use xlink:href="#dtpOff" /></svg></div><svg class="removeIcon" viewBox="0 0 1408 1408" ng-if="dtpValue.formated" ng-click="destroy()"><use stroke-width="20" xlink:href="#dtpTimes" /></svg></div></div><svg style="display:none;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"><defs><path id="dtpCalendar" d="M128 -128h288v288h-288v-288zM480 -128h320v288h-320v-288zM128 224h288v320h-288v-320zM480 224h320v320h-320v-320zM128 608h288v288h-288v-288zM864 -128h320v288h-320v-288zM480 608h320v288h-320v-288zM1248 -128h288v288h-288v-288zM864 224h320v320h-320v-320z M512 1088v288q0 13 -9.5 22.5t-22.5 9.5h-64q-13 0 -22.5 -9.5t-9.5 -22.5v-288q0 -13 9.5 -22.5t22.5 -9.5h64q13 0 22.5 9.5t9.5 22.5zM1248 224h288v320h-288v-320zM864 608h320v288h-320v-288zM1248 608h288v288h-288v-288zM1280 1088v288q0 13 -9.5 22.5t-22.5 9.5h-64 q-13 0 -22.5 -9.5t-9.5 -22.5v-288q0 -13 9.5 -22.5t22.5 -9.5h64q13 0 22.5 9.5t9.5 22.5zM1664 1152v-1280q0 -52 -38 -90t-90 -38h-1408q-52 0 -90 38t-38 90v1280q0 52 38 90t90 38h128v96q0 66 47 113t113 47h64q66 0 113 -47t47 -113v-96h384v96q0 66 47 113t113 47 h64q66 0 113 -47t47 -113v-96h128q52 0 90 -38t38 -90z" /><path id="dtpOff" d="M1536 640q0 -156 -61 -298t-164 -245t-245 -164t-298 -61t-298 61t-245 164t-164 245t-61 298q0 182 80.5 343t226.5 270q43 32 95.5 25t83.5 -50q32 -42 24.5 -94.5t-49.5 -84.5q-98 -74 -151.5 -181t-53.5 -228q0 -104 40.5 -198.5t109.5 -163.5t163.5 -109.5 t198.5 -40.5t198.5 40.5t163.5 109.5t109.5 163.5t40.5 198.5q0 121 -53.5 228t-151.5 181q-42 32 -49.5 84.5t24.5 94.5q31 43 84 50t95 -25q146 -109 226.5 -270t80.5 -343zM896 1408v-640q0 -52 -38 -90t-90 -38t-90 38t-38 90v640q0 52 38 90t90 38t90 -38t38 -90z" /><path id="dtpClock" d="M896 992v-448q0 -14 -9 -23t-23 -9h-320q-14 0 -23 9t-9 23v64q0 14 9 23t23 9h224v352q0 14 9 23t23 9h64q14 0 23 -9t9 -23zM1312 640q0 148 -73 273t-198 198t-273 73t-273 -73t-198 -198t-73 -273t73 -273t198 -198t273 -73t273 73t198 198t73 273zM1536 640 q0 -209 -103 -385.5t-279.5 -279.5t-385.5 -103t-385.5 103t-279.5 279.5t-103 385.5t103 385.5t279.5 279.5t385.5 103t385.5 -103t279.5 -279.5t103 -385.5z" /><path id="dtpTimes" horiz-adv-x="1408" d="M1298 214q0 -40 -28 -68l-136 -136q-28 -28 -68 -28t-68 28l-294 294l-294 -294q-28 -28 -68 -28t-68 28l-136 136q-28 28 -28 68t28 68l294 294l-294 294q-28 28 -28 68t28 68l136 136q28 28 68 28t68 -28l294 -294l294 294q28 28 68 28t68 -28l136 -136q28 -28 28 -68 t-28 -68l-294 -294l294 -294q28 -28 28 -68z" /><path id="dtpUp" horiz-adv-x="1792" d="M1683 205l-166 -165q-19 -19 -45 -19t-45 19l-531 531l-531 -531q-19 -19 -45 -19t-45 19l-166 165q-19 19 -19 45.5t19 45.5l742 741q19 19 45 19t45 -19l742 -741q19 -19 19 -45.5t-19 -45.5z" /><path id="dtpDown" horiz-adv-x="1792" d="M1683 728l-742 -741q-19 -19 -45 -19t-45 19l-742 741q-19 19 -19 45.5t19 45.5l166 165q19 19 45 19t45 -19l531 -531l531 531q19 19 45 19t45 -19l166 -165q19 -19 19 -45.5t-19 -45.5z" /></defs></svg> </div>'
        };
    }
