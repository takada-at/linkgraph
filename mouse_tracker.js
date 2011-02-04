var Point = function(x, y){
    this.x = x;
    this.y = y;
};
Point.prototype.distance = function(p){
    return Math.sqrt(Math.pow(this.x-p.x, 2) + Math.pow(this.y-p.y, 2));
}

var MouseTracker = function(width, target){
    if( width.toString().indexOf("px") > 0 ){
        width = width.slice(0, -2);
    }
    this.width = width;
    this.rad_per_pic = 90.0 / width;
    this._listeners = [];
    this.target = target;
    this.handler = null;
    Event.observe(target, "mousedown", this.onmousedown.bindAsEventListener(this));
    Event.observe(target, "mouseout", this.onmouseout.bindAsEventListener(this));
    Event.observe(target, "mouseup", this.onmouseout.bindAsEventListener(this));
};

Object.extend(MouseTracker.prototype, {
    'addListener': function(listener){
        this._listeners.push(listener);
        return listener;
    },
    'removeListener': function(listener){
        this._listeners = this._listeners.without(listener);
    },
    'startTrack': function(){
        if(this.handler==null){
            this.handler = this.onmousemove.bindAsEventListener(this);
            Event.observe(this.target, "mousemove", this.handler);
        }
    },
    'stopTrack': function(){
        Event.stopObserving(this.target, "mousemove", this.handler);
        this.handler = null;
    },
    'onmousemove': function(evt){
        this.prevPointer = this.pointer;
        var x = Event.pointerX(evt),
            y = Event.pointerY(evt);


        this.pointer = new Point(x, y);
        if(this.pointer.x==null || this.pointer.y==null){
            this.pointer = this.prevPointer;
            return;
        }
        //var rad = this.rad_per_pic * this.pointer.distance(this.prevPointer);
        var yaw = this.rad_per_pic * (this.pointer.x - this.prevPointer.x);
        var pitch = this.rad_per_pic * (this.pointer.y - this.prevPointer.y);
        var ls = this._listeners;
        for(var i=0, l= ls.length;i<l;++i){
            ls[i](yaw, pitch);
        }
    },
    'onmousedown': function(evt){
        this.pointer = new Point(Event.pointerX(evt), Event.pointerY(evt));
        this.startTrack();
    },
    'onmouseout': function(){
        this.stopTrack();
    }
});