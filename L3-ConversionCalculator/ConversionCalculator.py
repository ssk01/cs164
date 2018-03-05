from L0_parser import parse,init
import re
from functools import reduce

env = {}
def log(*args):
    for a in args:
        print(a,end='   ')
    print('')
def eval(e):
    if type(e) == type(1): return (e, {})
    if type(e) == type(1.1): return (e, {})
    if type(e) == type('s'): return lookupUnit(e)
    if type(e) == type(()): 
        #tuple: (+, 1, 1)
        # eva* 1000 m, 
        if type(e[0]) is type(1) or type(e[0]) is type(1.0) and type(e[1]) is type({}): return e
        if e[0] == '+': return add(eval(e[1]), eval(e[2]))
        if e[0] == '-': return sub(eval(e[1]), eval(e[2]))
        if e[0] == '*': return mul(eval(e[1]), eval(e[2]))
        if e[0] == '/': return div(eval(e[1]), eval(e[2]))
        if e[0] == '^': return pow1(eval(e[1]), eval(e[2]))
        if e[0] == 'in': return inUnit(eval(e[1]), e[2])
        if e[0] == '=' : env[e[1]] = e[2]; return None  # RHS is not evaluated here ...
        if e[0] == 'id': return eval(env[e[1]])
        if e[0] == 'SI': env[e[1]] = (1, {e[1]:1})

def lookupUnit(u):
    return {}[u];

def add(lhs, rhs):
    num1, units1 = lhs
    num2, units2 = rhs
    if units1 != units2: raise Exception("adding incompatible units")
    return (num1 + num2, units1)

def sub(lhs, rhs):
    num1, units1 = lhs
    num2, units2 = rhs
    if units1 != units2: raise Exception("subing incompatible units")
    return (num1 - num2, units1)

def mul(lhs, rhs):
    num1, units1 = lhs
    num2, units2 = rhs
    return (num1 * num2, mulUnits(units1, units2))

def div(lhs, rhs):
    num1, units1 = lhs
    num2, units2 = rhs
    return (num1 / num2, divUnits(units1, units2))

def pow1(lhs, rhs):    
    num1, units1 = lhs
    num2, units2 = rhs
    if units2 != {}: raise Exception("exponent must be unit-less value")
    return (num1**num2, powUnits(units1, num2))

def canonize(u):
    # print(u)
    return dict([(s, u[s]) for s in u if u[s] != 0])

def mulUnits(u1, u2):
    u3 = u2.copy()
    for u in u1:
        if u in u2: 
            u3[u] = u1[u] + u2[u]
        else:
            u3[u] = u1[u]
    return canonize(u3)


def divUnits(u1, u2):
    u3 = u1.copy()
    for u in u2:
        if u in u1: 
            u3[u] = u1[u] - u2[u]
        else:
            u3[u] = -u2[u]
    return canonize(u3)

def powUnits(u, n):
    return canonize(dict([(one, u[one]*n) for one in u]))
def normalize(e):
    if type(e) is type('unit'): return {e:1}
    elif type(e) is type(()):
        if e[0] == 'id': return {e[1]:1}
        if e[0] == '*': return mulUnits(normalize(e[1]), normalize(e[2]))
        if e[0] == '/': return divUnits(normalize(e[1]), normalize(e[2]))
        if e[0] == '^': return powUnits(normalize(e[1]), e[2]) 
        else:
            raise Exception('can not set in 'in' and be normalize')
def inUnit(nu, C):
    n1, u1 = nu
    n2, u2 = eval(C)
    # log('n2 should be 1: ', n2)
    u2_non_SI = normalize(C)
    if u1 != u2: raise ValueError("incompatible unit")
    else:
        return (n1/n2, u2_non_SI)


# p30 = 'ft'                                   # ft
# p31 = ('+', 'ft', 'in')                      # ft+m
# p32 = ('/', ('*', 'm', 'ft'), ('^', 's', 2)) # m ft / s^2
# p33_ = ('-','ft','s')                       # incompatible units
# p34 = ('/', 'm', 'year')

# p1 = ('*' ,2 ,('*', 'm', ('^' ,'s', -1)))
# p3= ('*', 'm', ('^' ,'s', -1))
# p2 = ('in', ('*', 2 ,('*' ,'m', ('^', 's' ,-1))) ,('/', 'ft' ,'year'))
def runTests(tests):
    for p in tests:
        print("%s \t--> %s" % (p, eval(parse(p))))

def runFailedTests(tests):
    for p in tests:
        try:
            eval(p)
            print("%s FAILED" % (p,))
        except Exception as exc: print("OK %s" % exc)

myUnits = (
    'SI s',  'minute = 60 s','hour = 60 minute','day = 24 hour','month = 30.5 day','year = 365 day', 'year in s',
    'SI m',  'km = 1000 m', 'ft = 0.3048 m', 'inch = 0.0254 m','yard = 36 inch',
             'acre = 4840 yard^2'
    )

# tests = (
#              'SI m',
#              'm',
#              'km = 1000 m',
#              '2 km',
#              'ft = 0.3048 m',
#              '100000 ft in km'  
#              )  
tests = (   """
            now = 2009 year + 9 month + 3 day + 1 hour + 3 minute
            deadline = 2009 year + 11 month + 3 day
            timeLeft = deadline - now
            timeLeft in day
            now = 2009 year + 9 month + 4 day + 1 hour + 3 minute
            timeLeft in day
            """,
             )

def formatUnit(U):
    q = lambda a,b,c:(b,c)[not a]
    return reduce(lambda s,u: s+u+q(U[u]==1,'','^'+str(U[u]))+' ', sorted(U.keys()), '')

def runTests(tests):
    for t in tests:
        for line in re.split(r'\s*\n\s*',t,re.MULTILINE):
            # print(line)
            if line == '': continue
            #print "'"+line+"'"
            r = eval(parse(line))
            if r != None:
                (q,U) = r
                print('%s --> %s %s' % (line, q, formatUnit(U)))
                
runTests(myUnits + tests)
# runTests(myUnits+('2 m s^-1',
#           '2 m s^-1 in ft/year'))
# runFailedTests((p33_,))
