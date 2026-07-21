PING PONG -> it only check connection is alive or not 

SET KEY "VALUE"

KEY = any unique name
VALUE = what ever 


GET KEY 
it return only value

MGET key1, key2, key3 
it return all mentions keys together data
MGET = Multiple GET 
it returns data O(N) N = number keys


GETRANGE key [ RANGE in number] -> 0 3
0 = start 3 = end

SETRANGE
take O(1)

INCR -> incrmenet number by one if key deosn't exist then first create then set with 1

INCR notsetyet 
1
INCR notsetyet
2


SETEX store value a particular time ( TTL = Time to Live )

SETEX name 100 "ANUPAM 
100 sec

DEL Exact keyname
DEL Name 
integer 0 -> means not found 
DEL name 
integer 1 -> means found and delete


SADD  =  add one or more members to a Set.
SADD KEY MEMBER
SADD languages "JavaScript"
KEY = languages
Member = Javascript

it takes O(n) , n is memeber

SADD languages "TypeScript" "Python" "Go"
and get not works here 
SMEMBERS languages 
KEY = languages
SMEMBERS = used for fetching set number while we create via SADD


SET 
GET 
MGET
SETEX
DEL
INCR
SADD
SMEMBERS
