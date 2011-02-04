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
function spring(n1,n2,r1,r2,_length){
	//var length = _length || Node.ctx.spring;
	//length += r1 + r2;
    var r = Math.max(r1,r2);
	var length = r*8;
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
	//return [cos * d2/length, sin*d2/length];
	if(ad == 0)
		return [0,0];
	f = Math.log(ad)*sign;
	return [-k*f*cos, -k*f*sin];
}
function repulsive(n1,n2,r1,r2, _length){
	var length = (r1 + r2)*8;
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
	sin = dy/d, l2 = Math.pow(length,2);
	//return [- (l2/d) * cos,
	//		- (l2/d) * sin];
	return [g/d2*cos, g/d2*sin];
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
	n.velocity = [v[0]+dt*f[0], v[1]+dt*f[1]];
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
	Node.ctx.repulsive = disph / 4.0;
	Node.ctx.dt = disph / 100;
}
function calc(all){
	var dt = Node.ctx.dt, total_energy = 0;
	for(var i=0;i<all.length;++i){
		var n = all[i];
		var link = n.linked, f = [0,0];
		for(var j=0;j<link.length;++j){
			f=add(f, spring(n.pos, link[j].pos, n.r, link[j].r));
		}
		for(j=0;j<all.length;++j){
			if(n!=all[j]){
				f = add(f, repulsive(n.pos, all[j].pos, n.r, all[j].r));
			}
		}
		f = add(f, friction(n));
		if(contact(n))
			f = reflect(f,n);
		move(n, dt, f);
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