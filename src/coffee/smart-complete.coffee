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
          @sep = options.seperator ? ','
          @width = options.width ? 200
          @maxHeight = options.height ? 200
          @wait = options.wait ? 300
          scDom = "<div style='width: #{@width}px; max-height: #{@maxHeight}px;' 
            ng-show='completor.showing && results.length>0' class='smart-complete' custom-scrollbar>
            <div ng-repeat='res in results' ng-bind='res.label' value='{{res.value}}' label='{{res.label}}' class='res-item'
            ng-mouseenter='mouseEnterItem($event)' ng-click='appendInputorVal(res.value);afterSelectItemFunc(res.value, res.label); completor.showing=false; '></div>
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
          @updateCompletor = debounce (evt, alwaysUpdate) ->
            if evt.which is 13
              if scope.completor.showing
                evt.preventDefault()
                scope.completor.showing = false
                scope.$apply()
              return
            return if evt.which in [38, 40]
            pos = @inputor.caret('pos')
            val = @inputor.val()
            lv = val.substring(0, pos)
            @showCompletor()
            sv = lv.split(@sep).pop()
            if val.substring(pos)
              csv = sv + val.substring(pos).split(@sep)[0]
            else
              csv = sv
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
              left: Math.max(inputorPos.left,  Math.min(completorPos.left + inputorPos.left, inputorPos.left + @inputor.width() + parseInt(@inputor.css('paddingLeft')) + parseInt(@inputor.css('paddingRight')) - @width - 2))  + 'px'
            scope.results = []
            scope.$apply()
            @searchFunc csv, @updateResults
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
          return if not scope.completor.showing
          evt.preventDefault() if evt.which is 13
          switch evt.which
            when 38
              if not @completor.children().length
                return
              evt.preventDefault()
              selectItems = @completor.children '.current-selected'
              if selectItems.length
                prev = selectItems.first().prev()
                if prev.length
                  shouldSelectItem = prev
                else
                  shouldSelectItem = selectItems.first()
              else
                shouldSelectItem = @completor.children().last()
              @selectItem shouldSelectItem
              @appendInputorVal shouldSelectItem.first().attr('value')
              return
            when 40
              if not @completor.children().length
                return
              evt.preventDefault()
              selectItems = @completor.children '.current-selected'
              if selectItems.length
                next = selectItems.first().next()
                if next.length
                  shouldSelectItem = next
                else
                  shouldSelectItem = selectItems.last()
              else
                shouldSelectItem = @completor.children().first()
              @selectItem shouldSelectItem
              @appendInputorVal shouldSelectItem.first().attr('value')
              return
            else return
        appendInputorVal: (value) =>
          pos = @inputor.caret 'pos'
          val = @inputor.val()
          lv = val.substring 0, pos
          sps = lv.split @sep
          sv = sps.pop()
          sps.push value
          if val.substring(pos)
            rps = val.substring(pos).split(@sep)
            rps.shift()
            if rps.join(@sep)
              sps.push(rps.join(@sep))
          @inputor.val sps.join(@sep)
          @inputor.caret 'pos', pos + value.length - sv.length
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
          scope.completor.showing = true
          scope.$apply()
          return
        hideCompletor: ->
          scope.completor.showing = false
          scope.$apply()
          return
        updateResults: (results)->
          scope.results = results
          return
      scope.completor = {showing: false}
      sc = new SmartComplete $parse(attr.smartComplete)(scope)
      sc.registerObservers()
      scope.mouseEnterItem = sc.mouseEnterItem
      scope.appendInputorVal = sc.appendInputorVal
      scope.afterSelectItemFunc = sc.afterSelectItemFunc
      return
  ]
