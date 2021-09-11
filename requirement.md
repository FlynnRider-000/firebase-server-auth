nodejs app with simple firebase auth using pug
must use bootstrap for styling and must be responsive to mobile, tablet. desktop
the must have routes are below for email auth
*must to csrf token and session token
*guideline for auth https://github.com/satansdeer/firebase-server-auth/tree/master/step-2

/signup -two types of users(user,admin)
/login
/logout
/forgotpassword
/deleteuser

/user after login redirect to this route if the user is of type user -use auth claims to check
/admin after login redirect to this route if the user is of type admin -use auth claims to check

if authenticated show the dropdown button and the dropdown should contain logout,delete account,add todos, todo list

pug parent layout must have 
<meta charset="utf-8" /> for todos in different languages
header,footer,nav sidebar and replacable content block(where auth content and todo content goes)

additional routes $200 bonus
*you may use firestore for storage(ask me to be added to project or just store in an array in local storage)
/addtodo
-let an authenticated user add to todo list with title, imageurl, description, redirect to login if not authenticated
-prevent duplicate titles
/listtodo
-let an authenticated user add to todo list with title, imageurl, description, redirect to login if not authenticated
-every 5 todo's display a box with an rounded orange outline
