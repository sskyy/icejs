/**
 * this is the main file
 */

var CWIDTH = 9, // width of on character,
  PADDING = 30,
  FNHEIGHT = 30,
  TEXT_FIX = 10,
  THEIGHT=10,
  FILL = 'lightsteelblue',
  moduleRef = {} //will collect the el ref for each module


function createSVGElement( e,attr){
  var $el = Snap( document.createElementNS('http://www.w3.org/2000/svg', e) )
  return attr ? $el.attr(attr) : $el
}

function createSVGText( text ){
  var $text = createSVGElement('text');
  $text.node.innerHTML=text;
  Snap('svg').append($text);
  $text.data('width',$text.getBBox().width);
  return $text.remove()
}


function createFnRect($t,attr){
  var $g = createSVGElement('g'),
    $r = createSVGElement('rect', $.extend({
      x:0,
      y:0,
      fill:FILL
    },attr))

  $t.attr({x:PADDING/2,y:TEXT_FIX})

  return $g.append( $r).append($t)
}

function tranStr( obj ){
  return 'translate('+obj.x+','+obj.y+')'
}

function createListenersG( name, args, listeners ){
  args = args.length ? '['+args.toString()+']' :''
  var $g = createSVGElement('g'),
    $name = createSVGText(name),
    $args = createSVGText(args),
    $nsLine = createSVGElement('line'),
    $listeners = createSVGElement('g'),
    $listenerLine = createSVGElement('line')


  var maxWidth = 0,
    height = 0,
    lastHeight = 0

  listeners.forEach(function( l,i  ){
    var $l = createListener( l )

    if( $l.data('width') > maxWidth ) maxWidth = $l.data('width')

    //set position for it
    $l.transform(tranStr({x:PADDING,y:height}))

    height+= $l.data('height')
    if( i!==listeners.length-1 )  height+= PADDING

    if( i==listeners.length -1) lastHeight = $l.data('height')

    $l.appendTo( $listeners )
  })

  $listeners.data('width',maxWidth).data('height',height).appendTo( $g)

  $listenerLine.attr({x1:PADDING,x2:PADDING,y1:0,y2:height-lastHeight+FNHEIGHT}).appendTo($g)

  $nsLine.attr({x1:0,x2:PADDING,y1:FNHEIGHT/2,y2:FNHEIGHT/2}).appendTo($g)

  $name.attr({x:-PADDING/2 -$name.data('width'),y:THEIGHT  }).attr('class','match').appendTo($g)
  $args.attr({x:-PADDING/2-$args.data('width'),y:FNHEIGHT/2 + THEIGHT+4 }).attr('class','args').appendTo($g)

  $g.data('width',PADDING+maxWidth).data('height',height)
  return $g
}

function createListener( listener ){
  var $g = createSVGElement('g'),
    $attaches = createSVGElement('g'),
    $name = createSVGText(listener.vendor ? listener.name + '('+listener.vendor+')' : listener.name),
    fnWidth,$fn



  var width = 0,
    maxHeight = 0

  listener.stack.forEach(function( attach ){
    var $attach = createAttach( attach )
    $attach.transform( tranStr({x:width,y:FNHEIGHT}))

    width += $attach.data('width')

    if( $attach.data('height') > maxHeight ) maxHeight = $attach.data('height')

    $attach.appendTo($attaches )
  })

  $attaches.appendTo( $g)
  fnWidth = width>$name.data('width')+PADDING?width:$name.data('width')+PADDING
  $fn = createFnRect( $name,{width:fnWidth,height:FNHEIGHT}).appendTo($g)

  if( !moduleRef[listener.module] ) moduleRef[listener.module] = []
  moduleRef[listener.module].push($fn)
  if( listener.vendor && !moduleRef[listener.vendor] ) moduleRef[listener.vendor] = []
  listener.vendor && moduleRef[listener.vendor].push($fn)

  $g.data('width',fnWidth).data('height',FNHEIGHT+maxHeight)
  return $g
}

function createAttach( attach ){
  var $g = createSVGElement('g'),
    $name = createSVGText(attach.name),
    $eLine = createSVGElement('line'),
    nameWidth = $name.data('width') + PADDING


  var height = PADDING,
    maxWidth = nameWidth,
    lastHeight = 0

  attach.attached.forEach( function( listenersG,i ){
    var $listenersG = createListenersG( listenersG.namespace, listenersG.arguments, listenersG.listeners)

    $listenersG.transform(tranStr({x:nameWidth,y:height}))

    height += $listenersG.data('height')
    if( i!== attach.attached.length -1) height+=PADDING

    if( i == attach.attached.length -1 ) lastHeight = $listenersG.data('height')

    if( $listenersG.data('width') > maxWidth ) maxWidth = $listenersG.data('width')

    $listenersG.appendTo( $g )
  })

  if( attach.attached.length ){
    $eLine.attr({x1:nameWidth,x2:nameWidth,y1:0,y2:height-lastHeight+FNHEIGHT/2+1}).appendTo($g)
  }

  $name.attr({x:PADDING/2,y:TEXT_FIX}).attr('class','event').appendTo($g)

  $g.data('width',maxWidth+nameWidth).data('height',height)
  return $g
}

$(function(){
  var diagramGetSelector = '#getDiagram',
    urlSelector  = '#url',
    diagramSelector = '#diagram',
    moduleSwitchSelector = '#moduleSwitches',
    colorPickerSelector = '.colorPicker'

  $(diagramGetSelector).click(function(){
    getDiagram( $(urlSelector).val() )
  })
  $(urlSelector).keyup(function(e){
    if(e.keyCode == 13){
      getDiagram( $(urlSelector).val())
    }
  })

  function getDiagram(url) {
    $.get( url, function (data) {
      var $svg = Snap(diagramSelector),
        $diagram = createListener({name: 'global', stack: data, module: 'global'})

      $svg.append($diagram).attr('width', $diagram.data('width') + 400)
      createModuleSwitch()
    })

  }

  //read global variable moduleRef
  function createModuleSwitch(){
    var $moduleSwitches = $(moduleSwitchSelector)
    $moduleSwitches.children().remove()

    for (var name in moduleRef) {
      (function (name) {
//        var $switch = $("<div class='switch'><a class='colorPicker'></a><span>"+name+"</span></div>")
        var $switch = $("<div class='switch'></div>")
          .append("<input class='"+colorPickerSelector.substr(1)+"'/>")
          .append("<span>"+name+"</span>")

        $switch.hover(function () {
          moduleRef[name].forEach(function ($e) {
            $e.select('rect').attr({
              stroke: '#000',
              'stroke-opacity':0.2,
              'stroke-width':8
            })

          })
        }, function () {
          moduleRef[name].forEach(function ($e) {
            $e.select('rect').attr({stroke: 'none'})

          })
        }).appendTo($moduleSwitches)

        $switch.find(colorPickerSelector).simpleColor({
          defaultColor : FILL,
          cellWidth :16,
          cellHeight : 16,
          boxWidth : 16,
          boxHeight:16,
          chooserCSS:{
            border:"1px solid #fff",
            background: "#f5f5f5"
          },
          displayCSS:{
            "-webkit-border-radius": "2px",
            "-moz-border-radius": "2px",
            "border-radius": "2px",
            "border":"none",
            "border-bottom": "1px solid rgba(0,0,0,0.2)"
          },
          onSelect : function( c){
            moduleRef[name].forEach(function ($e) {
              $e.select('rect').attr({fill: c})
            })
          }
        })
      })(name)
    }


  }

  getDiagram('/dev/data')
})



