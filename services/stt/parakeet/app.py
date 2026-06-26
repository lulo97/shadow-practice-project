import ctypes
import json
import os
import tempfile
import argparse
from flask import Flask, request, jsonify
from waitress import serve
import wave
import subprocess


def normalize_wav(input_path):
    output_path = input_path + ".16k.wav"

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            input_path,
            "-ac",
            "1",
            "-ar",
            "16000",
            "-sample_fmt",
            "s16",
            output_path,
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    return output_path

def check_wav(path):
    with wave.open(path, "rb") as w:
        print(
            "WAV:",
            "channels=", w.getnchannels(),
            "rate=", w.getframerate(),
            "bits=", w.getsampwidth()*8,
            "frames=", w.getnframes()
        )

# -------------------------
# CLI
# -------------------------

parser = argparse.ArgumentParser(
    prog="parakeet-server",
    description="Parakeet Whisper compatible server"
)

parser.add_argument(
    "--model",
    "-m",
    default="assets/tdt_ctc-110m-f16.gguf",
    help="Path to parakeet GGUF model"
)

parser.add_argument(
    "--port",
    "-p",
    type=int,
    default=8000,
    help="HTTP port"
)

parser.add_argument(
    "--host",
    default="0.0.0.0",
    help="Bind address"
)

parser.add_argument(
    "--dll",
    default="assets/parakeet.dll",
    help="Parakeet DLL path"
)

args = parser.parse_args()


app = Flask(__name__)


# -------------------------
# Load DLL
# -------------------------

print(f"Loading DLL: {args.dll}")

lib = ctypes.CDLL(args.dll)


# -------------------------
# C API
# -------------------------

lib.parakeet_capi_load.argtypes = [
    ctypes.c_char_p
]

lib.parakeet_capi_load.restype = ctypes.c_void_p


lib.parakeet_capi_transcribe_path.argtypes = [
    ctypes.c_void_p,
    ctypes.c_char_p,
    ctypes.c_int
]

lib.parakeet_capi_transcribe_path.restype = ctypes.c_void_p


lib.parakeet_capi_free_string.argtypes = [
    ctypes.c_void_p
]

lib.parakeet_capi_free_string.restype = None


lib.parakeet_capi_last_error.argtypes = [
    ctypes.c_void_p
]

lib.parakeet_capi_last_error.restype = ctypes.c_char_p



# -------------------------
# Load model once
# -------------------------

print(f"Loading model: {args.model}")

ctx = lib.parakeet_capi_load(
    args.model.encode()
)

if not ctx:
    raise RuntimeError(
        "Failed loading model"
    )

print("Parakeet ready")



# -------------------------
# Helpers
# -------------------------

def transcribe_wav(path):

    print("Transcribing:", path)

    check_wav(path)

    result = lib.parakeet_capi_transcribe_path(
        ctx,
        path.encode(),
        0
    )

    if not result:
        err = lib.parakeet_capi_last_error(ctx)

        raise RuntimeError(
            err.decode()
        )


    text = ctypes.cast(
        result,
        ctypes.c_char_p
    ).value.decode()


    lib.parakeet_capi_free_string(result)

    return text



# -------------------------
# Routes
# -------------------------

@app.get("/health")
def health():

    return {
        "status": "ok",
        "model": args.model
    }



@app.post("/v1/audio/transcriptions")
def whisper_api():

    if "file" not in request.files:
        return jsonify({
            "error": "missing file"
        }), 400


    audio = request.files["file"]


    suffix = (
        os.path.splitext(
            audio.filename
        )[1]
        or ".wav"
    )


    temp = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix
    )


    audio.save(temp.name)

    check_wav(temp.name)

    wav16k = normalize_wav(temp.name)

    check_wav(wav16k)

    text = transcribe_wav(
        wav16k
    )

    temp.close()

    if os.path.exists(temp.name):
        os.remove(temp.name)

    if "wav16k" in locals() and os.path.exists(wav16k):
        os.remove(wav16k)

    return jsonify({
        "text": text
    })



@app.post("/transcribe")
def transcribe():

    return whisper_api()

@app.post("/v1/audio/transcriptions/timestamps")
def whisper_timestamps():

    if "file" not in request.files:
        return jsonify({
            "error": "missing file"
        }), 400

    audio = request.files["file"]

    temp = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".wav"
    )

    audio.save(temp.name)

    wav16k = normalize_wav(temp.name)

    result = lib.parakeet_capi_transcribe_path_json(
        ctx,
        wav16k.encode(),
        0
    )

    if not result:
        err = lib.parakeet_capi_last_error(ctx)
        return jsonify({
            "error": err.decode()
        }), 500


    data = ctypes.cast(
        result,
        ctypes.c_char_p
    ).value.decode()


    lib.parakeet_capi_free_string(result)

    temp.close()

    if os.path.exists(temp.name):
        os.remove(temp.name)

    data_json = json.loads(data)

    return jsonify({
        "text": data_json["text"],
        "words": data_json["words"]
    })

# -------------------------
# Main
# -------------------------

if __name__ == "__main__":

    print()
    print("==============================")
    print(" Parakeet Server")
    print("==============================")
    print(f" host  : {args.host}")
    print(f" port  : {args.port}")
    print(f" model : {args.model}")
    print()

    print("""
    API:
    GET  /health

    POST /v1/audio/transcriptions
        curl -X POST -F file=@audio.wav http://localhost:{port}/v1/audio/transcriptions
        {{
            "text": "Every year, humans change ten million hectares of land."
        }}

    POST /transcribe
        curl -X POST -F file=@audio.wav http://localhost:{port}/transcribe
        {{
            "text": "Every year, humans change ten million hectares of land."
        }}
          
    POST /v1/audio/transcriptions/timestamps
        curl -X POST -F file=@audio.wav http://localhost:{port}/v1/audio/transcriptions/timestamps
        {{
        "text": "Every year, humans change ten million hectares of land.",
        "words": [
            {{
            "conf": 0.9986,
            "end": 0.96,
            "start": 0.64,
            "w": "Every"
            }},
        ]
        }}

    Options:
    model : {model}
    host  : {host}
    port  : {port}
    """.format(
        port=args.port,
        model=args.model,
        host=args.host
    ))

    serve(
        app,
        host=args.host,
        port=args.port,
        threads=8
    )