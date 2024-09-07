class User:
    def __init__(self, name, email):
        self._name = name
        self._email = email
    
    def get_name(self):
        return self._name
    
    def get_email(self):
        return self._email
        
    def do_something(self):
        print ("Hello, I'm " + str(self))
        
    def __str__(self):
        return self._name + ", " + self._email

def callMe():
    a = 10
    return a * a


users_list = [User("test1", "test1@mail.com")]
a = 1

for user in users_list:
    a += 1
    b = 11
    callMe()
    # user.do_something()