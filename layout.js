function Node(x,y){
	this.pos = [x,y];
	this.linked = [];
	this.velocity = [0,0];
}
Node.prototype.move = function(nx, ny){
	this.pos = [nx, ny];
}
Node.prototype.hasLink = function(n){
	for(var i=0;i<this.linked.length;++i){
		var l = this.linked[i];
		if(n==l)return true;
	}
	return false;
}
Node.prototype.link = function(n){
	this.linked.push(n);
}
Node.ctx = {}
function spring(node1,node2,_length){
	//var length = _length || Node.ctx.spring;
	//length += r1 + r2;
    var n1 = node1.pos, n2 = node2.pos, r1 = node1.r, r2 = node2.r;
    var r = Math.max(r1,r2);
	var length = r1 + r2 + 500;
	var k = 0.1,
	dx = n1[0]-n2[0],
	dy = n1[1]-n2[1],
	d2 = Math.pow(dx,2) + Math.pow(dy,2);
	if(d2==0){
		var r0 = Math.random() * 5 - 5.0, 
		r1 = Math.random() * 5 - 5.0;
		return [r0,r1];
	}
	var d  = Math.sqrt(d2);
	var cos = dx/d,
	sin = dy/d;
	sign = d-length >= 0 ? 1 : -1,
	ad   = Math.abs(d-length);
    /*
    var ld = 500;
	var r = [cos * d2/ld, sin*d2/ld];
    console.log(r);
    return r;
     */
	if(ad == 0)
		return [0,0];
	f = Math.log(ad)*sign;
	var f1= [-k*f*cos, -k*f*sin];
    return f1;
}
function repulsive(node1,node2, _length){
    var n1 = node1.pos, n2 = node2.pos, r1 = node1.r, r2 = node2.r;
	//var length = (r1 + r2)*8;
	var g = Node.ctx.repulsive,
	dx = n1[0]-n2[0],
	dy = n1[1]-n2[1],
	d2 = Math.pow(dx,2) + Math.pow(dy,2);
	if(d2==0){
		var r0 = Math.random() * 5 - 5.0, 
		r1 = Math.random() * 5 - 5.0;
		return [r0,r1];
	}
	var d  = Math.sqrt(d2);
	var cos = dx/d,
    sin = dy/d;
    /*
    var ld = 500;
    var l2 = Math.pow(ld,2);
	var r= [- (l2/d) * cos,
			- (l2/d) * sin];
    return r;*/
	var f = [g/d2*cos, g/d2*sin];
    return f;
}
function friction(node){
	var m = 0.3,
	v = node.velocity;
	return [-m*v[0], -m*v[1]];
}
function dist(p0, p1){
	return Math.sqrt(Math.pow(p0[0] - p1[0], 2) + 
					 Math.pow(p0[1] - p1[1], 2));
}
function dotProduct(p0, p1){
	return p0[0] * p1[0] + p0[1] * p1[1];
}
function add(v1,v2){
	return [v1[0]+v2[0], v1[1]+v2[1]];
}
function move(n,dt,f){
	var r = n.pos,
	v = n.velocity,
	nx = r[0] + dt*v[0],
	ny = r[1] + dt*v[1];
	var min = n.r, hmax = Node.ctx.hmax - n.r, 
	wmax = Node.ctx.wmax - n.r;
	n.velocity = [v[0]+dt*f[0]/n.r, v[1]+dt*f[1]/n.r];
	if(nx<min){
		nx = min;
		n.velocity[0] = 0;
	}
	else if(nx>wmax){
		n.velocity[0] = 0;
		nx = wmax;
	}
	if(ny<min){
		n.velocity[1] = 0;
		ny = min;
	}
	else if(ny>hmax){
		n.velocity[1] = 0;
		ny = hmax;
	}
	n.pos = [nx,ny];
}
function calcInit(w,h,dispw, disph){
	Node.ctx.min = 0;
	Node.ctx.wmax = w;
	Node.ctx.hmax = h;
	Node.ctx.criteria = disph;
	Node.ctx.spring = disph;
	Node.ctx.repulsive = disph*40;
	Node.ctx.dt = disph / 100;
}
function calc(all, edges){
	var dt = Node.ctx.dt, total_energy = 0;
	for(var i=0;i<all.length;++i){
		var n = all[i];
		var link = n.linked;
        n.f = [0,0];
		for(j=0;j<all.length;++j){
			if(n!=all[j]){
				n.f = add(n.f, repulsive(n, all[j]));
			}
		}
	}
    for(var i=0; i<edges.length;++i){
        var edge = edges[i], nn = edge[1];
        n = edge[0];
		n.f=add(n.f, spring(n, nn));
    }
	for(var i=0;i<all.length;++i){
		n = all[i];
		n.f = add(n.f, friction(n));
		if(contact(n))
			n.f = reflect(n.f, n);
		move(n, dt, n.f);
		total_energy += Math.pow(n.velocity[0],2) + Math.pow(n.velocity[1], 2);
    }
	return total_energy;
}
function contact(n){
	var min = n.r, hmax = Node.ctx.hmax - n.r, 
	wmax = Node.ctx.wmax - n.r;
	var x = n.pos[0], y = n.pos[1];
	return x <= min || x >= wmax || y <= min || y >= hmax;
}
function reflect(f, n){
	var min = n.r, hmax = Node.ctx.hmax - n.r, 
	wmax = Node.ctx.wmax - n.r;
	var x = n.pos[0], y = n.pos[1];
	if(x <= min || x >= wmax)
		return [-f[0], f[1]];
	else if(y<=min || y>= hmax)
		return [f[0], -f[1]];
	else
		return f;
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
			n0.link(n1);
			if(!n1.hasLink(n0))
                n1.link(n0);
		}
	}
	return h;
}
function createEdges(links, nodes){
    var edges = [];
    var cache = {};
    for(var k0 in links){
        if(!cache[k0])cache[k0] = {};
        for(var k1 in links[k0]){
            if(!cache[k1])cache[k1] = {};
            if(cache[k0][k1] || cache[k1][k0])
                continue;
			var n0 = nodes[k0], n1 = nodes[k1];
			if(!n0 || !n1)
				continue;
            edges.push([n0,n1]);
            cache[k0][k1] = true;
        }
    }
    return edges;
}