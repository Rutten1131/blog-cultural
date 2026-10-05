import pymysql
import json

conn = pymysql.connect(
    host='mysql.us.stackcp.com',
    port=45103,
    user='redes-sociales-353039343411',
    password='3@(k&Q]>#m-',
    database='redes-sociales-353039343411',
    cursorclass=pymysql.cursors.DictCursor
)
with conn.cursor() as cur:
    cur.execute('''
        SELECT sp.id, sp.platform, sp.type, sp.status, sp.scheduledAt, sp.publishedAt, sp.errorMessage, sp.mediaUrl
        FROM ScheduledPost sp
        JOIN SocialAccount sa ON sp.socialAccountId = sa.id
        WHERE sa.businessId = 'cmug0rtdw000004l64a29y0ux'
        ORDER BY sp.createdAt DESC
        LIMIT 6
    ''')
    rows = cur.fetchall()
    for r in rows:
        if r.get('scheduledAt'): r['scheduledAt'] = str(r['scheduledAt'])
        if r.get('publishedAt'): r['publishedAt'] = str(r['publishedAt'])
    print(json.dumps(rows, indent=2))
conn.close()
