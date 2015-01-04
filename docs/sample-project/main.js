//
//  main.js
//
//  A project template for using arbor.js
//

(function($){

  var Renderer = function(canvas){
    var canvas = $(canvas).get(0)
    //var ctx = canvas.getContext("2d");
	var fabricCanvas = new fabric.StaticCanvas('viewport');
    var particleSystem

    var that = {
      init:function(system){
        //
        // the particle system will call the init function once, right before the
        // first frame is to be drawn. it's a good place to set up the canvas and
        // to pass the canvas size to the particle system
        //
        // save a reference to the particle system for use in the .redraw() loop
        particleSystem = system

        // inform the system of the screen dimensions so it can map coords for us.
        // if the canvas is ever resized, screenSize should be called again with
        // the new dimensions
        particleSystem.screenSize(canvas.width, canvas.height) 
        particleSystem.screenPadding(80) // leave an extra 80px of whitespace per side
		
		//ctx.fillStyle = "white"
        //ctx.fillRect(0,0, canvas.width, canvas.height)
		
		fabricCanvas.add(new fabric.Rect({
			left: 0, 
			top: 0, 
			fill: 'white',
			width: canvas.width,
			height: canvas.height
		}));
        
        // set up some event handlers to allow for node-dragging
        that.initMouseHandling()
      },
      
      redraw:function(){
        // 
        // redraw will be called repeatedly during the run whenever the node positions
        // change. the new positions for the nodes can be accessed by looking at the
        // .p attribute of a given node. however the p.x & p.y values are in the coordinates
        // of the particle system rather than the screen. you can either map them to
        // the screen yourself, or use the convenience iterators .eachNode (and .eachEdge)
        // which allow you to step through the actual node objects but also pass an
        // x,y point in the screen's coordinate system
        // 
        //ctx.fillStyle = "white"
        //ctx.fillRect(0,0, canvas.width, canvas.height)
        
        particleSystem.eachEdge(function(edge, pt1, pt2){
          // edge: {source:Node, target:Node, length:#, data:{}}
          // pt1:  {x:#, y:#}  source position in screen coords
          // pt2:  {x:#, y:#}  target position in screen coords

          // draw a line from pt1 to pt2
          // ctx.strokeStyle = "rgba(0,0,0, .333)"
          // ctx.lineWidth = 1
          // ctx.beginPath()
          // ctx.moveTo(pt1.x, pt1.y)
          // ctx.lineTo(pt2.x, pt2.y)
          // ctx.stroke()
		  var w = 30;
		  //size of pointer
		  var pullBack = 20;
		  var line;
		  var tip;
		  if (edge.data == undefined || edge.data.line == undefined){
				if (edge.data == undefined) edge.data = {};
				line = new fabric.Line(
					[pt1.x, pt1.y, pt2.x, pt2.y],
					{stroke: 'red',
					strokeWidth:1,
					strokeDashArray : [4, 8]});
				tip = new fabric.Path('M -10 5 L 0 0 L -10 -5 z');
				var angle = Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x);
				var top = pt2.y - pullBack * Math.sin(angle);
				var left = pt2.x - pullBack * Math.cos(angle);
				tip.set({fill: 'black', left:left, top:top, angle: angle * 180 / Math.PI, originX:'center', originY:'center'});
			}
			else {
				line = edge.data.line;
				tip = edge.data.tip;
				fabricCanvas.remove(line);
				fabricCanvas.remove(tip);
				line.set({
					x1: pt1.x,
					y1: pt1.y,
					x2: pt2.x,
					y2: pt2.y,
				});
				var angle = Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x);
				var top = pt2.y - pullBack * Math.sin(angle);
				var left = pt2.x - pullBack * Math.cos(angle);
				tip.set({fill: 'black', left:left, top:top, angle: angle * 180 / Math.PI, originX:'center', originY:'center'});
			}
		  edge.data.line = line;
		  edge.data.tip = tip;
		  fabricCanvas.add(line);
		  fabricCanvas.add(tip);
        })

        particleSystem.eachNode(function(node, pt){
          // node: {mass:#, p:{x,y}, name:"", data:{}}
          // pt:   {x:#, y:#}  node position in screen coords

          // draw a rectangle centred at pt
			var w = 30
			var fabGroup;
			if (node.data.fabGroup == undefined){
				var text = new fabric.Text(node.data.text, {
					fontSize: 30,
					originX: 'center',
					originY: 'center'});		  
				var rect = new fabric.Rect({
					fill: node.data.alone ? 'orange' : 'cyan',
					width:w,
					height:w,
					originX: 'center',
					originY: 'center'});
				fabGroup = new fabric.Group([  rect, text ], {
					left: pt.x - w/2, 
					top: pt.y - w/2});
			}
			else {
				fabGroup = node.data.fabGroup;
				fabricCanvas.remove(fabGroup);
				fabGroup.set({
					left: pt.x - w/2, 
					top: pt.y - w/2});
			}
			node.data.fabGroup = fabGroup;
			fabricCanvas.add(fabGroup);
        })    			
      },
      
      initMouseHandling:function(){
        // no-nonsense drag and drop (thanks springy.js)
        var dragged = null;

        // set up a handler object that will initially listen for mousedowns then
        // for moves and mouseups while dragging
        var handler = {
          clicked:function(e){
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            dragged = particleSystem.nearest(_mouseP);

            if (dragged && dragged.node !== null){
              // while we're dragging, don't let physics move the node
              dragged.node.fixed = true
            }

            $(canvas).bind('mousemove', handler.dragged)
            $(window).bind('mouseup', handler.dropped)

            return false
          },
          dragged:function(e){
            var pos = $(canvas).offset();
            var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)

            if (dragged && dragged.node !== null){
              var p = particleSystem.fromScreen(s)
              dragged.node.p = p
            }

            return false
          },

          dropped:function(e){
            if (dragged===null || dragged.node===undefined) return
            if (dragged.node !== null) dragged.node.fixed = false
            dragged.node.tempMass = 1000
            dragged = null
            $(canvas).unbind('mousemove', handler.dragged)
            $(window).unbind('mouseup', handler.dropped)
            _mouseP = null
            return false
          }
        }
        
        // start listening
        $(canvas).mousedown(handler.clicked);

      },
      
    }
    return that
  }    

  $(document).ready(function(){
    var sys = arbor.ParticleSystem(1000, 600, 0.5) // create the system with sensible repulsion/stiffness/friction
    sys.parameters({gravity:true}) // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = Renderer("#viewport") // our newly created renderer will have its .init() method called shortly by sys...

    // add some nodes to the graph and watch it go...
    // sys.addEdge('a','b')
    // sys.addEdge('a','c')
    // sys.addEdge('a','d')
    // sys.addEdge('a','e')
    // sys.addNode('f', {alone:true, mass:.25})

    // or, equivalently:
    //
    sys.graft({
      nodes:{
        f:{alone:true, mass:.25, text:'f'},
		a: { text:'a'},
		b: { text:'b'},
		c: { text:'c'},
		d: { text:'d'},
		e: { text:'e'},
		g: { text:'g'},
		h: { text:'h'},
		i: { text:'i'},
		j: { text:'j'},
		k: { text:'k'},
      }, 
      edges:{
        a:{ b:{},
            c:{},
            d:{},
            e:{},
			      g:{},
            h:{},
            i:{},
            j:{},
			      k:{},
          },
		    b:{ 
            c:{},
            d:{},
            e:{},
			      g:{},
            h:{},
            i:{},
            j:{},
			      k:{},
          },
      }
    })
    
  })

})(this.jQuery)
