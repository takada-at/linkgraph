import re
from datetime import datetime
import sys
#import json
config = {
	'path_column': 11,
	'time_column': 1,
	'time_format': '%Y-%m-%d %H:%M:%S',
	'max_interval': 1800,
	}
expr   = re.compile('opensocial_viewer_id=(\d+)')
def parseLine(line, pathcol, timecol, timeformat, paths):
	cols = line.split(' ')
	path = cols[pathcol]
	if path.find('generator.php') > 0:
		return (None, None, None)
	time = datetime.strptime(' '.join(cols[timecol:timecol+2]), timeformat)
	m    = expr.search(path)
	if not m:
		return  (None, None, None)
	sid = m.group(1)
	if not sid:
		return None
	idx = path.find('?')
	if idx > 0:
		path = path[0:idx]
	path = '/'.join(path.split('/')[:4])
	if not path in paths:
		paths[path] = 1
	else:
		paths[path] += 1
	return (sid, path, time)
def parseFile(file, config):
	timecol = config['time_column']
	pathcol = config['path_column']
	time_format = config['time_format']
	interval   = config['max_interval']

	paths = {}
	users = {}
	times = {}
	links = {}
	for line in file:
		sid, path, time = parseLine(line, pathcol, timecol, time_format, paths)
		if not sid: continue
		if not sid in times:
			times[sid] = time
			users[sid] = [[path]]
		else:
			times[sid] = time
			if (times[sid] - time).seconds < interval:
				p1 = users[sid][-1][-1]
				if not p1 in links: links[p1] = {}
				if not path in links[p1]: links[p1][path] = 0
				links[p1][path] += 1
				users[sid][-1].append(path)
			else:
				users[sid].append([path])
	#print 'users: {'
	#for k,v in users.iteritems():
	#	print '  %s: %s,' % (k, v)
	#print '}'
	print '{"links": {'
	f = False
	for k,v in links.iteritems():
		if not f:
			f = True
		else:
			print ','
		s = ('  "%s": %s' % (k,v)).replace("'", "\"")
		print s,
	print '},'
	print '"paths": {'
	f = False
	for k,v in paths.iteritems():
		if not f:
			f = True
		else:
			print ','
		s = ('  "%s": %s' % (k,v)).replace("'","\"")
		print s,
	print '}}'
def main():
	parseFile(sys.stdin, config)

main()
	
