#[macro_use]
use neon::prelude::*;
extern crate rust_vreath_core;
use self::rust_vreath_core::{crypto,util};

extern crate rand;
use self::rand::Rng;

fn vec_to_bytes32_slice(vec: &Vec<u8>)->[u8; 32]{
    let mut array:[u8;32] = [0;32];
    let bytes = &vec[..32];
    array.copy_from_slice(bytes);
    array
}

fn hex_to_bytes32_slice(hex:String)->[u8;32]{
    let vec = util::hex2vec(hex);
    vec_to_bytes32_slice(&vec)
}

fn vec_to_bytes33_slice(vec: &Vec<u8>)->[u8; 33]{
    let mut array:[u8;33] = [0;33];
    let bytes = &vec[..33];
    array.copy_from_slice(bytes);
    array
}

fn hex_to_bytes33_slice(hex:String)->[u8;33]{
    let vec = util::hex2vec(hex);
    vec_to_bytes33_slice(&vec)
}

fn vec_to_bytes64_slice(vec: &Vec<u8>)->[u8; 64]{
    let mut array:[u8;64] = [0;64];
    let bytes = &vec[..64];
    array.copy_from_slice(bytes);
    array
}

fn hex_to_bytes64_slice(hex:String)->[u8;64]{
    let vec = util::hex2vec(hex);
    vec_to_bytes64_slice(&vec)
}

pub fn get_sha256(mut cx: FunctionContext)->JsResult<JsString>{
    let data:String = cx.argument::<JsString>(0)?.value();
    let vec_data = util::hex2vec(data.to_string());
    let hash = crypto::get_sha256(&vec_data[..]);
    let hex = util::vec2hex(hash.to_vec());
    Ok(cx.string(&hex))
}

pub fn generate_key(mut cx: FunctionContext)->JsResult<JsString>{
    let private = crypto::generate_key();
    let hex = util::vec2hex(private.to_vec());
    Ok(cx.string(&hex))
}

pub fn private2public(mut cx: FunctionContext)->JsResult<JsString>{
    let private_key = cx.argument::<JsString>(0)?.value();
    let public = crypto::private2public(&hex_to_bytes32_slice(private_key));
    let hex = util::vec2hex(public.to_vec());
    Ok(cx.string(&hex))
}

pub fn get_shared_secret(mut cx: FunctionContext)->JsResult<JsString>{
    let private_key = cx.argument::<JsString>(0)?.value();
    let public_key = cx.argument::<JsString>(1)?.value();
    let shared_secret = crypto::get_shared_secret(&hex_to_bytes32_slice(private_key),&hex_to_bytes33_slice(public_key));
    let hex = util::vec2hex(shared_secret.to_vec());
    Ok(cx.string(&hex))
}


pub fn recoverable_sign(mut cx: FunctionContext)->JsResult<JsArray>{
    let private_key = cx.argument::<JsString>(0)?.value();
    let data = cx.argument::<JsString>(1)?.value();
    let (recover_id,sign_array) = crypto::recoverable_sign(&hex_to_bytes32_slice(private_key),&util::hex2vec(data)[..]);
    let js_array = JsArray::new(&mut cx, 2);
    let js_number = cx.number(recover_id);
    let js_string = cx.string(&util::vec2hex(sign_array.to_vec()));
    js_array.set(&mut cx, 0, js_number);
    js_array.set(&mut cx, 1, js_string);
    Ok(js_array)
}

pub fn recover_public_key(mut cx: FunctionContext)->JsResult<JsString>{
    let data = cx.argument::<JsString>(0)?.value();
    let sign = cx.argument::<JsString>(1)?.value();
    let recover_id = cx.argument::<JsNumber>(2)?.value() as i32;
    let key = crypto::recover_public_key(&util::hex2vec(data)[..],&hex_to_bytes64_slice(sign),recover_id);
    let hex = util::vec2hex(key.to_vec());
    Ok(cx.string(hex))
}

pub fn verify_sign(mut cx: FunctionContext)->JsResult<JsBoolean>{
    let data = cx.argument::<JsString>(0)?.value();
    let sign = cx.argument::<JsString>(1)?.value();
    let public_key = cx.argument::<JsString>(2)?.value();
    let verify = crypto::verify_sign(&util::hex2vec(data)[..],&hex_to_bytes64_slice(sign),&hex_to_bytes33_slice(public_key));
    Ok(cx.boolean(verify))
}
