var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

angular.module('smart-complete', []).factory('debounce', [
  '$timeout', '$q', function($timeout, $q) {
    return function(func, wait, immediate) {
      var deferred, timeout;
      timeout = null;
      deferred = $q.defer();
      return function() {
        var args, callNow, context, later;
        context = this;
        args = arguments;
        later = function() {
          timeout = null;
          if (!immediate) {
            deferred.resolve(func.apply(context, args));
            return deferred = $q.defer();
          }
        };
        callNow = immediate && !timeout;
        if (timeout) {
          $timeout.cancel(timeout);
        }
        timeout = $timeout(later, wait);
        if (callNow) {
          deferred.resolve(func.apply(context, args));
          deferred = $q.defer();
        }
        return deferred.promise;
      };
    };
  }
]).directive('smartComplete', [
  '$compile', '$parse', 'debounce', '$timeout', function($compile, $parse, debounce, $timeout) {
    return {
      restict: 'A',
      scope: true,
      link: function(scope, elem, attr) {
        var SmartComplete, sc, _ref;
        if ((_ref = elem[0].tagName.toLowerCase()) !== 'input' && _ref !== 'textarea') {
          throw 'tagName must be input or textarea';
        }
        SmartComplete = (function() {
          function SmartComplete(options) {
            this.appendInputorVal = __bind(this.appendInputorVal, this);
            this.mouseEnterItem = __bind(this.mouseEnterItem, this);
            var scDom, scWrapDom, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
            this.type = elem[0].tagName.toLowerCase();
            this.searchFunc = (_ref1 = options.searchFunc) != null ? _ref1 : angular.noop;
            this.afterSelectItemFunc = (_ref2 = options.afterSelectItemCallback) != null ? _ref2 : angular.noop;
            this.sep = (_ref3 = options.seperator) != null ? _ref3 : ',';
            this.width = (_ref4 = options.width) != null ? _ref4 : 200;
            this.maxHeight = (_ref5 = options.height) != null ? _ref5 : 200;
            this.wait = (_ref6 = options.wait) != null ? _ref6 : 300;
            scDom = "<div style='width: " + this.width + "px; max-height: " + this.maxHeight + "px;' ng-show='completor.showing && results.length>0' class='smart-complete'> <div ng-repeat='res in results' ng-bind='res.label' value='{{res.value}}' label='{{res.label}}' class='res-item' ng-mouseenter='mouseEnterItem($event)' ng-click='appendInputorVal(res.value);afterSelectItemFunc(res.value, res.label); completor.showing=false; '></div> </div>";
            scWrapDom = "<div style='position: absolute; width: 0; height: 0; padding: 0; margin: 0; z-index: 99999'></div>";
            this.completorWrap = $(scWrapDom);
            this.completor = $(scDom);
            this.completorWrap.append(this.completor);
            this.inputor = elem;
            this.inputor.after($compile(this.completorWrap)(scope));
            this.parent = this.inputor.parent();
            this.inputor.css('font-size', this.inputor.css('font-size'));
            if (this.inputor.prop('tagName').toLowerCase() === 'textarea') {
              this.inputor.css({
                overflow: 'auto',
                overflowX: 'auto',
                overflowY: 'auto',
                wordBreak: 'break-all'
              });
            }
            this.updateCompletor = debounce(function(evt, alwaysUpdate) {
              var completorPos, csv, inputorOff, inputorPos, lv, pos, sepPos, sv, val, _ref7;
              if (evt.which === 13) {
                if (scope.completor.showing) {
                  evt.preventDefault();
                  scope.completor.showing = false;
                  scope.$apply();
                }
                return;
              }
              if ((_ref7 = evt.which) === 38 || _ref7 === 40) {
                return;
              }
              pos = this.inputor.caret('pos');
              val = this.inputor.val();
              lv = val.substring(0, pos);
              this.showCompletor();
              sv = lv.split(this.sep).pop();
              if (val.substring(pos)) {
                csv = sv + val.substring(pos).split(this.sep)[0];
              } else {
                csv = sv;
              }
              completorPos = this.inputor.caret('offset');
              inputorOff = this.inputor.offset();
              inputorPos = this.inputor.position();
              sepPos = this.inputor.caret('offset', this.inputor.caret('pos') - sv.length);
              completorPos.top -= inputorOff.top;
              completorPos.left -= inputorOff.left;
              sepPos.top -= inputorOff.top;
              sepPos.left -= inputorOff.left;
              completorPos.left = sepPos.top !== completorPos.top ? this.inputor.caret('position', 0).left : Math.max(sepPos.left, parseInt(this.inputor.css('paddingLeft'), 10));
              this.completorWrap.css({
                top: (this.type === 'input' ? inputorPos.top + this.inputor.outerHeight() : completorPos.top + completorPos.height + inputorPos.top + 8) + 'px',
                left: Math.max(inputorPos.left, Math.min(completorPos.left + inputorPos.left, inputorPos.left + this.inputor.width() + parseInt(this.inputor.css('paddingLeft')) + parseInt(this.inputor.css('paddingRight')) - this.width - 2)) + 'px'
              });
              scope.results = [];
              scope.$apply();
              this.searchFunc(csv, this.updateResults);
            }, this.wait);
          }

          SmartComplete.prototype.registerObservers = function() {
            this.inputor.bind('click.smartComplete', (function(_this) {
              return function(evt) {
                _this.updateCompletor(evt);
              };
            })(this));
            this.inputor.bind('keyup.smartComplete', (function(_this) {
              return function(evt) {
                _this.updateCompletor(evt);
              };
            })(this));
            this.inputor.bind('keydown.smartComplete', (function(_this) {
              return function(evt) {
                _this.inputorKeyDown(evt);
              };
            })(this));
            this.inputor.bind('scroll.smartComplete', (function(_this) {
              return function() {
                _this.hideCompletor();
              };
            })(this));
            return $(document).bind('click.smartComplete', (function(_this) {
              return function(evt) {
                _this.blurInputorClick(evt);
              };
            })(this));
          };

          SmartComplete.prototype.mouseEnterItem = function(evt) {
            this.selectItem($(evt.currentTarget));
          };

          SmartComplete.prototype.blurInputorClick = function(evt) {
            var target;
            target = $(evt.target);
            if (!(this.completorWrap.find(target).length || this.inputor[0] === target[0])) {
              this.hideCompletor();
            }
          };

          SmartComplete.prototype.inputorKeyDown = function(evt) {
            var next, prev, selectItems, shouldSelectItem;
            if (!scope.completor.showing) {
              return;
            }
            if (evt.which === 13) {
              evt.preventDefault();
            }
            switch (evt.which) {
              case 38:
                if (!this.completor.children().length) {
                  return;
                }
                evt.preventDefault();
                selectItems = this.completor.children('.current-selected');
                if (selectItems.length) {
                  prev = selectItems.first().prev();
                  if (prev.length) {
                    shouldSelectItem = prev;
                  } else {
                    shouldSelectItem = selectItems.first();
                  }
                } else {
                  shouldSelectItem = this.completor.children().last();
                }
                this.selectItem(shouldSelectItem);
                this.appendInputorVal(shouldSelectItem.first().attr('value'));
                break;
              case 40:
                if (!this.completor.children().length) {
                  return;
                }
                evt.preventDefault();
                selectItems = this.completor.children('.current-selected');
                if (selectItems.length) {
                  next = selectItems.first().next();
                  if (next.length) {
                    shouldSelectItem = next;
                  } else {
                    shouldSelectItem = selectItems.last();
                  }
                } else {
                  shouldSelectItem = this.completor.children().first();
                }
                this.selectItem(shouldSelectItem);
                this.appendInputorVal(shouldSelectItem.first().attr('value'));
                break;
            }
          };

          SmartComplete.prototype.appendInputorVal = function(value) {
            var lv, pos, rps, sps, sv, val;
            pos = this.inputor.caret('pos');
            val = this.inputor.val();
            lv = val.substring(0, pos);
            sps = lv.split(this.sep);
            sv = sps.pop();
            sps.push(value);
            if (val.substring(pos)) {
              rps = val.substring(pos).split(this.sep);
              rps.shift();
              if (rps.join(this.sep)) {
                sps.push(rps.join(this.sep));
              }
            }
            this.inputor.val(sps.join(this.sep));
            this.inputor.caret('pos', pos + value.length - sv.length);
            this.inputor.focus();
            this.inputor.trigger('change');
          };

          SmartComplete.prototype.selectItem = function(item) {
            var itemTop, max, min;
            this.completor.children().removeClass('current-selected');
            item.addClass('current-selected');
            itemTop = item.position().top;
            min = 0;
            max = this.completor.height() - item.height();
            if (itemTop > max) {
              this.completor.scrollTop(this.completor.scrollTop() + itemTop - max);
            }
            if (itemTop < min) {
              return this.completor.scrollTop(this.completor.scrollTop() + itemTop - min);
            }
          };

          SmartComplete.prototype.showCompletor = function() {
            scope.completor.showing = true;
            scope.$apply();
          };

          SmartComplete.prototype.hideCompletor = function() {
            scope.completor.showing = false;
            scope.$apply();
          };

          SmartComplete.prototype.updateResults = function(results) {
            scope.results = results;
          };

          return SmartComplete;

        })();
        scope.completor = {
          showing: false
        };
        sc = new SmartComplete($parse(attr.smartComplete)(scope));
        sc.registerObservers();
        scope.mouseEnterItem = sc.mouseEnterItem;
        scope.appendInputorVal = sc.appendInputorVal;
        scope.afterSelectItemFunc = sc.afterSelectItemFunc;
      }
    };
  }
]);
