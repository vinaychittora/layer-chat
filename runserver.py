import cherrypy
import os
import json
from layer import generate_identity_token
from json import dumps, loads, JSONEncoder, JSONDecoder

class PythonObjectEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (list, dict, str, unicode, int, float, bool, type(None))):
            return JSONEncoder.default(self, obj)
        return {'_python_object': pickle.dumps(obj)}

def as_python_object(dct):
    if '_python_object' in dct:
        return pickle.loads(str(dct['_python_object']))
    return dct

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""

    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    if isinstance(obj, ObjectId):
        return str(obj)
    raise TypeError ("Type not serializable")

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
    def identity_token(self, user_id, nonce):
        cherrypy.response.headers['Access-Control-Allow-Origin'] = '*'
        cherrypy.response.headers['Access-Control-Allow-Headers'] = 'origin, content-type, accept, Authorization'
        cherrypy.response.headers['content-type'] = 'application/json'

        if not (user_id and nonce):
            return "Invalid Request."

        # Create the token
        identityToken = generate_identity_token(user_id, nonce)

        # Return our token with a JSON Content-Type
        return json.dumps({"identity_token": identityToken.strip()})



if __name__ == '__main__':
    cherrypy.quickstart(LayerBackend())
