function Main(ctx, w, h, data){
	var paths = data.paths;
	var max = 0, path_length = 0, max_path;
	for(var k in paths){
		if(paths[k]>max){
			max = paths[k];
			max_path = k;
		}
		++path_length;
	}
	var unit = Math.floor(max / 100);
	var len = Math.max(path_length * 10, w);
	var config = {
		width: w, height: h, padding: 5,
		wwidth: len, wheight: len,
		curx: 0, cury: 0
	}
	ctx.font = "18px";
	var r = createNode(paths, unit, config);
	var maps = r[0], list = r[1];
	var max_node;
	for(var i in maps){
		if(!max_node || maps[i].linked.length > max_node.linked.length)
			max_node = maps[i];
	}
	var links = createLinkData(data.links, maps, unit);
    var edges = createEdges(links, maps);
	calcInit(config.wwidth, config.wheight, config.width, config.height);
	setMouseTracker(w, config);
	for(var j=0;j<100;++j)
		calc(list, edges);
	config.curx = max_node.pos[0] - w/2;
	config.cury = max_node.pos[1] - h/2;
		
	function loop(){
		render(ctx, links, list, maps, edges, unit, config);
	}
	function run(){
		//testSpring(); return;
		setInterval(loop, 100);
	}
	function windowMove(direction, size){
		var xmax = config.wwidth - config.width;
		var ymax = config.wheight - config.height;
		switch(direction){
		case 1: //L
			if(config.curx > size)
				config.curx -= size;
			else
				config.curx = 0;
			break;
		case 2: //U
			if(config.cury > size)
				config.cury -= size;
			else
				config.cury = 0;
			break;
		case 3: //R
			if(config.curx < xmax)
				config.curx += size;
			else
				config.curx = xmax;
			break;
		case 4: //D
			if(config.cury < ymax)
				config.cury += size;
			else
				config.cury = ymax;
			break;
		}
	}
	return {
		run: run, move:windowMove
	}
}
function render(ctx, links, list, nodes, edges, unit, config){
	calc(list, edges);
	ctx.clearRect(0,0, config.width, config.height);
	var visibles = calcVisibility(nodes, config);
	renderLines(ctx, links, nodes, unit, visibles, config);
	renderNode(ctx, nodes, unit, visibles, config);
	
}
function convert(pos, config){
	return [pos[0] - config.curx, pos[1] - config.cury];
}
function isVisible(node, config){
	var pos = convert(node.pos, config), r = node.r, r2 = Math.pow(r,2),
	w = config.wwidth, h = config.wheight;
	if(pos[0] > 0 && pos[0] < w && pos[1] > 0 && pos[1] < h){
		return true;
	}
    var edges = [[w,0], [0, h], [-w, 0], [0, -h]], 
	points = [[0,0],[w,0], [w,h], [0,h]];
	var f = false;
	for(var i=0; i<edges.length;++i){
		var v = edges[i], p = points[i],
		c = [pos[0] - p[0], pos[1] - p[1]];
		var vc = dotProduct(v,c);
		if(vc < 0){
			f = dist([0,0], c) < r;
			if(f)return f;
		}
		var v2 = dotProduct(v,v);
		if(vc > v2){
			var end = add(p, v),
			d0 = Math.pow(end[0]-pos[0], 2) + Math.pow(end[1]-pos[1], 2),
			f = d0 < r2;
			if(f)return f;
		}
		var c2 = dotProduct(c,c);
		f = c2 - (vc/v2)*vc < r2;
		if(f)return f;
	}
	return f;
}
function isCross(line, rect){
    var vs = [ [rect[0], rect[1]],
               [rect[1], rect[2]],
               [rect[2], rect[3]],
               [rect[3], rect[1]]];
    var f = false;
    var a = line[0], b = line[1];
    for(var i=0; i<vs.length;++i){
		var l2 = vs[i], c = l2[0], d = l2[1];
        var tc = (a[0] - b[0])*(c[1] - a[1]) + (a[1] - b[1])*(a[0] - c[0]);
        var td = (a[0] - b[0])*(d[1] - a[1]) + (a[1] - b[1])*(a[0] - d[0]);
        //直線ab と 線分 cd が交差するか
        var cros1 = tc*td<0;
        if(!cros1)
            continue;
        //直線cd と 線分ab が交差するか
        var ta = (c[0] - d[0])*(a[1] - c[1]) + (c[1] - d[1])*(c[0] - a[0]);
        var tb = (c[0] - d[0])*(b[1] - c[1]) + (c[1] - d[1])*(c[0] - b[0]);
        if(ta*tb < 0) //交差する
            return true;
    }
}
function calcVisibility(nodes, config){
	var visibleNodes = {};
	for(var k in nodes){
		var n = nodes[k];
		//console.log([config.curx, config.cury], n.pos);
		if(!isVisible(n, config))
			continue;
		visibleNodes[k] = 1;
	}
	return visibleNodes;
}
var cos30 = Math.sqrt(3)/2.0, sin30 = 0.5;
var cos150 = - cos30, sin150 = sin30;
function renderLines(ctx, links, nodes, unit, visibles, config){
	var k0, k2;
	var objects = [];
    var w = config.width, h = config.height;
    var xmax = config.curx + w, ymax = config.cury + h;
    var rect = [[config.curx, config.cury], [xmax, config.cury],
                [config.cury, ymax       ], [xmax, ymax       ]];
	for(k0 in links){
		for(k1 in links[k0]){
			if(k0==k1)continue;
			var n0 = nodes[k0], n1 = nodes[k1];
			if(!n0 || !n1)
				continue;
            var linev = [n0.pos, n1.pos];
            //両端が見えなくて、windowと交差しないものは描画しない
            if(!visibles[k0] && !visibles[k1] && !isCross(linev, rect))
                continue;

			var r = links[k0][k1];
			var p0 = convert(n0.pos, config),
			p1 = convert(n1.pos, config);
			var d = dist(p0, p1), dx = p1[0] - p0[0], dy = p1[1] - p0[1];
			if(d==0)continue;
			var str = r.data.toString();
			var fw  = str.length * 15;//ctx.measureText(str).width;
			var cos = dx/d, sin = dy/d;
			var tmp = [cos*(n0.r + 15), sin*(n0.r + 15)];
			var ap  = add(p0, tmp);
			var rv  = [cos*10, sin*10];
			var lp  = add(ap, [rv[0] * cos150 - rv[1] * sin150,   rv[0] * sin150 + rv[1] * cos150]);
     		var rp  = add(ap, [rv[0] * cos150 + rv[1] * sin150, - rv[0] * sin150 + rv[1] * cos150]);
			var mid = add(p0, [cos * (n0.r + fw + 20), sin*(n0.r + fw + 20)]);
			var start = add(p0, [cos*n0.r, sin*n0.r]);
			var end = add(p0, [cos*(d-n1.r),sin*(d-n1.r)]);
     		ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
			ctx.lineWidth  = r.link + 1;
			ctx.beginPath();
			ctx.moveTo(start[0], start[1]);
			ctx.lineTo(ap[0], ap[1]);
			ctx.lineTo(lp[0], lp[1]);
			ctx.moveTo(rp[0], rp[1]);
			ctx.lineTo(ap[0], ap[1]);
			ctx.lineTo(end[0], end[1]);
			ctx.stroke();
			mid[0] -= fw/2;
			ctx.fillStyle = 'rgb(100,100,100)';
			ctx.fillText(str, mid[0], mid[1]);
		}
	}
}
function renderNode(ctx, nodes, unit, visibles, config){
	var pi2 = Math.PI*2;
	for(var k in visibles){
		var n = nodes[k];
		var size = n.r;
		var pos = convert(n.pos, config);
		ctx.lineWidth  = 1;
		ctx.fillStyle = 'rgb(255, 255, 255)';
		ctx.beginPath();
		ctx.arc(pos[0], pos[1], size, 0, pi2, true);
		ctx.fillStyle = selectColor(n.color, n.data, unit);
		ctx.fill();
		ctx.fillStyle = 'rgb(50,50,50)';
		ctx.fillText(k, pos[0]-size, pos[1]);
		ctx.fillText(n.data, pos[0]-size + 18, pos[1] + 18);
	}
}
function selectColor(rand, data, unit){
	var v = Math.abs(Math.sqrt(data/(unit*100))) % 1;
	var rc  = Math.min(Math.floor(255*v) + 100, 255);
	var alpha = 0.6;
	if(rand == 0){
		return 'rgba(' + rc + ', 0, 0, '+alpha+')';
	}else if(rand==1){
		return 'rgba(0,' + rc + ', 0, '+alpha+')';
	}
	return 'rgba(0, 0, ' + rc + ', '+alpha+')';
}
function setMouseTracker(w, config){
	var c = $('canvas');
	var mc = new MouseTracker(w, c);
	var xmax = config.wwidth - config.width;
	var ymax = config.wheight - config.height;
	mc.addListener(function(yaw, pitch){
					   var tmpx = config.curx - yaw * 10;
					   var tmpy = config.cury - pitch * 10;
					   if(tmpx < 0)tmpx = 0;
					   if(tmpx > xmax)tmpx = xmax;
					   if(tmpy < 0)tmpy = 0;
					   if(tmpx > ymax)tmpy = ymax;
					   config.curx = tmpx;
					   config.cury = tmpy;
				   });
}
