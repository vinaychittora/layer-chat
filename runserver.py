import cherrypy
import os
import json
from layer import generate_identity_token
from LayerClient import LayerClient


LAYER_APP_ID = 'e9fa7cf0-e428-11e5-bd3c-a952f30d69c0'
LAYER_APP_TOKEN = 'L4hzgCQ3ETX6sMmxtjQonMEMT6FTq3KyKcOwJMiEImGstsDP'

DEBUG = True
if DEBUG:
    CURATOR_LIST = ["5819256595808256","6403889603543040"]
else:
    CURATOR_LIST = ["5819256595808256","6403889603543040"]




def cors():
    if cherrypy.request.method == 'OPTIONS':
        # preflign request 
        # see http://www.w3.org/TR/cors/#cross-origin-request-with-preflight-0
        cherrypy.response.headers['Access-Control-Allow-Methods'] = 'PUT'
        cherrypy.response.headers['Access-Control-Allow-Headers'] = 'origin, content-type, accept, Authorization'
        cherrypy.response.headers['Access-Control-Allow-Origin'] = '*'
        # tell CherryPy no avoid normal handler
        return True
    else:
        cherrypy.response.headers['Access-Control-Allow-Origin'] = '*'


cherrypy.tools.cors = cherrypy._cptools.HandlerTool(cors)


class LayerBackend(object):
    def __init__(self):
        cherrypy.config.update({'server.socket_host': '0.0.0.0'})


    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    def identity_token(self, user_id, nonce, **params):
        cherrypy.response.headers['Access-Control-Allow-Origin'] = '*'
        cherrypy.response.headers['Access-Control-Allow-Headers'] = 'origin, content-type, accept, Authorization'
        cherrypy.response.headers['content-type'] = 'application/json'

        if not (user_id and nonce):
            return "Invalid Request."

        # Create the token
        identityToken = generate_identity_token(user_id, nonce)

        # Return our token with a JSON Content-Type
        return json.dumps({"identity_token": identityToken.strip()})


    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    def set_conversation(self, convuuid, participants=""):
        client = LayerClient.PlatformClient(
            LAYER_APP_ID,
            LAYER_APP_TOKEN,
        )

        ALL_PARTICIPENTS = list(set(CURATOR_LIST + [p.strip() for p in participants.split(',')]))

        try:
            res = client.add_participents(convuuid, ALL_PARTICIPENTS)
        except:
            return json.dumps({"status":False, 'msg':'Something went wrong'})
        return json.dumps({"status":True})
        
            

if __name__ == '__main__':
    cherrypy.quickstart(LayerBackend())
