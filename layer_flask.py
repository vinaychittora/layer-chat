# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify
from layer import generate_identity_token


from flask.ext.cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/identity_token", methods=['POST'])
def get_identity_token():
    user_id = request.form.get('user_id', '')
    nonce = request.form.get('nonce', '')

    if not (user_id and nonce):
        return "Invalid Request."

    # Create the token
    identityToken = generate_identity_token(user_id, nonce)

    # Return our token with a JSON Content-Type
    return jsonify({"identity_token": identityToken.strip()})

    
if __name__ == "__main__":
    app.run(host='0.0.0.0')
