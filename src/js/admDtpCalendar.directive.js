/**
 * Created by amezc on 07/12/2016.
 */

module.directive('admDtpCalendar', ['ADMdtp', 'ADMdtpConvertor', 'ADMdtpFactory', 'constants', '$timeout', ADMdtpCalendarDirective]);

function ADMdtpCalendarDirective(ADMdtp, ADMdtpConvertor, ADMdtpFactory, constants, $timeout) {

    return {
        restrict: 'E',
        replace: true,
        require: '^^admDtp',
        link: function(scope, element, attrs, admDtp) {

            var _standValue;
            if (!scope.dtpValue)
                _standValue = new Date();
            else
                _standValue = new Date(scope.dtpValue.fullDate);

            if (scope.calType == 'jalali')
                _standValue = ADMdtpFactory.convertToJalali(_standValue);

            admDtp.fillDays(_standValue, !scope.option.transition);

            scope.previousMonth = function(flag) {
                if (scope.calType == 'jalali' && !flag) {
                    scope.nextMonth(true);
                    return;
                }

                if (scope.current.month == 1)
                    scope.current.month = 12, scope.current.year--;
                else
                    scope.current.month--
                admDtp.reload();
            }

            scope.nextMonth = function(flag) {
                if (scope.calType == 'jalali' && !flag) {
                    scope.previousMonth(true);
                    return;
                }

                if (scope.current.month == 12)
                    scope.current.month = 1, scope.current.year++;
                else
                    scope.current.month++
                admDtp.reload();
            }

            scope.previousYear = function(flag) {
                if (scope.calType == 'jalali' && !flag) {
                    scope.nextYear(true);
                    return;
                }

                var _firstYear = scope.generatedYears.shift();
                scope.generatedYears = [];
                for (var i=1;i<17;i++) {
                    scope.generatedYears.push(_firstYear - 17 + i);
                }
            }

            scope.nextYear = function(flag) {
                if (scope.calType == 'jalali' && !flag) {
                    scope.previousYear(true);
                    return;
                }

                var _lastYear = scope.generatedYears.pop();
                scope.generatedYears = [];
                for (var i=1;i<17;i++) {
                    scope.generatedYears.push(_lastYear + i);
                }
            }

            scope.selectMonthInit = function() {
                scope.yearSelectStat = false;
                scope.monthPickerStat = true;
            }

            scope.selectYearInit = function() {
                scope.yearSelectStat = true;
                scope.generatedYears = [];
                for (var i=0;i<16;i++) {
                    scope.generatedYears.push(scope.current.year + i - 7);
                }
            }

            scope.selectMonth = function(monthIdx) {
                if (monthIdx+1 != scope.current.month) {
                    scope.current.month = monthIdx+1;
                    admDtp.reload();
                }
                scope.monthPickerStat = false;
            }

            scope.selectYear = function(yearName) {
                if (yearName != scope.current.year) {
                    scope.current.year = yearName;
                    admDtp.reload();
                }
                scope.monthPickerStat = false;
                //scope.yearSelectStat = false;
            }

            scope.selectThisDay = function(day) {
                if (day.valid == 0)
                    return;

                if (scope.dtpValue)
                    scope.dtpValue.selected = false;

                admDtp.updateMasterValue(day, 'day');

                if (scope.option.autoClose) {
                    $timeout(function() {
                        scope.closeCalendar();
                    },100);
                    return;
                }


                if (day.disable) {
                    $timeout(function() {
                        if (ADMdtpFactory.isMonthBigger(day, scope.current))
                            scope.nextMonth(true);
                        else
                            scope.previousMonth(true);
                    }, 0);
                } else
                    day.selected = true;
            }

            scope.today = function() {
                var _standValue = new Date();

                if (scope.calType == 'jalali')
                    _standValue = ADMdtpFactory.convertToJalali(_standValue);

                admDtp.fillDays(_standValue, !scope.option.transition);
            }

            scope.changeTimeValue = function(variable, value) {
                var _num = (Number(scope.time[variable]) + value + ((variable=='hour')?24:60)) % ((variable=='hour')?24:60);
                var _timeCopy = angular.copy(scope.time);
                _timeCopy[variable] = _num.lZero();

                if (scope.dtpValue) {
                    if (scope.minDate || scope.maxDate) {
                        var _dateTime = ADMdtpFactory.joinTime(scope.dtpValue.unix, _timeCopy);
                        if ((scope.minDate && !ADMdtpFactory.isDateBigger(_dateTime,scope.minDate)) || (scope.maxDate && !ADMdtpFactory.isDateBigger(scope.maxDate,_dateTime)))
                            return;
                    }
                }

                scope.time[variable] = _num.lZero();


                if (scope.dtpValue)
                    admDtp.updateMasterValue(false, 'time');

                admDtp.reload();
            }

            scope.modelChanged = function(input) {

                if (!scope.dtpValue)
                    return;

                var _value = input || scope.dtpValue.formated;

                if (!_value) {
                    scope.destroy();
                    return;
                }

                var _inputUnix = ADMdtpFactory.convertToUnix(_value, scope.calType, scope.option.format);
                if (!_inputUnix || ((scope.minDate && !ADMdtpFactory.isDateBigger(_inputUnix,scope.minDate)) || (scope.maxDate && !ADMdtpFactory.isDateBigger(scope.maxDate,_inputUnix)))) {
                    admDtp.updateMasterValue(false);
                    return;
                }

                if (_inputUnix == scope.fullData.unix)
                    return;

                scope.parseInputValue(_value, false, true);

                var _gDate = new Date(_inputUnix);
                if (scope.calType == 'jalali')
                    _gDate = ADMdtpFactory.convertToJalali(_gDate);

                admDtp.fillDays(_gDate, true);

            }

            scope.calTypeChanged = function() {
                scope.calType = (scope.calType=='gregorian')?'jalali':'gregorian';

                scope.monthNames = constants.calendars[scope.calType].monthsNames;
                scope.daysNames = constants.calendars[scope.calType].daysNames;

                var _cur = angular.copy(scope.current);
                var _mainDate;

                if (scope.calType == 'jalali') {
                    _mainDate = ADMdtpConvertor.toJalali(_cur.year, _cur.month, 15);
                }
                else {
                    _mainDate = ADMdtpConvertor.toGregorian(_cur.year, _cur.month, 15);
                    _mainDate = new Date(_mainDate.year, _mainDate.month-1, _mainDate.day);
                }

                if (scope.dtpValue) {
                    admDtp.updateMasterValue(ADMdtpFactory.convertFromUnix(scope.dtpValue.unix, scope.calType));
                }

                admDtp.fillDays(_mainDate, true);

            }


        },
        templateUrl: 'templates/ADM-dateTimePicker_calendar.html'

    }
}
