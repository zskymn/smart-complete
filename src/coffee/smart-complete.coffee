angular.module 'smart-complete', []
  .factory 'debounce', ['$timeout', '$q', ($timeout, $q) ->
    (func, wait, immediate) ->
      timeout = null
      deferred = $q.defer()
      () ->
        context = this
        args = arguments
        later = () ->
          timeout = null
          if not immediate
            deferred.resolve func.apply(context, args)
            deferred = $q.defer()
        callNow = immediate and not timeout
        $timeout.cancel timeout if timeout
        timeout = $timeout later, wait
        if callNow
          deferred.resolve func.apply(context, args)
          deferred = $q.defer()
        return deferred.promise
  ]
  .directive 'smartComplete', ['$compile', '$parse', 'debounce', '$timeout', ($compile, $parse, debounce, $timeout) ->
    restict: 'A',
    scope: true,
    link: (scope, elem, attr) ->
      throw 'tagName must be input or textarea' if elem[0].tagName.toLowerCase() not in ['input', 'textarea']
      class SmartComplete
        constructor: (options) ->
          @type = elem[0].tagName.toLowerCase()
          @searchFunc = options.searchFunc ? angular.noop
          @afterSelectItemFunc = options.afterSelectItemCallback ? angular.noop
          @sep = options.separetor ? ','
          @width = options.width ? 200
          @maxHeight = options.height ? 200
          @wait = options.wait ? 300
          scDom = "<div style='width: #{@width}px; max-height: #{@maxHeight}px;' 
            ng-show='completorShowing && results.length>0' class='smart-complete'>
            <div ng-repeat='res in results' ng-bind='res.label' value='{{res.value}}' label='{{res.label}}' class='res-item'
            ng-mouseenter='mouseEnterItem($event)' ng-click='appendInputorVal(res.value); afterSelectItemFunc(res.value, res.label)'></div>
            </div>"
          scWrapDom = "<div style='position: absolute; width: 0; height: 0; padding: 0; margin: 0; z-index: 99999'></div>"
          @completorWrap = $ scWrapDom
          @completor = $ scDom
          @completorWrap.append @completor
          @inputor = elem
          @inputor.after $compile(@completorWrap) scope
          @parent = @inputor.parent()
          @inputor.css 'font-size', @inputor.css('font-size')
          if @inputor.prop('tagName').toLowerCase() is 'textarea'
            @inputor.css
              overflow: 'auto'
              overflowX: 'auto'
              overflowY: 'auto'
              wordBreak: 'break-all'
          @updateCompletor = debounce (evt) ->
            return if evt.which is 13
            @showCompletor()
            pos = @inputor.caret('pos')
            val = @inputor.val()
            lv = val.substring(0, pos)
            sv = lv.split(@sep).pop()
            completorPos = @inputor.caret('offset')
            inputorOff = @inputor.offset()
            inputorPos = @inputor.position()
            sepPos = @inputor.caret('offset', @inputor.caret('pos') - sv.length)
            completorPos.top -= inputorOff.top
            completorPos.left -= inputorOff.left
            sepPos.top -= inputorOff.top
            sepPos.left -= inputorOff.left
            completorPos.left = if sepPos.top isnt completorPos.top then @inputor.caret('position', 0).left else Math.max(sepPos.left, parseInt(@inputor.css('paddingLeft'), 10))
            @completorWrap.css
              top:  (if @type is 'input' then inputorPos.top + @inputor.outerHeight() else completorPos.top + completorPos.height + inputorPos.top + 8) + 'px'
              left: Math.min(completorPos.left + inputorPos.left, inputorPos.left + @inputor.outerWidth() - @width - 2)  + 'px'
            if @lastSearchStr isnt sv
              scope.results = []
              scope.$apply()
              @searchFunc sv, @updateResults
            @lastSearchStr = sv
            return
          , @wait
        registerObservers: ->
          @inputor.bind 'click.smartComplete', (evt) => @updateCompletor(evt); return
          @inputor.bind 'keyup.smartComplete', (evt) => @updateCompletor(evt); return
          @inputor.bind 'keydown.smartComplete', (evt) => @inputorKeyDown(evt); return
          @inputor.bind 'scroll.smartComplete',  => @hideCompletor(); return
          $(document).bind 'click.smartComplete', (evt) => @blurInputorClick(evt); return
        mouseEnterItem: (evt) =>
          @selectItem $(evt.currentTarget)
          return
        blurInputorClick: (evt) ->
          target = $ evt.target
          @hideCompletor() if not (@completorWrap.find(target).length or @inputor[0] is target[0])
          return
        inputorKeyDown: (evt) ->
          switch evt.which
            when 38
              if not @completor.children().length
                return
              evt.preventDefault()
              selectItems = @completor.children '.current-selected'
              if selectItems.length
                prev = selectItems.first().prev()
                if prev.length
                  @selectItem prev
                else
                  @selectItem selectItems.first()
              else
                @selectItem @completor.children().last()
              return
            when 40
              if not @completor.children().length
                return
              evt.preventDefault()
              selectItems = @completor.children '.current-selected'
              if selectItems.length
                next = selectItems.first().next()
                if next.length
                  @selectItem next
                else
                  @selectItem selectItems.last()
              else
                @selectItem @completor.children().first()
              return
            when 13
              if not @completor.children().length
                return
              evt.preventDefault()
              selectItems = @completor.children '.current-selected'
              if selectItems.length
                @appendInputorVal selectItems.first().attr('value')
                @afterSelectItemFunc selectItems.first().attr('value'), selectItems.first().attr('label')
            else return
        appendInputorVal: (value) =>
          scope.completorShowing = false
          pos = @inputor.caret 'pos'
          val = @inputor.val()
          lv = val.substring 0, pos
          sps = lv.split @sep
          sv = sps.pop()
          sps.push value
          sps.push val.substring(pos) if val.substring(pos).length > 0
          @inputor.val sps.join(@sep)
          @inputor.caret 'pos', pos + value.length - sv.length + 1
          @inputor.focus()
          @inputor.trigger 'change'
          return
        selectItem: (item) ->
          @completor.children().removeClass 'current-selected'
          item.addClass 'current-selected'
          itemTop = item.position().top
          min = 0
          max = @completor.height() - item.height()
          if itemTop > max
            @completor.scrollTop @completor.scrollTop() + itemTop - max
          if itemTop < min
            @completor.scrollTop @completor.scrollTop() + itemTop - min
        showCompletor: ->
          scope.completorShowing = true
          scope.$apply()
          return
        hideCompletor: ->
          scope.completorShowing = false
          scope.$apply()
          return
        updateResults: (results)->
          scope.results = results
          return
      scope.completorShowing = false
      sc = new SmartComplete $parse(attr.smartComplete)(scope)
      sc.registerObservers()
      scope.mouseEnterItem = sc.mouseEnterItem
      scope.appendInputorVal = sc.appendInputorVal
      scope.afterSelectItemFunc = sc.afterSelectItemFunc
      return
  ]
