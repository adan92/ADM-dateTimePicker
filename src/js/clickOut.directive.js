
 module.directive('clickOut', ['$document', clickOutside]);

    function clickOutside($document) {
        return {
            restrict: 'A',
            scope: {
                clickOut: '&'
            },
            link: function ($scope, elem, attr) {
                var classList = (attr.outsideIfNot !== undefined) ? attr.outsideIfNot.replace(', ', ',').split(',') : [];
                if (attr.id == undefined) attr.$set('id', 'id_' + Math.random());
                if (attr.id !== undefined) classList.push(attr.id);

                $document.on('click contextmenu', function (e) {
                    var i = 0,
                        element;

                    if (!e.target) return;

                    for (element = e.target; element; element = element.parentNode) {
                        var id = element.id;
                        var classNames = element.className;

                        if (id !== undefined) {
                            for (i = 0; i < classList.length; i++) {
                                if (id.indexOf(classList[i]) > -1 || (typeof classNames == 'string' && classNames.indexOf(classList[i]) > -1)) {
                                    return;
                                }
                            }
                        }
                    }

                    $scope.$eval($scope.clickOut);
                });
            }
        };
    }

