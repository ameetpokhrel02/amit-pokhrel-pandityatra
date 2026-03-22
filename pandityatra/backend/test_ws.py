import asyncio
import websockets
import json

async def test():
    uri = "ws://localhost:8000/ws/video/bk-24-naming-ceronomy/?token=dummy"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            await websocket.send(json.dumps({"type": "heartbeat"}))
            res = await websocket.recv()
            print("Received:", res)
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
