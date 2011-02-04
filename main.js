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
	var len = path_length * 15;
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
	calcInit(config.wwidth, config.wheight, config.width, config.height);
	setMouseTracker(w, config);
	for(var j=0;j<100;++j)
		calc(list);
	config.curx = max_node.pos[0] - w/2;
	config.cury = max_node.pos[1] - h/2;
		
	function loop(){
		render(ctx, links, list, maps, unit, config);
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
				config.cury += size;
			break;
		}
	}
	return {
		run: run, move:windowMove
	}
}
function render(ctx, links, list, nodes, unit, config){
	calc(list);
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
/*
function isCross(line, rect){
    var vs = [ [rect[0], rect[1]],
               [rect[1], rect[2]],
               [rect[2], rect[3]],
               [rect[3], rect[1]]];
    var f = false;
    for(var i=0; vs.length;++i){
		var l2 = vs[i];
        var d  = (l2[0][0] - line[0][0]) * (line[1][1] - line[0][1]) - (l2[1][0] - line[0][1]) * 
        if(Math.min(line[0][0], line[1][0]) > Math.max(l2[0][0],   l2[1][0]))
            continue;
        if(Math.min(line[0][1], line[1][1]) > Math.max(l2[0][1],   l2[1][1]))
            continue;
        if(Math.min(l2[1][0],     l2[1][0]) > Math.max(line[0][0], line[1][0]))
            continue;
        if(Math.min(l2[0][1],     l2[1][1]) > Math.max(line[0][1], line[1][1]))
            continue;

    }
}
function isCrossLine(
*/
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
	for(k0 in links){
		for(k1 in links[k0]){
			if(k0==k1)continue;
			var n0 = nodes[k0], n1 = nodes[k1];
			if(!n0 || !n1)
				continue;
			var r = links[k0][k1];
			//console.log(k0, k1);
			if(!visibles[k0] && !visibles[k1])
				continue;
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
			ctx.lineWidth  = r.link;
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
		//ctx.beginPath();
		//ctx.arc(pos[0], pos[1], size-1, 0, pi2, true);
		//ctx.fill();
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
	var rc  = Math.floor(255*v);
	var alpha = 0.6;
	if(rand == 0){
		return 'rgba(' + rc + ', 0, 0, '+alpha+')';
	}else if(rand==1){
		return 'rgba(0,' + rc + ', 0, '+alpha+')';
	}
	return 'rgba(0, 0, ' + rc + ', '+alpha+')';
}
function createNode(paths, unit, config){
	var w = config.wwidth, h = config.wheight;
	var node_maps = {};
	var nodes = [];
	for(var i in paths){
		if(paths[i]<unit)
			continue;
		var size = paths[i]/unit;
		if(size<10)
			continue;
		var min_w = min_h = size;
		var max_w = w - size, max_h = h - size;
		var x = Math.random()*(max_w-min_w+1) + min_w, y = Math.random()*(max_h-min_h+1) + min_h;
		var n = new Node(x, y);
		n.r = size;
		n.data = paths[i];
		n.name = i;
		var rand = Math.floor(Math.random() * 3);
		n.color = rand;
		node_maps[i] = n;
		nodes.push(n);
	}
	return [node_maps, nodes];
}
function createLinkData(links, nodes, unit){
	var h = {};
	var k0, k2;
	for(k0 in links){
		for(k1 in links[k0]){
			var n0 = nodes[k0], n1 = nodes[k1];
			if(!n0 || !n1){
				continue;
			}
			if(n0==n1)
				continue;
			var data = links[k0][k1];
			if(data < unit)
				continue;
			if(!h[k0]) h[k0] = {};
			var link = Math.sqrt(data / unit);
			h[k0][k1] = {link: link, data: data};
			if(!n1.hasLink(n0))
				n0.link(n1);
		}
	}
	return h;
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
function testSpring(){
	var f = spring([0,0], [100,100], 1, 1);
	console.log(f);
	var f = spring([0,0], [100,100], 1000, 1000);
	console.log(f);
	var f = spring([1000,1000], [0,0], 1, 1);
	console.log(f);
	var f = spring([1000,1000], [0,0], 1, 1);
	console.log(f);
	var f = spring([0,1000], [0,0], 1, 1);
	console.log(f);
}