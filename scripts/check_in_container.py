import os
import pymysql
import re
import urllib.parse
import json

url = os.getenv('SOCIAL_DB_URL')
if not url:
    url = "mysql://redes-sociales-353039343411:3%40%28k%26Q%7B%5D%3E%23m-@mysql.us.stackcp.com:45103/redes-sociales-353039343411"

m = re.match(r"mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)", url)
user, raw_pwd, host, port, db = m.groups()
pwd = urllib.parse.unquote(raw_pwd)

conn = pymysql.connect(
    host=host,
    port=int(port),
    user=user,
    password=pwd,
    database=db,
    cursorclass=pymysql.cursors.DictCursor
)

with conn.cursor() as cur:
    cur.execute("""
        SELECT sp.id, sp.platform, sp.type, sp.status, sp.scheduledAt, sp.publishedAt, sp.errorMessage, sp.mediaUrl
        FROM ScheduledPost sp
        JOIN SocialAccount sa ON sp.socialAccountId = sa.id
        WHERE sa.businessId = 'cmug0rtdw000004l64a29y0ux'
        ORDER BY sp.createdAt DESC
        LIMIT 6
    """)
    rows = cur.fetchall()
    for r in rows:
        if r.get('scheduledAt'): r['scheduledAt'] = str(r['scheduledAt'])
        if r.get('publishedAt'): r['publishedAt'] = str(r['publishedAt'])
    print(json.dumps(rows, indent=2))
conn.close()
