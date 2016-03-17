describe('[module]smart-complete', function() {
  var $scUtil, $timeout, $q;
  beforeEach(module('smart-complete'));
  beforeEach(inject(function(_$scUtil_, _$timeout_, _$q_) {
    $scUtil = _$scUtil_;
    $timeout = _$timeout_;
    $q = _$q_;
  }));

  describe('[service]$scUtil', function() {

    describe('[method]$debounce', function() {
      it('debouncedFunc should be called once in 300ms', function() {
        var spyFunc = jasmine.createSpy('spyFunc'),
          debouncedFunc = $scUtil.debounce(spyFunc);
        debouncedFunc();
        debouncedFunc();
        $timeout.flush(200);
        debouncedFunc();
        $timeout.flush(300);
        $timeout.verifyNoPendingTasks();
        expect(spyFunc).toHaveBeenCalledTimes(1);
      });

      it('debouncedFuncWith100ms should be called once in 100ms', function() {
        var spyFunc = jasmine.createSpy('spyFunc'),
          debouncedFuncWith100ms = $scUtil.debounce(spyFunc, 100);
        debouncedFuncWith100ms();
        expect(spyFunc).not.toHaveBeenCalled();
        debouncedFuncWith100ms();
        $timeout.flush(50);
        expect(spyFunc).not.toHaveBeenCalled();
        debouncedFuncWith100ms();
        $timeout.flush(100);
        $timeout.verifyNoPendingTasks();
        expect(spyFunc).toHaveBeenCalledTimes(1);
      });

      it('debouncedFuncWithPromise should return a promise', function() {
        var deferred = $q.defer(),
          spyPromiseFunc = jasmine.createSpy('spyPromiseFunc').and.returnValue(deferred.promise),
          debouncedFuncWithPromise = $scUtil.debounce(spyPromiseFunc),
          res;
        debouncedFuncWithPromise().then(function(data) {
          res = data;
        });
        expect(res).toBeUndefined();
        deferred.resolve('ok');
        $timeout.flush(300);
        expect(res).toBe('ok');
      });
    });

    describe('[method]noopSearchFunc', function() {
      it('noopSearchFunc should return a promise with value []', function() {
        $scUtil.noopSearchFunc().then(function(data) {
          expect(data).toEqual([]);
        });
        $timeout.flush(10);
      });
    });

  });

  describe('[directive]smartComplete', function() {
    var $compile, scope;
    beforeEach(inject(function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      scope = _$rootScope_.$new();
    }));

    it('should throw error if tagName is not input or textarea', function() {
      expect(function() {
        $compile('<div smart-complete></div>')(scope);
      }).toThrow('tagName must be input or textarea');
    });

    it('after init, should create an empty hidden dom with ul.smart-complete', function() {
      var $$input = $compile('<input smart-complete>')(scope);
      scope.$digest();
      var $$completor = $$input.next();
      expect($$completor[0].tagName).toBe('UL');
      expect($$completor.hasClass('smart-complete')).toBe(true);
      expect($$completor.is(':hidden')).toBe(true);
      expect($$completor.html()).toBe('');
    });

    describe('event', function() {
      var $$input, $$completor,
        selectedClass = 'current-selected';

      beforeEach(function() {
        scope.searchFunc = function(s) {
          return $q.when(['hate', 'love', 'like'].filter(function(item) {
            return item.indexOf(s) !== -1;
          }));
        };
        scope.sep = false;
        scope.width = '100%';
        scope.height = '200';
        scope.itemClickCb = function() {};
        scope.enterCb = function() {};

        $$input = $([
          '<input style="width: 200px" smart-complete="searchFunc"',
          'sc-sep="sep"',
          'sc-width="width"',
          'sc-height="height"',
          'sc-item-click-cb="itemClickCb"',
          'sc-enter-cb="enterCb"',
          '>'
        ].join(' '));
        $('body').html($$input);
        $compile($$input)(scope);
        $$completor = $$input.next();
      });

      function triggerInputKeyup(which) {
        which = which || 0;
        var keyUpEvt = $.Event('keyup');
        keyUpEvt.which = which;
        $$input.trigger(keyUpEvt);
      }

      function triggerInputKeyDown(which) {
        which = which || 0;
        var keyDownEvt = $.Event('keydown');
        keyDownEvt.which = which;
        $$input.trigger(keyDownEvt);
      }

      it('should show 3 items when click input', function() {
        $$input.trigger('click');
        scope.$digest();
        expect($$completor.children().length).toBe(3);
      });

      it('should show 2 items when type key "l"', function() {
        $$input.val('l');
        triggerInputKeyDown('l'.charCodeAt());
        triggerInputKeyup('l'.charCodeAt());
        $timeout.flush(300);
        expect($$completor.children().length).toBe(2);
      });

      it('should show 1 item when input word "ha"', function() {
        $$input.val('ha');
        triggerInputKeyup(0);
        $timeout.flush(300);
        expect($$completor.children().length).toBe(1);
      });

      it('item should be selected when type key up', function() {
        $$input.trigger('click');
        scope.$digest();
        triggerInputKeyDown(38);
        expect($$completor.children().last().hasClass(selectedClass)).toBe(true);
        expect($$input.val()).toBe('like');
      });

      it('when sep is ",", should show 2 items when iput word "hate,l"', function() {
        scope.sep = ',';
        scope.$digest();
        $$input.val('hate,l');
        triggerInputKeyup(0);
        $timeout.flush(300);
        expect($$completor.children().length).toBe(2);
        triggerInputKeyDown(40);
        expect($$completor.children().first().hasClass(selectedClass)).toBe(true);
        expect($$input.val()).toBe('hate,love');
        triggerInputKeyDown(40);
        expect($$completor.children().last().hasClass(selectedClass)).toBe(true);
        expect($$input.val()).toBe('hate,like');
      });

      it('completor should be hidden after type key enter', function() {
        $$input.trigger('click');
        scope.$digest();
        expect($$completor.is(':visible')).toBe(true);
        triggerInputKeyDown(13);
        $timeout.flush(10);
        expect($$completor.is(':visible')).toBe(false);
      });

      it('completor should be hidden after type key tab', function() {
        $$input.trigger('click');
        scope.$digest();
        expect($$completor.is(':visible')).toBe(true);
        triggerInputKeyDown(9);
        triggerInputKeyup(9);
        $timeout.flush(300);
        expect($$completor.is(':visible')).toBe(false);
      });

      it('mouseenter, mouseleave and click on item', function() {
        $$input.trigger('click');
        scope.$digest();
        var firstItem = $$completor.children().first();
        firstItem.trigger('mouseenter');
        expect(firstItem.hasClass(selectedClass)).toBe(true);
        firstItem.trigger('mouseleave');
        expect(firstItem.hasClass(selectedClass)).toBe(false);
        firstItem.trigger('click');
        $timeout.flush(10);
        expect($$completor.is(':visible')).toBe(false);
        expect($$input.val()).toBe('hate');
      });

      it('items shuould be empty when smart-complete return $q.reject', function() {
        scope.searchFunc = function() {
          return $q.reject();
        };
        $$input.trigger('click');
        scope.$digest();
        expect($$completor.children().length).toBe(0);
      });

      it('left of completor should be 112', function() {
        scope.width = '100';
        scope.sep = ',';
        $$completor.css({
          position: 'absolute'
        });
        $$input.val('loooooooooooooooooooooooooooooooooooooooooooogword,hate,like');
        $$input.trigger('click');
        $$input.caret('pos', 56);
        scope.$digest();
        expect($$completor.position().left).toBe(112);
        triggerInputKeyDown(38);
        triggerInputKeyup(38);
        $timeout.flush(300);
        expect($$input.val()).toBe('loooooooooooooooooooooooooooooooooooooooooooogword,hate,like');
      });
    });

    describe('textarea', function() {
      var $$textarea, $$completor,
        selectedClass = 'current-selected';

      beforeEach(function() {
        scope.searchFunc = function(s) {
          return $q.when(['hate', 'love', 'like'].filter(function(item) {
            return item.indexOf(s) !== -1;
          }));
        };
        scope.sep = false;

        $$textarea = $('<textarea smart-complete="searchFunc" sc-sep="sep"></textarea>');
        $('body').html($$textarea);
        $compile($$textarea)(scope);
        $$completor = $$textarea.next();
      });
      it('textarea is ok', function() {
        $$textarea.trigger('click');
        scope.$digest();
        expect($$completor.is(':visible')).toBe(true);
        expect($$completor.children().length).toBe(3);
        var firstItem = $$completor.children().first();
        firstItem.trigger('mouseenter');
        expect(firstItem.hasClass(selectedClass)).toBe(true);
      });
    });

  });

});
