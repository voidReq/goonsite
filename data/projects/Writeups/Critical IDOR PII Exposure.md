### March 5, 2026 - Undisclosed Company (~100k accounts, few thousand paying)

I recently discovered a critical IDOR vulnerability that allowed me to access unique stripe links of customers on the webpage. I chained this with an exposure of the backend user_id's of users, and reported it.


### Process 
- I was testing race conditions on the website. It was set up in such a way that users could see only a certain number of pages on the website prior to paying, and I was attempting to index the entire website in one rapid burst---if it were vulnerable to race conditions, I would have grabbed all of the information before the website even noticed I exceeded my quota.
- Unfortunately, I was unsuccessful. I did manage to find a slight race condition, but only 10% more pages than intended—not a very large vulnerability.
- On a whim, I started exploring my sitemap in Caido, and found a request I hadn't inspected before, that looked something like this:
```HTTP
POST /settings?tab=billing HTTP/1.1
Host: goonsite.org
User-Agent: 
next-action:
Cookie:

["my_id",true]
```
- It returned something like this:
```HTTP
HTTP/1.1 200 OK

0:{"some info"}
1:{"success":true,"redirectUrl":"https://billing.stripe.com/p/session/live_stripe_id","message":""}

```
- I then tried to see if I could access other users' stripe links by changing the id in the request body:
```HTTP
POST /settings?tab=billing HTTP/1.1
Host: goonsite.org
User-Agent: 
next-action:
Cookie:

["other_user_id",true]
```
- It returned the stripe live link of the other user. Unfortunately, the "other user" whose ID I used was my alt, and I only knew the UUID from the requests I had logged—I had no idea how to get UUIDs of other users.
- I checked the profile page of my alt, inspected element, and searched for the UUID. I found that profile pictures were in the form of CloudFront URLs, with the UUID exposed in the URL. This meant that I could find the UUID of any user with a profile picture, and thus access their unique stripe link

### Impact
- Among the data included in their stripe portal was:
    - Email address
    - Full name
    - Partial credit card number
    - Physical address
- I could also manage their subscription and added cards

### Takeaway/resolution
- The issue was resolved by ensuring the UUID (which was part of the cookie) matched the cookie in the body of the POST request
- Profile picture URLs were altered to use a randomized ID, and to be accessed via the website's URL (e.g., goonsite.org/public/pfps/{random_ID})
- The CEO was kind enough to reward me with a small bounty, asking only that I not identify the website in any public reports
- Authenticate properly!



