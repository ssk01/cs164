import re
lookupUnit = lambda u: {}[u]

def init(evallookup):
    global lookupUnit
    lookupUnit = lambda u: {}[u]
def token(p, s):
    #todo in SI 右边应该是空格
    m = re.match('[ \t\f\v]*', s)
    mm = re.match(p, s[m.end():])
    if mm != None: return (mm.group(), s[m.end()+mm.end():])
    else:
        raise SyntaxError
def id(s):
    keywords = ('in','SI')
    (l,ss) = token(r'[_a-zA-Z][_a-zA-Z0-9]*',s)
    if l in keywords: raise SyntaxError('id false')
    else:
        return (l, ss)
#垃圾名字，我不喜欢。addexp就是后bnf的符号是add
def addexp(s):
    (lhs, ss) = mulexp(s)
    try:
        while True:
            (op, ss) = token(r'(\+|-)', ss)
            (rhs, ss) = mulexp(ss)
            lhs = (op, lhs, rhs)
    except SyntaxError:
        return (lhs, ss)

def mulexp(s):
    (lhs, ss) = expexp(s)
    try:
        while True:
            (op, ss) = token(r'(/|\*|)', ss)
            (rhs, ss) = expexp(ss)
            if op=='': op='*'
            lhs = (op, lhs, rhs)
    except SyntaxError:
        return (lhs, ss)


def expexp(s):
    (e, ss) = parexp(s)
    try:
        while True:
            (op, ss) = token(r'(\^)', ss)
            (rhs, ss) = parexp(ss)
            e = (op, e, rhs)
    except SyntaxError:
        return (e, ss)

def parexp(s):
    try:
        (lhs, ss) = token(r'(\()', s)
        (e, ss) = addexp(ss)            
        (lhs, ss) = token(r'(\))', ss)
        return (e, ss)
    except SyntaxError:
        try:
            return primexp(s)
        except SyntaxError:
            raise SyntaxError            
def primexp(s):
    """
        Prim ::= intLit | floatLit | unit | id | SI name
    """  
    (lex,ss) = token(r'[0-9a-zA-Z\.\-]+',s)
    try: return (int(lex), ss)
    except ValueError:
        try: return (float(lex), ss)
        except ValueError:
            try:
                lookupUnit(lex)  # call fails with KeyError Exception if unit unknown
                return (lex,ss)
            except KeyError: 
                (l,ss) = id(s)
                return (('id',l), ss)
                # raise SyntaxError
            # raise Exception('wtf')
def exp(s):
    return addexp(s)
def asmt(s):
    (lhs, s) = id(s)
    (_, s) = token('=', s)
    (rhs, s) = exp(s)
    return (('=', lhs, rhs), s)
def parse(s):
    print(s)
    try:
        (_, s) = token('SI', s)
        (e, s) = token('[a-zA-Z]+', s)
        e = ('SI', e)
    except SyntaxError:
        try:
            (e, s) = asmt(s)
        except SyntaxError:
            try:
                (e, s) = exp(s)
            except SyntaxError:
                print('wtf')
            else:
                try:
                    (_, s) = token('in', s)
                    (rhs, s) = exp(s)
                    e = ('in', e, rhs)
                except SyntaxError:
                    pass
    (_, ss) = token('', s)
    if ss != '':
        raise SyntaxError('some thing left')

    print(e)
    return e
def testMe():
    # print(parse("1 2"))
    # # print(parse("1 2 m"))
    # # print(parse("2 m"))
    # # print(parse("2m")) # 2m is currently illegal, must write 2 m
    # print(parse("1*2"))  
    # print(parse("1 2"))
    # print(parse("123"))
    # print(parse("123+456"))
    # print(parse("123+456+789"))
    # print(parse("123*456+789"))
    # print(parse("123+456*789"))
    # print(parse("1 "))
    # print(parse(" 1"))
    # print(parse("123^456+789*123/345+123"))
    # print(parse(" 1 ^ 2 + 3 * 4 / 5 + 6"))
    # print(parse("(1)"))
    # print(parse("1*(2+3)"))
    # print(parse("(1+2)*3"))
    # print(parse(" (1 + 2) * 3^(1)"))  
    # print(parse("2*m/s"))
    # print(parse("2*m*s^(-1)"))
    # print(parse("2*m*s^-1"))
    # print(parse("2 m"))
    # print(parse("3 ft/s"))
    # print(parse("3 ft/s in m/year"))
    # print(parse("x = 1"))
    # print(parse("x = 3 ft/s"))
    # print(parse("x = 3 ft/s s ft/year"))
    # try: print(parse("x = 3 ft/s in ft/year"))
    # except SyntaxError: print("OK")
    print(parse("2+d"))
    print(parse("x=x"))
    print(parse("x = 3 ft/s d ft/year"))
    print(parse("x in ft"))
    print(parse("SI m"))
# testMe()