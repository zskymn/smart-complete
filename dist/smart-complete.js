/*!
 * smart-complete - 为input和textarea提供提示补全功能的AngularJS指令
 * @version 2.0.5
 * @link https://github.com/zskymn/smart-complete#readme
 */
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery', 'angular'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('jquery'), require('angular'));
  } else {
    factory(root.jQuery, root.angular);
  }
}(this, function($, angular){
angular
  .module('smart-complete', []);

angular
  .module('smart-complete')
  .service('$scUtil', ["$timeout", "$q", function ($timeout, $q) {
    var vm = this;
    vm.debounce = debounce;
    vm.noopSearchFunc = noopSearchFunc;

    function debounce(func, wait) {
      var timeoutPromise = null;
      if (wait !== 0 && !wait) {
        wait = 300;
      }
      return function () {
        var context = this,
          args = arguments;
        $timeout.cancel(timeoutPromise);
        return (timeoutPromise = $timeout(function () {
          return func.apply(context, args);
        }, wait));
      };
    }

    function noopSearchFunc() {
      return $q.when([]);
    }
  }]);

angular
  .module('smart-complete')
  .directive('smartComplete', ["$parse", "$scUtil", "$timeout", function ($parse, $scUtil, $timeout) {
    return {
      restrict: 'A',
      link: function (scope, elem, attrs) {
        var tagName, __searchFunc, __sep, __scTrim, __width, __height, __itemClickCb, __enterCb, $$completor, selectedClass;
        activate();

        function activate() {
          tagName = elem[0].tagName.toLowerCase();
          __searchFunc = $parse(attrs.smartComplete);
          __sep = $parse(attrs.scSep);
          __scTrim = $parse(attrs.scTrim || 'true');
          __width = $parse(attrs.scWidth);
          __height = $parse(attrs.scHeight);
          __itemClickCb = $parse(attrs.scItemClickCb);
          __enterCb = $parse(attrs.scEnterCb);
          selectedClass = 'current-selected';

          if (tagName !== 'input' && tagName !== 'textarea') {
            throw 'tagName must be input or textarea';
          }

          $$completor = $('<ul class="smart-complete"></ul>');
          elem.after($$completor);
          initStyle();
          registObservers();
        }

        function _trimValue(value) {
          if (__scTrim(scope)) {
            return $.trim(value);
          } else {
            return value;
          }
        }

        function initStyle() {
          elem.css('font-size', elem.css('font-size'));
          if (tagName === 'textarea') {
            elem.css({
              overflow: 'auto',
              overflowX: 'auto',
              overflowY: 'auto',
              wordBreak: 'break-all'
            });
          }
          $$completor.hide();
        }

        function registObservers() {
          elem
            .off('click.sc')
            .on('click.sc', updateCompletorItems)
            .off('keyup.sc')
            .on('keyup.sc', $scUtil.debounce(function (evt) {
              var code = evt.which;
              if (code === 13 || code === 38 || code === 40 || code === 9) {
                return;
              }
              updateCompletorItems();
            }))
            .off('keydown.sc')
            .on('keydown.sc', function (evt) {
              var code = evt.which,
                isUp;
              if (code === 13) {
                if ($$completor.is(':visible')) {
                  evt.preventDefault();
                  $$completor.hide();
                }
                $timeout(function () {
                  (__enterCb(scope) || angular.noop)(_trimValue(elem.val()));
                });
                return;
              } else if (code === 9) {
                if ($$completor.is(':visible')) {
                  $$completor.hide();
                }
                return;
              } else if (code === 38) {
                isUp = true;
              } else if (code === 40) {
                isUp = false;
              } else {
                return;
              }
              evt.preventDefault();
              changeSelectedItem(isUp);
            });

          $$completor
            .off('mouseenter.sc')
            .on('mouseenter.sc', 'li', function () {
              $(this).addClass(selectedClass);
            })
            .off('mouseleave.sc')
            .on('mouseleave.sc', 'li', function () {
              $$completor.children().removeClass(selectedClass);
            })
            .off('click.sc')
            .on('click.sc', 'li', function () {
              appendModelValue($(this).attr('value'));
              var itemVal = $(this).attr('value');
              $timeout(function () {
                (__itemClickCb(scope) || angular.noop)(itemVal, elem.val());
              });
              $$completor.hide();
            });

          $(document).on('click.sc', function () {
            $$completor.hide();
          });
        }

        function getSepsPos() {
          var caretPos = elem.caret('pos'), seps = __sep(scope);
          if (!$.isArray(seps)) {
            seps = [seps + ''];
          }
          if (!seps.length) {
            return elem.val();
          }
          var allVal = elem.val();
          var lsep = '', lsepIdx = -1, rsep = '', rsepIdx = -1;
          $.each(seps, function (_idx, _sep) {
            if (_sep) {
              var _lsepIdx = allVal.substring(0, caretPos).lastIndexOf(_sep);
              if (_lsepIdx > lsepIdx) {
                lsepIdx = _lsepIdx;
                lsep = _sep;
              }
              var _rsepIdx = allVal.substring(caretPos).indexOf(_sep);

              if (_rsepIdx >  -1) {
                if (rsepIdx > -1) {
                  if (_rsepIdx < rsepIdx) {
                    rsepIdx = _rsepIdx;
                    rsep = _sep;
                  }
                } else {
                  rsepIdx = _rsepIdx;
                  rsep = _sep;
                }
              }
            }
          });
          var left = '', right = '';

          if (lsepIdx > -1) {
            left = allVal.substring(0, lsepIdx);
          }

          if (rsepIdx > -1) {
            rsepIdx = rsepIdx + caretPos;
            right = allVal.substring(rsepIdx + rsep.length);
          }
          return {
            left: left,
            right: right,
            lsep: lsep,
            lsepIdx: lsepIdx,
            rsep: rsep,
            rsepIdx: rsepIdx
          };
        }

        function getCompletorPosStyle() {
          var width = __width(scope),
            height = parseInt(__height(scope), 10) || 240,
            sepsPos = getSepsPos(),
            elemPos = elem.position(),
            elemWidth = elem.outerWidth(),
            elemHeight = elem.outerHeight(),
            caretPosition = elem.caret('position'),
            pos, cLeft, cTop;

          var lsepIdx = sepsPos.lsepIdx;
          if (lsepIdx === -1) {
            pos = elem.caret('position', 0);
            pos.left = 0;
          } else {
            pos = elem.caret('position', lsepIdx + 1);
          }
          if (width === '100%') {
            width = elem.outerWidth();
            cLeft = 0;
          } else {
            width = parseInt(width, 10) || 240;
            if (width >= elemWidth) {
              cLeft = 0;
            } else if (pos.left + width >= elemWidth) {
              cLeft = elemWidth - width;
            } else {
              cLeft = pos.left;
            }
          }

          if (tagName === 'input') {
            cTop = elemHeight;
          } else {
            cTop = caretPosition.top + caretPosition.height - elem.scrollTop();
            if (caretPosition.top > pos.top) {
              cLeft = 0;
            }
          }

          var _scrollTop = 0,
            _scrollLeft = 0;

          var parent = elem.parents().filter(function () {
            var p = $(this).css('position');
            return p === 'absolute' || p === 'fixed' || p === 'relative';
          })[0];
          if (parent) {
            var $$parent = $(parent);
            _scrollTop = $$parent.scrollTop();
            _scrollLeft = $$parent.scrollLeft();
          }

          return {
            width: width,
            maxHeight: height,
            left: elemPos.left + _scrollLeft + parseInt(elem.css('marginLeft'), 10) + cLeft,
            top: elemPos.top + _scrollTop + parseInt(elem.css('marginTop'), 10) + cTop + 2
          };
        }

        function updateCompletorItems() {
          var sepsPos = getSepsPos();
          var allVal = elem.val();
          var lsep = sepsPos.lsep, lsepIdx = sepsPos.lsepIdx, rsepIdx = sepsPos.rsepIdx, rsep = sepsPos.rsep, left = sepsPos.left, right = sepsPos.right;

          var _from = 0, _to = allVal.length;

          if (lsepIdx > -1) {
            _from = lsepIdx + lsep.length;
          }
          if (rsepIdx > -1) {
            _to = rsepIdx;
          }

          var sliceVal = allVal.substring(_from, _to);
          (__searchFunc(scope) || $scUtil.noopSearchFunc)(_trimValue(sliceVal), lsep, left, rsep, right)
            .then(function (items) {
              return $.map(items, function (item) {
                if (angular.isObject(item)) {
                  return item;
                } else {
                  return {
                    label: item,
                    value: item
                  };
                }
              });
            }, function () {
              return [];
            }).then(function (items) {
              if (items.length === 0) {
                $$completor.html('').hide();
                return;
              }

              $$completor
                .html($.map(items, function (item) {
                  return '<li value="' + item.value + '">' + item.label + '</li>';
                }).join(''))
                .css(getCompletorPosStyle())
                .show()
                .css(getCompletorPosStyle());
            });
        }

        function changeSelectedItem(isUp) {
          if ($$completor.is(':hidden')) {
            return;
          }
          var items = $$completor.children();
          if (items.length === 0) {
            return;
          }
          var seletedItem = items.filter('.' + selectedClass).first(),
            shouldSelectedItem = seletedItem;
          if (seletedItem.length) {
            if (isUp) {
              var prev = seletedItem.prev();
              if (prev.length) {
                shouldSelectedItem = prev;
              }
            } else {
              var next = seletedItem.next();
              if (next.length) {
                shouldSelectedItem = next;
              }
            }
          } else {
            shouldSelectedItem = isUp ? items.last() : items.first();
          }
          items.removeClass(selectedClass);
          shouldSelectedItem.addClass(selectedClass);
          appendModelValue(shouldSelectedItem.attr('value'));
          var itemTop = shouldSelectedItem.position().top,
            min = 0,
            max = $$completor.height() - shouldSelectedItem.height();
          if (itemTop > max) {
            $$completor.scrollTop($$completor.scrollTop() + itemTop - max);
          }
          if (itemTop < min) {
            return $$completor.scrollTop($$completor.scrollTop() + itemTop - min);
          }
        }

        function appendModelValue(value) {
          var sepsPos = getSepsPos();
          var lsep = sepsPos.lsep, rsep = sepsPos.rsep, left = sepsPos.left, right = sepsPos.right;
          var shouldVal = '';

          if (left) {
            shouldVal += (left + lsep);
          }
          shouldVal += value;
          var _caret = shouldVal.length;
          if (right) {
            shouldVal += (rsep + right);
          }

          elem.val(shouldVal)
            .caret('pos', _caret);
          elem.focus()
            .trigger('change');
        }
      }
    };
  }]);
}));