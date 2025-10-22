import random
import turtle
import time
import http.client

def go():
    in1=input("请输入：")
    if in1=="在线人数":
        conn = http.client.HTTPSConnection("121.43.243.152",6810)
        payload = ''
        headers = {
            'Authorization': 'Bearer <token>'
        }
        conn.request("GET", "/api/clients", payload, headers)
        res = conn.getresponse()
        data = res.read()
        print(data.decode("utf-8"))
        elif in1=="退出":
            exit()

go()