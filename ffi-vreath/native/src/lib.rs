#[macro_use]
extern crate neon;
use neon::prelude::*;
mod crypto;

register_module!(mut cx, {
    cx.export_function("get_sha256", crypto::get_sha256);
    cx.export_function("generate_key", crypto::generate_key);
    cx.export_function("private2public",crypto::private2public);
    cx.export_function("get_shared_secret",crypto::get_shared_secret);
    cx.export_function("recoverable_sign",crypto::recoverable_sign);
    cx.export_function("recover_public_key",crypto::recover_public_key);
    cx.export_function("verify_sign",crypto::verify_sign)
});
