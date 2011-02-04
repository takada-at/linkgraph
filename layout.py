import math

class Node():
    def __init__(self, x, y):
        self.tuple = (x,y)
        self.velocity = (0,0)
        self.linked = []
        self.mamount  = (0,0)
    def tuple(self):
        self.tuple
    def move(self, nx, ny):
        x,y        = self.tuple
        self.mamount  = (nx-x,ny-y)
        self.tuple = (nx,ny)
    def link(self, o):
        self.linked.append(o)
        o.linked.append(self)

def spring(n1, n2, length=100.0):
    k  = 0.1
    dx = n1[0]-n2[0]
    dy = n1[1]-n2[1]
    d2 = dx**2 + dy**2
    d  = math.sqrt(d2)
    if d==0:
        return (1,1)
    cos = dx/d
    sin = dy/d
    sign = 1 if d-length>=0 else -1
    ad   = abs(d-length)
    if ad == 0:
        return (0,0)
    f = math.log(ad)*sign
    return (-k*f*cos, -k*f*sin)
def repulsive(n1,n2):
    g = 400.0
    dx = n1[0]-n2[0]
    dy = n1[1]-n2[1]
    d2 = dx**2 + dy**2
    d  = math.sqrt(d2)
    if d==0:
        return (1,1)
    cos = dx/d
    sin = dy/d
    return (g/d2*cos, g/d2*sin)
def friction(node):
    m = 0.3
    v = node.velocity
    return (-m*v[0], -m*v[1])
def move(n,dt,f):
    r = n.tuple
    v = n.velocity
    nx = r[0] + dt*v[0]
    ny = r[1] + dt*v[1]
    if nx<=min:
        nx = min
    elif nx>=max:
        nx = max
    if ny<=min:
        ny = min
    elif ny>=max:
        ny = max
    n.move(nx, ny)
    n.velocity = (v[0] + dt*f[0], v[1] + dt*f[1])
def add(n1,n2):
    return (n1[0]+n2[0],n1[1]+n2[1])
min=50
max=400
def contact(n):
    x,y = n.tuple
    return x<=min or x>=max or y<=min or y>=max
def reflect(f,n):
    x,y = n.tuple
    if x<=min or x>=max:
        return (-f[0], f[1])
    elif y<=min or y>=max:
        return (f[0], -f[1])
    else:
        return f
def calc(all):
    dt = 0.1
    total_energy = 0
    for n in all:
        link = n.linked
        f = (0,0)
        for i in link:
            f1 = spring(n.tuple, i.tuple)
            f = add(f, f1)
        for nd in all:
            if(n != nd):
                f = add(f, repulsive(n.tuple, nd.tuple))
        f = add(f, friction(n))
        if contact(n):
            f= reflect(f,n)
        move(n,0.1,f)
        total_energy += n.velocity[0]**2 + n.velocity[1]**2
    return total_energy
if __name__ == '__main__':
    import Tkinter
    import Canvas
    import random

    pos = []
    lines = []
    for i in range(15):
        x = random.randint(min, max)
        y = random.randint(min, max)
        pos.append((x,y))
    nodes = []
    for p in pos:
        nodes.append(Node(*p))
    n2 = nodes[0]
    for n1 in nodes:
        for n2 in nodes:
            if n1!=n2 and random.randint(0,5)==0:
                n1.link(n2)
    ovals = dict()
    def line():
        global lines
        for l in lines:
            c.delete(l)
        cache = {}
        lines = []
        for n in nodes:
            for nn in n.linked:
                if not (n,nn) in cache:
                    x,y = n.tuple
                    x1,y1 = nn.tuple
                    lines.append( c.create_line(x,y,x1,y1))
                    cache[(n,nn)] = True
    cnt = 0
    def render():
        global cnt
        cnt += 1
        r = calc(nodes)
        if r<=10 and cnt>=10:
            line()
            return 
        for n in nodes:
            dx, dy = n.mamount
            c.move(ovals[n], dx, dy)
        line()
        c.after(30, render)

    f = Tkinter.Frame()
    f.pack(fill='x')
    c = Canvas.Canvas(width=500,height=500,background='white')
    c.pack()
    for n in nodes:
        x, y = n.tuple
        o = c.create_oval(x-2, y-2,x+2,y+2,width=7)
        ovals[n] = o
    render()
    Tkinter.mainloop()
